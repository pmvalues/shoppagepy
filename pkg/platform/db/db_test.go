package db

import (
	"context"
	"encoding/json"
	"os"
	"testing"
)

// Integration tests run only when TEST_DATABASE_URL points at a disposable
// PostgreSQL database (CI provides one as a service container).
func testPool(t *testing.T) *Records {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL not set; skipping PostgreSQL integration test")
	}
	pool, err := Open(context.Background(), dsn)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	if _, err := pool.Exec(context.Background(), `TRUNCATE consumer_records, merchant_workspaces`); err != nil {
		t.Fatal(err)
	}
	return NewRecords(pool)
}

func TestRecordsRoundTrip(t *testing.T) {
	recs := testPool(t)
	ctx := context.Background()
	if err := recs.Put(ctx, "order", "ORD-1", map[string]any{"total": 10}); err != nil {
		t.Fatal(err)
	}
	if err := recs.Put(ctx, "order", "ORD-2", map[string]any{"total": 20}); err != nil {
		t.Fatal(err)
	}
	if err := recs.Put(ctx, "order", "ORD-1", map[string]any{"total": 11}); err != nil {
		t.Fatal(err)
	}
	docs, err := recs.List(ctx, "order")
	if err != nil {
		t.Fatal(err)
	}
	if len(docs) != 2 {
		t.Fatalf("want 2 docs, got %d", len(docs))
	}
	var first map[string]int
	_ = json.Unmarshal(docs[0], &first)
	if first["total"] != 11 {
		t.Fatalf("upsert must replace and keep insertion order, got %s", docs[0])
	}

	ws := NewWorkspaces(recs.pool)
	if _, found, err := ws.Load(ctx, "store-a"); err != nil || found {
		t.Fatalf("empty load: found=%v err=%v", found, err)
	}
	if err := ws.Save(ctx, "store-a", []byte(`{"v":1}`)); err != nil {
		t.Fatal(err)
	}
	if err := ws.Save(ctx, "store-a", []byte(`{"v":2}`)); err != nil {
		t.Fatal(err)
	}
	state, found, err := ws.Load(ctx, "store-a")
	if err != nil || !found || string(state) != `{"v": 2}` {
		t.Fatalf("load: %s found=%v err=%v", state, found, err)
	}
	var version int
	_ = recs.pool.QueryRow(ctx, `SELECT version FROM merchant_workspaces WHERE tenant_id='store-a'`).Scan(&version)
	if version != 2 {
		t.Fatalf("version = %d, want 2", version)
	}
}
