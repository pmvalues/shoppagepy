package models

import "time"

// SenderRole identifies who sent the message
type SenderRole string

const (
	RoleBuyer    SenderRole = "buyer"
	RoleMerchant SenderRole = "merchant"
	RoleAgent    SenderRole = "agent"
	RoleSystem   SenderRole = "system"
)

// MessageType identifies the message payload kind
type MessageType string

const (
	TypeChat     MessageType = "chat"
	TypeQuote    MessageType = "quote"
	TypeTyping   MessageType = "typing"
	TypePresence MessageType = "presence"
	TypeReceipt  MessageType = "receipt"
)

// ChatMessage represents a single message in a trade room
type ChatMessage struct {
	ID             string      `json:"id"`
	ConversationID string      `json:"conversationId"`
	SenderID       string      `json:"senderId"`
	SenderRole     SenderRole  `json:"senderRole"`
	Type           MessageType `json:"type"`
	Content        string      `json:"content"`
	Metadata       any         `json:"metadata,omitempty"`
	Timestamp      time.Time   `json:"timestamp"`
}

// QuoteLine represents an item in an active RFQ quote
type QuoteLine struct {
	CanonicalID string  `json:"canonicalId"`
	Title       string  `json:"title"`
	Brand       string  `json:"brand,omitempty"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unitPrice"`
	Total       float64 `json:"total"`
	InStock     bool    `json:"inStock"`
}

// QuotePayload represents a real-time commercial quotation negotiation
type QuotePayload struct {
	QuoteID        string      `json:"quoteId"`
	ConversationID string      `json:"conversationId"`
	MerchantID     string      `json:"merchantId"`
	BuyerID        string      `json:"buyerId"`
	Lines          []QuoteLine `json:"lines"`
	Subtotal       float64     `json:"subtotal"`
	TaxAmount      float64     `json:"taxAmount"`
	TotalAmount    float64     `json:"totalAmount"`
	Currency       string      `json:"currency"`
	Status         string      `json:"status"` // draft, submitted, countered, accepted, expired
	Notes          string      `json:"notes,omitempty"`
	ValidUntil     time.Time   `json:"validUntil"`
}

// ClientInboundMessage is the envelope received from WebSocket clients
type ClientInboundMessage struct {
	Action         string        `json:"action"` // send_message, join_room, leave_room, typing, quote_update
	ConversationID string        `json:"conversationId"`
	Content        string        `json:"content,omitempty"`
	Quote          *QuotePayload `json:"quote,omitempty"`
}

// ServerOutboundMessage is the envelope dispatched to WebSocket clients
type ServerOutboundMessage struct {
	Event          string        `json:"event"` // message_received, quote_updated, user_joined, user_left, typing, error
	ConversationID string        `json:"conversationId"`
	Message        *ChatMessage  `json:"message,omitempty"`
	Quote          *QuotePayload `json:"quote,omitempty"`
	SenderID       string        `json:"senderId,omitempty"`
	Timestamp      time.Time     `json:"timestamp"`
	Error          string        `json:"error,omitempty"`
}
