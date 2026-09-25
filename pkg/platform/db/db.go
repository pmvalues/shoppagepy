// Package db is Shoppage's PostgreSQL system of record: connection pooling
// (pgx), schema migrations embedded in the binary (goose), and the small
// repositories the services persist through.
package db

import (
	"context"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

//go:embed migrations/*.sql
var migrations embed.FS

// Open connects to DATABASE_URL-style dsn, applies pending migrations and
// returns a ready pool. It retries the first connection for up to 30s so a
// database container that is still starting does not crash the app.
func Open(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse DATABASE_URL: %w", err)
	}
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}
	deadline := time.Now().Add(30 * time.Second)
	for {
		err = pool.Ping(ctx)
		if err == nil || time.Now().After(deadline) {
			break
		}
		slog.Warn("waiting for postgres", "err", err)
		select {
		case <-ctx.Done():
			pool.Close()
			return nil, ctx.Err()
		case <-time.After(2 * time.Second):
		}
	}
	if err != nil {
		pool.Close()
		return nil, fmt.Errorf("connect postgres: %w", err)
	}
	if err := migrate(ctx, pool); err != nil {
		pool.Close()
		return nil, err
	}
	return pool, nil
}

func migrate(ctx context.Context, pool *pgxpool.Pool) error {
	sqlDB := stdlib.OpenDBFromPool(pool)
	defer sqlDB.Close()
	fsys, err := fs.Sub(migrations, "migrations")
	if err != nil {
		return err
	}
	provider, err := goose.NewProvider(goose.DialectPostgres, sqlDB, fsys)
	if err != nil {
		return fmt.Errorf("init migrations: %w", err)
	}
	results, err := provider.Up(ctx)
	if err != nil {
		return fmt.Errorf("apply migrations: %w", err)
	}
	for _, r := range results {
		slog.Info("applied migration", "version", r.Source.Version, "path", r.Source.Path)
	}
	return nil
}

// Workspaces persists Merchant OS workspace state per tenant.
type Workspaces struct{ pool *pgxpool.Pool }

// NewWorkspaces returns the workspace repository.
func NewWorkspaces(pool *pgxpool.Pool) *Workspaces { return &Workspaces{pool: pool} }

// Load returns the stored state for tenant; found is false when none exists.
func (w *Workspaces) Load(ctx context.Context, tenant string) (state []byte, found bool, err error) {
	err = w.pool.QueryRow(ctx, `SELECT state FROM merchant_workspaces WHERE tenant_id = $1`, tenant).Scan(&state)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, fmt.Errorf("load workspace %s: %w", tenant, err)
	}
	return state, true, nil
}

// Save upserts the full state document for tenant.
func (w *Workspaces) Save(ctx context.Context, tenant string, state []byte) error {
	_, err := w.pool.Exec(ctx, `
		INSERT INTO merchant_workspaces (tenant_id, state) VALUES ($1, $2)
		ON CONFLICT (tenant_id) DO UPDATE
		SET state = EXCLUDED.state, version = merchant_workspaces.version + 1, updated_at = now()`,
		tenant, state)
	if err != nil {
		return fmt.Errorf("save workspace %s: %w", tenant, err)
	}
	return nil
}

// Records persists consumer-side documents by kind and id.
type Records struct{ pool *pgxpool.Pool }

// NewRecords returns the consumer record repository.
func NewRecords(pool *pgxpool.Pool) *Records { return &Records{pool: pool} }

// Put inserts or replaces the document kind/id.
func (r *Records) Put(ctx context.Context, kind, id string, doc any) error {
	body, err := json.Marshal(doc)
	if err != nil {
		return fmt.Errorf("encode %s/%s: %w", kind, id, err)
	}
	_, err = r.pool.Exec(ctx, `
		INSERT INTO consumer_records (kind, id, doc) VALUES ($1, $2, $3)
		ON CONFLICT (kind, id) DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()`,
		kind, id, body)
	if err != nil {
		return fmt.Errorf("save %s/%s: %w", kind, id, err)
	}
	return nil
}

// List returns every document of kind, oldest first.
func (r *Records) List(ctx context.Context, kind string) ([]json.RawMessage, error) {
	rows, err := r.pool.Query(ctx, `SELECT doc FROM consumer_records WHERE kind = $1 ORDER BY created_at, id`, kind)
	if err != nil {
		return nil, fmt.Errorf("list %s: %w", kind, err)
	}
	defer rows.Close()
	var out []json.RawMessage
	for rows.Next() {
		var doc []byte
		if err := rows.Scan(&doc); err != nil {
			return nil, err
		}
		out = append(out, doc)
	}
	return out, rows.Err()
}
