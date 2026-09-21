package hub_test

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/shoppage/chat-gateway/internal/hub"
	"github.com/shoppage/chat-gateway/internal/models"
)

func drain(ch <-chan []byte) {
	for {
		select {
		case <-ch:
		default:
			return
		}
	}
}

func TestHub_RoomIsolation(t *testing.T) {
	h := hub.NewHub()
	go h.Run()

	clientA := &hub.Client{
		Hub:            h,
		Send:           make(chan []byte, 10),
		UserID:         "buyer_1",
		Role:           models.RoleBuyer,
		ConversationID: "rfq_room_100",
	}

	clientB := &hub.Client{
		Hub:            h,
		Send:           make(chan []byte, 10),
		UserID:         "merchant_1",
		Role:           models.RoleMerchant,
		ConversationID: "rfq_room_100",
	}

	clientC := &hub.Client{
		Hub:            h,
		Send:           make(chan []byte, 10),
		UserID:         "buyer_2",
		Role:           models.RoleBuyer,
		ConversationID: "rfq_room_200", // different room
	}

	// Register clients
	h.Register <- clientA
	h.Register <- clientB
	h.Register <- clientC

	// Allow goroutine loop to process registrations
	time.Sleep(50 * time.Millisecond)

	if count := h.GetRoomClientCount("rfq_room_100"); count != 2 {
		t.Fatalf("expected 2 clients in rfq_room_100, got %d", count)
	}

	if count := h.GetRoomClientCount("rfq_room_200"); count != 1 {
		t.Fatalf("expected 1 client in rfq_room_200, got %d", count)
	}

	if total := h.GetTotalClientCount(); total != 3 {
		t.Fatalf("expected 3 total clients, got %d", total)
	}

	// Drain join notifications from all client channels
	drain(clientA.Send)
	drain(clientB.Send)
	drain(clientC.Send)

	// Broadcast message to room 100
	testMsg := models.ServerOutboundMessage{
		Event:          "message_received",
		ConversationID: "rfq_room_100",
		SenderID:       "buyer_1",
		Timestamp:      time.Now().UTC(),
	}
	h.BroadcastToRoom("rfq_room_100", testMsg)

	// Verify clientA and clientB received message_received
	select {
	case data := <-clientA.Send:
		var out models.ServerOutboundMessage
		if err := json.Unmarshal(data, &out); err != nil || out.Event != "message_received" {
			t.Fatalf("unexpected message on clientA: %s", string(data))
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("clientA timed out waiting for room broadcast")
	}

	select {
	case data := <-clientB.Send:
		var out models.ServerOutboundMessage
		if err := json.Unmarshal(data, &out); err != nil || out.Event != "message_received" {
			t.Fatalf("unexpected message on clientB: %s", string(data))
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("clientB timed out waiting for room broadcast")
	}

	// Client C should not have received any message from room 100
	select {
	case msg := <-clientC.Send:
		t.Fatalf("clientC received unexpected message from different room: %s", string(msg))
	default:
		// Success: clientC received nothing
	}

	// Unregister clientA
	h.Unregister <- clientA
	time.Sleep(50 * time.Millisecond)

	if count := h.GetRoomClientCount("rfq_room_100"); count != 1 {
		t.Fatalf("expected 1 client in rfq_room_100 after unregister, got %d", count)
	}
}
