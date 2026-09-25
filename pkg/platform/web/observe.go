package web

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"runtime/debug"
	"strings"
	"time"

	"github.com/VictoriaMetrics/metrics"
	"github.com/getsentry/sentry-go"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// Observe logs every request as structured JSON and records Prometheus
// request counters and latency histograms labelled by route pattern (not raw
// path, so label cardinality stays bounded). service names the component.
func Observe(service string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
			next.ServeHTTP(ww, r)

			status := ww.Status()
			if status == 0 {
				status = http.StatusOK
			}
			route := "unmatched"
			if rc := chi.RouteContext(r.Context()); rc != nil {
				if p := rc.RoutePattern(); p != "" {
					route = p
				}
			}
			elapsed := time.Since(start)
			metrics.GetOrCreateCounter(fmt.Sprintf(`http_requests_total{service=%q,route=%q,method=%q,code="%d"}`,
				service, route, r.Method, status)).Inc()
			metrics.GetOrCreatePrometheusHistogram(fmt.Sprintf(`http_request_duration_seconds{service=%q,route=%q}`,
				service, route)).Update(elapsed.Seconds())

			level := slog.LevelInfo
			if status >= 500 {
				level = slog.LevelError
			}
			slog.LogAttrs(r.Context(), level, "http_request",
				slog.String("service", service),
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.String("route", route),
				slog.Int("status", status),
				slog.Int("bytes", ww.BytesWritten()),
				slog.Float64("duration_ms", float64(elapsed.Microseconds())/1000),
				slog.String("ip", ClientIPOf(r)),
				slog.String("request_id", middleware.GetReqID(r.Context())),
			)
		})
	}
}

// Recover turns a handler panic into a 500, logs it with its stack and
// reports it to Sentry when configured. http.ErrAbortHandler is re-raised so
// net/http can abort the connection as intended.
func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			rec := recover()
			if rec == nil {
				return
			}
			if rec == http.ErrAbortHandler {
				panic(rec)
			}
			metrics.GetOrCreateCounter(`http_panics_total`).Inc()
			slog.Error("panic", "err", fmt.Sprint(rec), "path", r.URL.Path,
				"request_id", middleware.GetReqID(r.Context()), "stack", string(debug.Stack()))
			if hub := sentry.CurrentHub(); hub.Client() != nil {
				hub := hub.Clone()
				hub.Scope().SetRequest(r)
				hub.Scope().SetTag("request_id", middleware.GetReqID(r.Context()))
				hub.RecoverWithContext(r.Context(), rec)
			}
			if r.Header.Get("Connection") != "Upgrade" {
				w.WriteHeader(http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// MetricsHandler serves Prometheus metrics. With METRICS_TOKEN set, callers
// must send "Authorization: Bearer <token>". Without it the endpoint is open
// in development and answers 404 in production (production must opt in).
func MetricsHandler(production bool) http.Handler {
	token := os.Getenv("METRICS_TOKEN")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case token != "":
			if r.Header.Get("Authorization") != "Bearer "+token {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
		case production:
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/plain; version=0.0.4")
		metrics.WritePrometheus(w, true)
	})
}

// IsWebSocket reports whether r is a WebSocket upgrade request.
func IsWebSocket(r *http.Request) bool {
	return strings.EqualFold(r.Header.Get("Upgrade"), "websocket")
}
