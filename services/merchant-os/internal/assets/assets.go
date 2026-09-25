package assets

import (
	"embed"
	"net/http"
)

// Content embeds the Merchant OS static assets (HTMX, the workspace
// stylesheet and script, the PWA manifest and offline page) so the workspace
// has no external runtime dependency and works on offline or degraded
// in-store networks.
//
//go:embed js/* css/* offline.html manifest.webmanifest
var Content embed.FS

//go:embed sw.js
var serviceWorker []byte

// Handler returns an http.Handler serving the embedded static assets. Assets
// are revalidated rather than cached forever because file names carry no hash.
func Handler() http.Handler {
	fs := http.FileServer(http.FS(Content))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "public, max-age=300, must-revalidate")
		if len(r.URL.Path) > 12 && r.URL.Path[len(r.URL.Path)-12:] == ".webmanifest" {
			w.Header().Set("Content-Type", "application/manifest+json")
		}
		fs.ServeHTTP(w, r)
	})
}

// ServiceWorker serves /sw.js from the site root so it can control every page.
func ServiceWorker(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/javascript; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	_, _ = w.Write(serviceWorker)
}
