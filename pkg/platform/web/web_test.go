package web

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func echoIP() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(ClientIPOf(r)))
	})
}

func TestClientIPIgnoresSpoofedHeadersFromPublicPeer(t *testing.T) {
	h := ClientIP(DefaultTrustedProxies)(echoIP())
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "203.0.113.9:5555"
	req.Header.Set("X-Forwarded-For", "1.2.3.4")
	req.Header.Set("X-Real-IP", "1.2.3.4")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if got := rec.Body.String(); got != "203.0.113.9" {
		t.Fatalf("public peer must not be able to spoof its IP; got %q", got)
	}
}

func TestClientIPHonoursXFFFromTrustedProxy(t *testing.T) {
	h := ClientIP(DefaultTrustedProxies)(echoIP())
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "172.18.0.5:443" // Caddy on the container network
	// Leftmost entry is attacker-supplied; Caddy appended the real peer.
	req.Header.Set("X-Forwarded-For", "9.9.9.9, 198.51.100.7")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if got := rec.Body.String(); got != "198.51.100.7" {
		t.Fatalf("want rightmost untrusted hop, got %q", got)
	}
}

func TestClientIPTrustedPeerWithoutXFF(t *testing.T) {
	h := ClientIP(DefaultTrustedProxies)(echoIP())
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "127.0.0.1:9000"
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if got := rec.Body.String(); got != "127.0.0.1" {
		t.Fatalf("got %q", got)
	}
}

func TestTrustedProxiesFromEnv(t *testing.T) {
	t.Setenv("TRUSTED_PROXIES", "none")
	if got := TrustedProxiesFromEnv(); got != nil {
		t.Fatalf("none must trust nothing, got %v", got)
	}
	t.Setenv("TRUSTED_PROXIES", "10.1.0.0/16, 127.0.0.1/32")
	if got := TrustedProxiesFromEnv(); len(got) != 2 {
		t.Fatalf("got %v", got)
	}
}

func TestSecurityHeadersEmbeddable(t *testing.T) {
	h := SecurityHeaders(DefaultCSP, "/embed/")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/search", nil))
	if rec.Header().Get("X-Frame-Options") != "SAMEORIGIN" ||
		!strings.Contains(rec.Header().Get("Content-Security-Policy"), "frame-ancestors 'self'") {
		t.Fatalf("regular pages must not be frameable: %v", rec.Header())
	}

	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/embed/m/abc", nil))
	if rec.Header().Get("X-Frame-Options") != "" ||
		strings.Contains(rec.Header().Get("Content-Security-Policy"), "frame-ancestors") {
		t.Fatalf("embed pages must stay frameable by merchant sites: %v", rec.Header())
	}
}

func TestCrossOriginProtection(t *testing.T) {
	mw, err := CrossOriginProtection([]string{"https://www.shoppage.co.za"})
	if err != nil {
		t.Fatal(err)
	}
	h := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))

	post := func(mod func(*http.Request)) int {
		req := httptest.NewRequest(http.MethodPost, "https://shoppage.co.za/offer/submit", nil)
		mod(req)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec.Code
	}
	if c := post(func(r *http.Request) { r.Header.Set("Sec-Fetch-Site", "cross-site") }); c != http.StatusForbidden {
		t.Fatalf("cross-site POST: got %d", c)
	}
	if c := post(func(r *http.Request) { r.Header.Set("Origin", "https://evil.example") }); c != http.StatusForbidden {
		t.Fatalf("foreign Origin POST: got %d", c)
	}
	if c := post(func(r *http.Request) { r.Header.Set("Sec-Fetch-Site", "same-origin") }); c != http.StatusOK {
		t.Fatalf("same-origin POST: got %d", c)
	}
	if c := post(func(r *http.Request) {
		r.Header.Set("Sec-Fetch-Site", "same-site")
		r.Header.Set("Origin", "https://www.shoppage.co.za")
	}); c != http.StatusOK {
		t.Fatalf("trusted origin POST: got %d", c)
	}
}

func TestRateLimitPerClient(t *testing.T) {
	h := ClientIP(DefaultTrustedProxies)(RateLimit(2, time.Minute)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})))
	hit := func(ip string) int {
		req := httptest.NewRequest(http.MethodPost, "/", nil)
		req.RemoteAddr = ip + ":1234"
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		return rec.Code
	}
	hit("203.0.113.1")
	hit("203.0.113.1")
	if c := hit("203.0.113.1"); c != http.StatusTooManyRequests {
		t.Fatalf("third request: got %d", c)
	}
	if c := hit("203.0.113.2"); c != http.StatusOK {
		t.Fatalf("other client must have its own bucket: got %d", c)
	}
}

func TestMetricsHandlerGating(t *testing.T) {
	t.Setenv("METRICS_TOKEN", "")
	rec := httptest.NewRecorder()
	MetricsHandler(true).ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/metrics", nil))
	if rec.Code != http.StatusNotFound {
		t.Fatalf("production without token must hide metrics, got %d", rec.Code)
	}
	t.Setenv("METRICS_TOKEN", "s3cret")
	rec = httptest.NewRecorder()
	MetricsHandler(true).ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/metrics", nil))
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("missing bearer: got %d", rec.Code)
	}
	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	req.Header.Set("Authorization", "Bearer s3cret")
	rec = httptest.NewRecorder()
	MetricsHandler(true).ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("valid bearer: got %d", rec.Code)
	}
}

func TestInProcessMatchesProxyPaths(t *testing.T) {
	inner := chiRouterEcho()
	outer := newOuter(inner)

	for path, want := range map[string]string{
		"/desk":       "inner:/", // prefix stripped, like the old proxy
		"/desk/tab/x": "inner:/tab/x",
		"/login":      "inner:/login", // forwarded as-is
		"/auth/login": "inner:/auth/login",
	} {
		rec := httptest.NewRecorder()
		outer.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
		if got := rec.Body.String(); got != want {
			t.Errorf("%s: got %q want %q", path, got, want)
		}
	}
}

func TestInProcessTransport(t *testing.T) {
	c := &http.Client{Transport: InProcessTransport(chiRouterEcho())}
	resp, err := c.Get("http://embedded/api/search?q=x")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	buf := make([]byte, 64)
	n, _ := resp.Body.Read(buf)
	if string(buf[:n]) != "inner:/api/search" {
		t.Fatalf("got %q", buf[:n])
	}
}
