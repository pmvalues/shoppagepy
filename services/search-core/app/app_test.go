package app

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestIndexBatchGuard(t *testing.T) {
	batch := func(h http.Handler, auth string) int {
		req := httptest.NewRequest(http.MethodPost, "/api/index/batch", strings.NewReader(`[]`))
		if auth != "" {
			req.Header.Set("Authorization", auth)
		}
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec.Code
	}

	t.Setenv("SEARCH_INDEX_TOKEN", "")
	t.Setenv("SHOPPAGE_ENV", "")
	if c := batch(New(Options{}), ""); c != http.StatusNotFound {
		t.Fatalf("production without token must disable index writes, got %d", c)
	}

	t.Setenv("SEARCH_INDEX_TOKEN", "idx-secret")
	h := New(Options{})
	if c := batch(h, ""); c != http.StatusUnauthorized {
		t.Fatalf("missing bearer: got %d", c)
	}
	if c := batch(h, "Bearer idx-secret"); c != http.StatusOK {
		t.Fatalf("valid bearer: got %d", c)
	}
}

func TestSearchServes(t *testing.T) {
	rec := httptest.NewRecorder()
	New(Options{}).ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/search?q=inverter", nil))
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "items") {
		t.Fatalf("search: %d %s", rec.Code, rec.Body.String())
	}
}
