package hub

import (
	"encoding/json"
	"log/slog"
	"time"

	"github.com/gorilla/websocket"
	"github.com/shoppage/chat-gateway/internal/models"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer (512 KB).
	maxMessageSize = 512 * 1024
)

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	Hub *Hub

	// The websocket connection.
	Conn *websocket.Conn

	// Buffered channel of outbound messages.
	Send chan []byte

	// Identifier of the connected user / merchant / agent
	UserID string

	// Role of the connected user
	Role models.SenderRole

	// Active conversation room
	ConversationID string
}

// ReadPump pumps messages from the websocket connection to the hub.
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

		var inbound models.ClientInboundMessage
		if err := json.Unmarshal(messageBytes, &inbound); err != nil {
			slog.Warn("Invalid JSON payload from client", "user_id", c.UserID, "err", err)
			continue
		}

		convID := inbound.ConversationID
		if convID == "" {
			convID = c.ConversationID
		}

		switch inbound.Action {
		case "send_message":
			msg := &models.ChatMessage{
				ID:             generateID("msg"),
				ConversationID: convID,
				SenderID:       c.UserID,
				SenderRole:     c.Role,
				Type:           models.TypeChat,
				Content:        inbound.Content,
				Timestamp:      time.Now().UTC(),
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
			outbound := models.ServerOutboundMessage{
				Event:          "typing",
				ConversationID: convID,
				SenderID:       c.UserID,
				Timestamp:      time.Now().UTC(),
			}
			c.Hub.BroadcastToRoom(convID, outbound)

		case "quote_update":
			if inbound.Quote != nil {
				inbound.Quote.ConversationID = convID
				outbound := models.ServerOutboundMessage{
					Event:          "quote_updated",
					ConversationID: convID,
					Quote:          inbound.Quote,
					SenderID:       c.UserID,
					Timestamp:      time.Now().UTC(),
				}
				c.Hub.BroadcastToRoom(convID, outbound)
			}
		}
	}
}

// WritePump pumps messages from the hub to the websocket connection.
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
				// The hub closed the channel.
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			_, _ = w.Write(message)

			// Add queued chat messages to the current websocket message.
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
