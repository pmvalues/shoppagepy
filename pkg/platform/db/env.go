package db

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// OpenFromEnv opens DATABASE_URL. Without it, development runs with
// in-memory state (nil pool) and production refuses to start, unless the
// operator explicitly accepts data loss with SHOPPAGE_ALLOW_EPHEMERAL=true.
func OpenFromEnv(ctx context.Context, production bool) (*pgxpool.Pool, error) {
	dsn := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dsn != "" {
		return Open(ctx, dsn)
	}
	if production && !strings.EqualFold(os.Getenv("SHOPPAGE_ALLOW_EPHEMERAL"), "true") {
		return nil, errors.New("DATABASE_URL is required in production: without it every order, " +
			"registration and merchant edit is lost on restart (set SHOPPAGE_ALLOW_EPHEMERAL=true to override for a demo)")
	}
	slog.Warn("DATABASE_URL not set: state is in memory and will be lost on restart")
	return nil, nil
}
