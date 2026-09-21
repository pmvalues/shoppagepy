package assets

import (
	"embed"
	"net/http"
)

// Content embeds the Merchant OS production assets (HTMX) so the merchant
// workspace has zero external runtime dependencies and works on an offline or
// degraded in-store network.
//
//go:embed js/*
var Content embed.FS

// Handler returns an http.Handler serving the embedded static assets.
func Handler() http.Handler {
	return http.FileServer(http.FS(Content))
}
