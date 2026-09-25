package app

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"testing"

	"github.com/shoppage/merchant-os/internal/auth"
)

type memStore struct {
	mu    sync.Mutex
	docs  map[string][]byte
	fail  bool
	saves int
}

func (m *memStore) Load(_ context.Context, tenant string) ([]byte, bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	d, ok := m.docs[tenant]
	return d, ok, nil
}

func (m *memStore) Save(_ context.Context, tenant string, state []byte) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.fail {
		return errors.New("database down")
	}
	m.saves++
	m.docs[tenant] = append([]byte(nil), state...)
	return nil
}

func devEnv(t *testing.T) string {
	t.Helper()
	t.Setenv("SHOPPAGE_ENV", "test")
	t.Setenv("SHOPPAGE_AUTH_SECRET", strings.Repeat("k", 40))
	t.Setenv("SHOPPAGE_ADMIN_EMAIL", "ops@example.com")
	t.Setenv("SHOPPAGE_ADMIN_PASSWORD", "correct-horse-battery")
	t.Setenv("MERCHANT_DATA_DIR", t.TempDir())
	tok, err := auth.EncodeSession("ops@example.com", []byte(strings.Repeat("k", 40)))
	if err != nil {
		t.Fatal(err)
	}
	return tok
}

func post(h http.Handler, path, token string, form url.Values) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, path, strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.RemoteAddr = "203.0.113.10:4000"
	if token != "" {
		req.AddCookie(&http.Cookie{Name: auth.CookieName, Value: token})
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestWritesAreDurableAcrossRestart(t *testing.T) {
	token := devEnv(t)
	store := &memStore{docs: map[string][]byte{}}
	h, err := New(context.Background(), Options{Workspaces: store})
	if err != nil {
		t.Fatal(err)
	}
	if store.saves != 1 {
		t.Fatalf("first boot must seed the workspace, saves=%d", store.saves)
	}

	form := url.Values{"code": {"DURABLE10"}, "discountPct": {"10"}, "description": {"test"}}
	rec := post(h, "/discounts/new", token, form)
	if rec.Code >= 400 {
		t.Fatalf("create coupon: %d %s", rec.Code, rec.Body.String())
	}
	if store.saves != 2 {
		t.Fatalf("write must be saved before responding, saves=%d", store.saves)
	}

	// "Restart": a fresh app over the same store must see the coupon.
	if _, err := New(context.Background(), Options{Workspaces: store}); err != nil {
		t.Fatal(err)
	}
	var tenantDoc string
	for _, d := range store.docs {
		tenantDoc = string(d)
	}
	if !strings.Contains(tenantDoc, "DURABLE10") {
		t.Fatal("coupon missing from persisted workspace")
	}
}

func TestFailedSaveIsNotReportedAsSuccess(t *testing.T) {
	token := devEnv(t)
	store := &memStore{docs: map[string][]byte{}}
	h, err := New(context.Background(), Options{Workspaces: store})
	if err != nil {
		t.Fatal(err)
	}
	store.fail = true
	rec := post(h, "/discounts/new", token, url.Values{"code": {"LOST"}, "discountPct": {"5"}})
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("want 503 when the save fails, got %d", rec.Code)
	}
}

func TestUnconfiguredInstanceBootsAndBootstrapLoginWorks(t *testing.T) {
	t.Setenv("SHOPPAGE_ENV", "")
	t.Setenv("SHOPPAGE_AUTH_SECRET", "")
	t.Setenv("SHOPPAGE_ADMIN_EMAIL", "")
	t.Setenv("SHOPPAGE_ADMIN_PASSWORD", "")
	h, err := New(context.Background(), Options{})
	if err != nil {
		t.Fatalf("an unconfigured instance must boot, got: %v", err)
	}
	rec := post(h, "/auth/login", "", url.Values{
		"email":    {"admin@shoppage.local"},
		"password": {"shoppage-local-admin"},
	})
	if rec.Code != http.StatusSeeOther {
		t.Fatalf("bootstrapped demo login must succeed, got %d", rec.Code)
	}
}

func TestLoginIsRateLimited(t *testing.T) {
	devEnv(t)
	h, err := New(context.Background(), Options{})
	if err != nil {
		t.Fatal(err)
	}
	var last int
	for i := 0; i < 11; i++ {
		last = post(h, "/auth/login", "", url.Values{"email": {"x@example.com"}, "password": {"wrong"}}).Code
	}
	if last != http.StatusTooManyRequests {
		t.Fatalf("11th failed login within a minute: got %d, want 429", last)
	}
}

func TestDeskRequiresSession(t *testing.T) {
	devEnv(t)
	h, err := New(context.Background(), Options{})
	if err != nil {
		t.Fatal(err)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/desk", nil))
	if rec.Code == http.StatusOK {
		t.Fatal("desk served without a session")
	}
}
