package web

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"

	"github.com/go-chi/chi/v5"
)

// InProcess serves a request with an embedded application exactly as the old
// reverse proxy did: stripPrefix (if any) is removed from the path and the
// application's own router starts routing from scratch, so it sees the same
// paths it would as a separate process.
func InProcess(h http.Handler, stripPrefix string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r2 := r.Clone(context.WithValue(r.Context(), chi.RouteCtxKey, (*chi.Context)(nil)))
		if stripPrefix != "" {
			r2.URL.Path = strings.TrimPrefix(r.URL.Path, stripPrefix)
			r2.URL.RawPath = strings.TrimPrefix(r.URL.RawPath, stripPrefix)
			if r2.URL.Path == "" {
				r2.URL.Path = "/"
			}
		}
		h.ServeHTTP(w, r2)
	})
}

// InProcessTransport is an http.RoundTripper that answers client requests by
// calling h directly, letting HTTP-client code talk to an embedded service
// without a network hop.
func InProcessTransport(h http.Handler) http.RoundTripper {
	return roundTripFunc(func(req *http.Request) (*http.Response, error) {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec.Result(), nil
	})
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
