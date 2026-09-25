package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCheckOriginBlocksCrossSite(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://www.shoppage.co.za")
	h := NewChatHandler(nil, nil, nil)
	cases := map[string]bool{
		"":                           true, // non-browser client
		"https://shoppage.co.za":     true, // same host
		"https://www.shoppage.co.za": true, // configured alias
		"https://evil.example":       false,
		"null":                       false,
	}
	for origin, want := range cases {
		req := httptest.NewRequest(http.MethodGet, "https://shoppage.co.za/ws/chat?roomId=r1", nil)
		if origin != "" {
			req.Header.Set("Origin", origin)
		}
		if got := h.upgrader.CheckOrigin(req); got != want {
			t.Errorf("Origin %q: allowed=%v, want %v", origin, got, want)
		}
	}
}
