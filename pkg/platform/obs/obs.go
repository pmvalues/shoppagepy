// Package obs configures process-wide logging and error reporting.
package obs

import (
	"log/slog"
	"os"
	"time"

	"github.com/getsentry/sentry-go"
)

// Setup installs a JSON slog logger on stdout (level from LOG_LEVEL:
// debug|info|warn|error) and, when SENTRY_DSN is set, initialises Sentry.
// The returned function flushes pending Sentry events; call it on shutdown.
func Setup(service string, production bool) func() {
	level := slog.LevelInfo
	_ = level.UnmarshalText([]byte(os.Getenv("LOG_LEVEL")))
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})).
		With("service", service))

	dsn := os.Getenv("SENTRY_DSN")
	if dsn == "" {
		return func() {}
	}
	environment := "production"
	if !production {
		environment = "development"
	}
	if err := sentry.Init(sentry.ClientOptions{
		Dsn:         dsn,
		Environment: environment,
		Release:     os.Getenv("SHOPPAGE_RELEASE"),
		ServerName:  service,
	}); err != nil {
		slog.Error("sentry init failed; continuing without error reporting", "err", err)
		return func() {}
	}
	slog.Info("sentry error reporting enabled")
	return func() { sentry.Flush(2 * time.Second) }
}
