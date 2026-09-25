// Package app assembles the chat gateway so it can run as its own process or
// be mounted in-process by the consumer-web gateway (the default).
package app

import (
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/shoppage/chat-gateway/internal/handlers"
	"github.com/shoppage/chat-gateway/internal/hub"
	"github.com/shoppage/chat-gateway/internal/store"
	"github.com/shoppage/platform/env"
	"github.com/shoppage/platform/web"
)

// Options configures the application.
type Options struct {
	// Standalone adds the edge middleware the gateway otherwise provides.
	Standalone bool
}

// App is the running chat gateway; Close releases its message store.
type App struct {
	Handler http.Handler
	store   *store.Store
}

// Close releases resources held by the app.
func (a *App) Close() {
	if a.store != nil {
		_ = a.store.Close()
	}
}

// New starts the hub and builds the handler. Messages persist to SQLite at
// CHAT_DB_PATH (default data/chat-gateway.db); put it on a durable volume.
func New(opts Options) (*App, error) {
	chatHub := hub.NewHub()
	go chatHub.Run()

	dbPath := os.Getenv("CHAT_DB_PATH")
	if dbPath == "" {
		dbPath = filepath.Join("data", "chat-gateway.db")
	}
	a := &App{}
	var sink hub.MessageSink
	msgStore, err := store.Open(dbPath)
	if err != nil {
		if env.IsProduction() {
			return nil, err
		}
		slog.Error("chat store unavailable, continuing without history (development only)", "err", err)
	} else {
		a.store = msgStore
		sink = msgStore
	}

	chatHandler := handlers.NewChatHandler(chatHub, sink, hub.NewRateLimiter(2, 20))

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	if opts.Standalone {
		r.Use(web.ClientIP(web.TrustedProxiesFromEnv()))
		r.Use(web.Observe("chat-gateway"))
	}
	r.Use(web.Recover)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   env.AllowedOrigins(),
		AllowedMethods:   []string{"GET", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", chatHandler.HealthCheck)
	// New connections are limited per client IP; per-message limits apply
	// inside each connection.
	r.With(web.RateLimit(30, time.Minute)).Get("/ws/chat", chatHandler.ServeWS)

	a.Handler = r
	return a, nil
}
