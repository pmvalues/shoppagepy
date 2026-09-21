package hub

import (
	"encoding/json"
	"log/slog"
	"sync"
	"time"

	"github.com/shoppage/chat-gateway/internal/models"
)

// Hub maintains the set of active clients and broadcasts messages to the rooms.
type Hub struct {
	// Registered clients mapped by room/conversation ID.
	rooms map[string]map[*Client]bool

	// Mutex protecting rooms map
	mu sync.RWMutex

	// Inbound register requests from clients.
	Register chan *Client

	// Unregister requests from clients.
	Unregister chan *Client

	// Broadcast channel for room-directed messages
	Broadcast chan RoomBroadcast
}

// RoomBroadcast encapsulates a message payload destined for a specific room.
type RoomBroadcast struct {
	ConversationID string
	Payload        []byte
}

// NewHub initializes and returns a new Hub instance.
func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan RoomBroadcast, 256),
	}
}

// Run executes the hub loop handling client registration and broadcasting.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			if h.rooms[client.ConversationID] == nil {
				h.rooms[client.ConversationID] = make(map[*Client]bool)
			}
			h.rooms[client.ConversationID][client] = true
			h.mu.Unlock()

			slog.Info("Client registered to room",
				"user_id", client.UserID,
				"room", client.ConversationID,
				"role", client.Role,
			)

			// Notify room of user presence
			h.BroadcastToRoom(client.ConversationID, models.ServerOutboundMessage{
				Event:          "user_joined",
				ConversationID: client.ConversationID,
				SenderID:       client.UserID,
				Timestamp:      time.Now().UTC(),
			})

		case client := <-h.Unregister:
			h.mu.Lock()
			if room, ok := h.rooms[client.ConversationID]; ok {
				if _, exists := room[client]; exists {
					delete(room, client)
					close(client.Send)
					if len(room) == 0 {
						delete(h.rooms, client.ConversationID)
					}
					slog.Info("Client unregistered from room",
						"user_id", client.UserID,
						"room", client.ConversationID,
					)
				}
			}
			h.mu.Unlock()

			// Notify room of departure
			h.BroadcastToRoom(client.ConversationID, models.ServerOutboundMessage{
				Event:          "user_left",
				ConversationID: client.ConversationID,
				SenderID:       client.UserID,
				Timestamp:      time.Now().UTC(),
			})

		case broadcast := <-h.Broadcast:
			h.mu.RLock()
			room := h.rooms[broadcast.ConversationID]
			for client := range room {
				select {
				case client.Send <- broadcast.Payload:
				default:
					close(client.Send)
					delete(room, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastToRoom serializes a server outbound message and delivers it to the room broadcast queue.
func (h *Hub) BroadcastToRoom(conversationID string, msg models.ServerOutboundMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		slog.Error("Failed to serialize outbound message", "err", err)
		return
	}

	h.Broadcast <- RoomBroadcast{
		ConversationID: conversationID,
		Payload:        data,
	}
}

// GetRoomClientCount returns active client count for a room (thread-safe).
func (h *Hub) GetRoomClientCount(conversationID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.rooms[conversationID])
}

// GetTotalClientCount returns total active connected clients across all rooms.
func (h *Hub) GetTotalClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	total := 0
	for _, room := range h.rooms {
		total += len(room)
	}
	return total
}
