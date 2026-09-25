package web

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func chiRouterEcho() http.Handler {
	r := chi.NewRouter()
	r.Get("/*", func(w http.ResponseWriter, r *http.Request) { _, _ = w.Write([]byte("inner:" + r.URL.Path)) })
	return r
}

func newOuter(inner http.Handler) http.Handler {
	r := chi.NewRouter()
	r.Mount("/desk", InProcess(inner, "/desk"))
	r.Mount("/login", InProcess(inner, ""))
	r.Mount("/auth", InProcess(inner, ""))
	return r
}
