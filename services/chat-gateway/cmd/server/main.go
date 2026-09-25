// Command server runs the chat gateway as its own process. The default
// deployment mounts it in-process inside the consumer-web binary; use this
// only when splitting services (set CHAT_GATEWAY_URL on the gateway).
package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/shoppage/chat-gateway/app"
	"github.com/shoppage/platform/env"
	"github.com/shoppage/platform/obs"
	"github.com/shoppage/platform/web"
)

func main() {
	flush := obs.Setup("chat-gateway", env.IsProduction())
	defer flush()

	a, err := app.New(app.Options{Standalone: true})
	if err != nil {
		slog.Error("chat gateway failed to start", "err", err)
		os.Exit(1)
	}
	defer a.Close()

	// No WriteTimeout: WebSocket connections are long-lived and manage their
	// own write deadlines.
	srv := &http.Server{
		Addr:              ":" + web.PortFromEnv("8080", "CHAT_PORT"),
		Handler:           a.Handler,
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	if err := web.Serve(srv); err != nil {
		slog.Error("server error", "err", err)
		os.Exit(1)
	}
}
