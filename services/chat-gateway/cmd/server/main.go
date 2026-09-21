package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/shoppage/chat-gateway/internal/handlers"
	"github.com/shoppage/chat-gateway/internal/hub"
)

func main() {
	// Initialize structured logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	port := os.Getenv("CHAT_PORT")
	if port == "" {
		port = os.Getenv("PORT")
		if port == "" || port == "3000" || port == "80" {
			port = "8080"
		}
	}

	// Initialize Chat Hub
	chatHub := hub.NewHub()
	go chatHub.Run()

	// Initialize Handlers
	chatHandler := handlers.NewChatHandler(chatHub)

	// Router setup
	r := chi.NewRouter()

	// Global Middlewares
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS configuration for web clients
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001", "https://shoppage.co.za", "*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Routes
	r.Get("/health", chatHandler.HealthCheck)
	r.Get("/ws/chat", chatHandler.ServeWS)

	serverAddr := fmt.Sprintf(":%s", port)
	srv := &http.Server{
		Addr:         serverAddr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Server run context
	serverErrors := make(chan error, 1)
	go func() {
		slog.Info("Starting Shoppage Chat Gateway", "port", port, "address", serverAddr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErrors <- err
		}
	}()

	// Graceful shutdown listener
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		slog.Error("Chat Gateway server encountered error", "err", err)
		os.Exit(1)

	case sig := <-shutdown:
		slog.Info("Shutdown signal received, shutting down gracefully", "signal", sig.String())

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			slog.Error("Graceful shutdown failed, forcing close", "err", err)
			_ = srv.Close()
		}
		slog.Info("Shoppage Chat Gateway stopped safely")
	}
}
