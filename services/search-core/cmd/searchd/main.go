// Command searchd runs the search core as its own process. The default
// deployment mounts it in-process inside the consumer-web binary; use this
// only when splitting services (set SEARCH_CORE_URL on the gateway).
package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/shoppage/platform/env"
	"github.com/shoppage/platform/obs"
	"github.com/shoppage/platform/web"
	"github.com/shoppage/search-core/app"
)

func main() {
	flush := obs.Setup("search-core", env.IsProduction())
	defer flush()

	srv := &http.Server{
		Addr:              ":" + web.PortFromEnv("8082", "SEARCH_PORT"),
		Handler:           app.New(app.Options{Standalone: true}),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      35 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	if err := web.Serve(srv); err != nil {
		slog.Error("server error", "err", err)
		os.Exit(1)
	}
}
