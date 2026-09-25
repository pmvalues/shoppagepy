package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/shoppage/chat-gateway/internal/hub"
	"github.com/shoppage/chat-gateway/internal/models"
	"github.com/shoppage/platform/env"
)

type ChatHandler struct {
	hub      *hub.Hub
	sink     hub.MessageSink
	limiter  *hub.RateLimiter
	upgrader websocket.Upgrader
}

// NewChatHandler builds the WebSocket handler. Browser upgrades are accepted
// only from the page's own host or an origin in ALLOWED_ORIGINS, which blocks
// cross-site WebSocket hijacking; non-browser clients send no Origin.
func NewChatHandler(h *hub.Hub, sink hub.MessageSink, limiter *hub.RateLimiter) *ChatHandler {
	allowed := map[string]bool{}
	for _, o := range env.AllowedOrigins() {
		allowed[strings.ToLower(strings.TrimRight(o, "/"))] = true
	}
	return &ChatHandler{hub: h, sink: sink, limiter: limiter, upgrader: websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			if origin == "" {
				return true
			}
			u, err := url.Parse(origin)
			if err != nil {
				return false
			}
			return strings.EqualFold(u.Host, r.Host) || allowed[strings.ToLower(origin)]
		},
	}}
}

func (h *ChatHandler) ServeWS(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("roomId")
	if roomID == "" {
		http.Error(w, `{"error":"missing roomId query parameter"}`, http.StatusBadRequest)
		return
	}

	userID := r.URL.Query().Get("userId")
	if userID == "" {
		userID = "user_" + time.Now().Format("150405")
	}

	roleStr := r.URL.Query().Get("role")
	role := models.RoleBuyer
	switch models.SenderRole(roleStr) {
	case models.RoleMerchant:
		role = models.RoleMerchant
	case models.RoleAgent:
		role = models.RoleAgent
	}
	// RoleSystem is reserved for server-originated events and is never
	// accepted from a client.

	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("Failed to upgrade websocket", "err", err)
		return
	}

	client := &hub.Client{
		Hub:            h.hub,
		Conn:           conn,
		Send:           make(chan []byte, 256),
		UserID:         userID,
		Role:           role,
		ConversationID: roomID,
		Sink:           h.sink,
		Limiter:        h.limiter,
	}

	h.hub.Register <- client

	if h.sink != nil {
		if history, err := h.sink.RecentMessages(roomID, 50); err == nil && len(history) > 0 {
			for i := range history {
				m := history[i]
				out := models.ServerOutboundMessage{
					Event:          "message_received",
					ConversationID: roomID,
					Message:        &m,
					SenderID:       m.SenderID,
					Timestamp:      m.Timestamp,
				}
				data, _ := json.Marshal(out)
				select {
				case client.Send <- data:
				default:
				}
			}
		}
	}

	go client.WritePump()
	go client.ReadPump()
}

type HealthResponse struct {
	Status      string    `json:"status"`
	Service     string    `json:"service"`
	Version     string    `json:"version"`
	ActiveRooms int       `json:"activeRooms"`
	ActiveUsers int       `json:"activeUsers"`
	Timestamp   time.Time `json:"timestamp"`
}

func (h *ChatHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	resp := HealthResponse{
		Status:      "healthy",
		Service:     "shoppage-chat-gateway",
		Version:     "1.0.0",
		ActiveUsers: h.hub.GetTotalClientCount(),
		Timestamp:   time.Now().UTC(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
