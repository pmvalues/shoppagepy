package hub

import (
	"encoding/json"
	"log/slog"
	"time"

	"github.com/gorilla/websocket"
	"github.com/shoppage/chat-gateway/internal/models"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024
)

type MessageSink interface {
	SaveMessage(m *models.ChatMessage) error
	RecentMessages(conversationID string, limit int) ([]models.ChatMessage, error)
}

type Client struct {
	Hub            *Hub
	Conn           *websocket.Conn
	Send           chan []byte
	UserID         string
	Role           models.SenderRole
	ConversationID string
	Sink           MessageSink
	Limiter        *RateLimiter
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, messageBytes, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				slog.Warn("WebSocket unexpected close", "user_id", c.UserID, "err", err)
			}
			break
		}

		var raw map[string]json.RawMessage
		if err := json.Unmarshal(messageBytes, &raw); err != nil {
			slog.Warn("Invalid JSON payload from client", "user_id", c.UserID, "err", err)
			continue
		}

		var inbound models.ClientInboundMessage
		if err := json.Unmarshal(messageBytes, &inbound); err != nil {
			slog.Warn("Invalid client envelope", "user_id", c.UserID, "err", err)
			continue
		}

		if inbound.Action == "" {
			if t, ok := raw["type"]; ok {
				var typ string
				_ = json.Unmarshal(t, &typ)
				if typ == "chat" {
					inbound.Action = "send_message"
				}
			}
		}
		if inbound.ConversationID == "" {
			if r, ok := raw["roomId"]; ok {
				_ = json.Unmarshal(r, &inbound.ConversationID)
			}
		}
		if inbound.Content == "" {
			if r, ok := raw["content"]; ok {
				_ = json.Unmarshal(r, &inbound.Content)
			}
		}

		convID := inbound.ConversationID
		if convID == "" {
			convID = c.ConversationID
		}

		switch inbound.Action {
		case "send_message":
			if inbound.Content == "" {
				continue
			}
			if c.Limiter != nil && !c.Limiter.Allow(c.UserID) {
				c.Hub.BroadcastToRoom(convID, models.ServerOutboundMessage{
					Event:          "error",
					ConversationID: convID,
					SenderID:       c.UserID,
					Error:          "rate_limited",
					Timestamp:      time.Now().UTC(),
				})
				continue
			}
			msg := &models.ChatMessage{
				ID:             generateID("msg"),
				ConversationID: convID,
				SenderID:       c.UserID,
				SenderRole:     c.Role,
				Type:           models.TypeChat,
				Content:        inbound.Content,
				Timestamp:      time.Now().UTC(),
			}
			if c.Sink != nil {
				if err := c.Sink.SaveMessage(msg); err != nil {
					slog.Error("Failed to persist chat message", "err", err)
				}
			}
			outbound := models.ServerOutboundMessage{
				Event:          "message_received",
				ConversationID: convID,
				Message:        msg,
				SenderID:       c.UserID,
				Timestamp:      msg.Timestamp,
			}
			c.Hub.BroadcastToRoom(convID, outbound)

		case "typing":
			if c.Limiter != nil && !c.Limiter.Allow(c.UserID+":typing") {
				continue
			}
			c.Hub.BroadcastToRoom(convID, models.ServerOutboundMessage{
				Event:          "typing",
				ConversationID: convID,
				SenderID:       c.UserID,
				Timestamp:      time.Now().UTC(),
			})

		case "quote_update":
			if inbound.Quote != nil {
				inbound.Quote.ConversationID = convID
				c.Hub.BroadcastToRoom(convID, models.ServerOutboundMessage{
					Event:          "quote_updated",
					ConversationID: convID,
					Quote:          inbound.Quote,
					SenderID:       c.UserID,
					Timestamp:      time.Now().UTC(),
				})
			}
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			_, _ = w.Write(message)

			n := len(c.Send)
			for i := 0; i < n; i++ {
				_, _ = w.Write([]byte{'\n'})
				_, _ = w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func generateID(prefix string) string {
	return prefix + "_" + time.Now().Format("20060102150405.000000")
}
