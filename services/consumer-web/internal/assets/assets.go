package assets

import (
	"embed"
	"net/http"
)

// Content embeds the production pre-compiled CSS and JS assets
//
//go:embed css/* js/*
var Content embed.FS

// Handler returns an http.Handler serving the embedded static assets
func Handler() http.Handler {
	return http.FileServer(http.FS(Content))
}
