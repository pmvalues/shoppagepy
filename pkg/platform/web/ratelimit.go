package web

import (
	"net/http"
	"time"

	"github.com/go-chi/httprate"
)

// RateLimit allows n requests per window for each client IP (IPv6 bucketed
// by /64). It must run after ClientIP. Limits are per process; a
// multi-replica deployment needs a shared counter (httprate-redis).
func RateLimit(n int, window time.Duration) func(http.Handler) http.Handler {
	return httprate.LimitBy(n, window,
		func(r *http.Request) (string, error) {
			return httprate.CanonicalizeIP(ClientIPOf(r)), nil
		},
		httprate.WithLimitHandler(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "Too many requests — please slow down and try again shortly.", http.StatusTooManyRequests)
		}),
	)
}
