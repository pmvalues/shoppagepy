package store

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	_ "modernc.org/sqlite"

	"github.com/shoppage/chat-gateway/internal/models"
)

type Store struct {
	db *sql.DB
	mu sync.Mutex
}

func Open(path string) (*Store, error) {
	if path == "" {
		if dir, err := os.MkdirTemp("", "shoppage-chat-*"); err == nil {
			path = filepath.Join(dir, "chat.db")
		} else {
			path = "file:chat-gateway?mode=memory&cache=shared"
		}
	}
	if dir := filepath.Dir(path); dir != "." && dir != "" {
		_ = os.MkdirAll(dir, 0o755)
	}
	db, err := sql.Open("sqlite", path+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)")
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	db.SetMaxOpenConns(1)
	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("ping sqlite: %w", err)
	}
	schema := `
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp DATETIME NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_conv_ts ON messages(conversation_id, timestamp);
`
	if _, err := db.Exec(schema); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("migrate sqlite: %w", err)
	}
	return &Store{db: db}, nil
}

func (s *Store) SaveMessage(m *models.ChatMessage) error {
	if s == nil || s.db == nil || m == nil {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	_, err := s.db.Exec(
		`INSERT OR IGNORE INTO messages (id, conversation_id, sender_id, sender_role, type, content, timestamp)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		m.ID, m.ConversationID, m.SenderID, string(m.SenderRole), string(m.Type), m.Content, m.Timestamp.UTC(),
	)
	return err
}

func (s *Store) RecentMessages(conversationID string, limit int) ([]models.ChatMessage, error) {
	if s == nil || s.db == nil {
		return nil, nil
	}
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	rows, err := s.db.Query(
		`SELECT id, conversation_id, sender_id, sender_role, type, content, timestamp
		 FROM messages WHERE conversation_id = ?
		 ORDER BY timestamp ASC, id ASC
		 LIMIT ?`,
		conversationID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.ChatMessage
	for rows.Next() {
		var m models.ChatMessage
		var role, typ string
		var ts time.Time
		if err := rows.Scan(&m.ID, &m.ConversationID, &m.SenderID, &role, &typ, &m.Content, &ts); err != nil {
			return nil, err
		}
		m.SenderRole = models.SenderRole(role)
		m.Type = models.MessageType(typ)
		m.Timestamp = ts.UTC()
		out = append(out, m)
	}
	return out, rows.Err()
}

func (s *Store) Close() error {
	if s == nil || s.db == nil {
		return nil
	}
	return s.db.Close()
}
