package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/shoppage/chat-gateway/internal/hub"
	"github.com/shoppage/chat-gateway/internal/models"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type ChatHandler struct {
	hub     *hub.Hub
	sink    hub.MessageSink
	limiter *hub.RateLimiter
}

func NewChatHandler(h *hub.Hub, sink hub.MessageSink, limiter *hub.RateLimiter) *ChatHandler {
	return &ChatHandler{hub: h, sink: sink, limiter: limiter}
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
	case models.RoleSystem:
		role = models.RoleSystem
	}

	conn, err := upgrader.Upgrade(w, r, nil)
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
	Status       string    `json:"status"`
	Service      string    `json:"service"`
	Version      string    `json:"version"`
	ActiveRooms  int       `json:"activeRooms"`
	ActiveUsers  int       `json:"activeUsers"`
	Timestamp    time.Time `json:"timestamp"`
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
