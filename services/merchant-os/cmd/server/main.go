// Command server runs Merchant OS as its own process. The default production
// deployment instead mounts it in-process inside the consumer-web binary; use
// this only when splitting services (set MERCHANT_OS_URL on the gateway).
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/shoppage/merchant-os/app"
	"github.com/shoppage/platform/db"
	"github.com/shoppage/platform/env"
	"github.com/shoppage/platform/obs"
	"github.com/shoppage/platform/web"
)

func main() {
	production := env.IsProduction()
	flush := obs.Setup("merchant-os", production)
	defer flush()

	ctx := context.Background()
	pool, err := db.OpenFromEnv(ctx, production)
	if err != nil {
		slog.Error("database unavailable", "err", err)
		os.Exit(1)
	}
	opts := app.Options{Standalone: true}
	if pool != nil {
		defer pool.Close()
		opts.Workspaces = db.NewWorkspaces(pool)
	}

	handler, err := app.New(ctx, opts)
	if err != nil {
		slog.Error("merchant os failed to start", "err", err)
		os.Exit(1)
	}

	srv := &http.Server{
		Addr:              ":" + web.PortFromEnv("8083", "MERCHANT_PORT"),
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      35 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	if err := web.Serve(srv); err != nil {
		slog.Error("server error", "err", err)
		os.Exit(1)
	}
}
