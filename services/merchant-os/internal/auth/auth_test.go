package auth

import (
	"encoding/base64"
	"encoding/json"
	"os"
	"strings"
	"testing"
	"time"
)

var key = []byte(strings.Repeat("s", 40))

func TestSessionRoundTripAndTamper(t *testing.T) {
	tok, err := EncodeSession("ops@example.com", key)
	if err != nil {
		t.Fatal(err)
	}
	p, ok := DecodeSession(tok, key)
	if !ok || p.Email != "ops@example.com" {
		t.Fatalf("round trip failed: %+v %v", p, ok)
	}
	if _, ok := DecodeSession(tok, []byte(strings.Repeat("x", 40))); ok {
		t.Fatal("token accepted under a different key")
	}
	parts := strings.Split(tok, ".")
	if _, ok := DecodeSession("eyJlbWFpbCI6ImF0dGFja2VyIn0."+parts[1], key); ok {
		t.Fatal("tampered payload accepted")
	}
	if _, ok := DecodeSession(tok, nil); ok {
		t.Fatal("empty key must fail closed")
	}
}

func TestExpiredSessionRejected(t *testing.T) {
	body, _ := json.Marshal(sessionPayload{Email: "a@b.c", Exp: time.Now().Add(-time.Minute).Unix()})
	tok := base64.RawURLEncoding.EncodeToString(body) + "." +
		base64.RawURLEncoding.EncodeToString(sign(string(body), key))
	if _, ok := DecodeSession(tok, key); ok {
		t.Fatal("expired token accepted")
	}
}

func TestVerifyPasswordFailsClosed(t *testing.T) {
	t.Setenv("SHOPPAGE_AUTH_SECRET", "")
	t.Setenv("SHOPPAGE_ADMIN_EMAIL", "ops@example.com")
	t.Setenv("SHOPPAGE_ADMIN_PASSWORD", "pw-long-enough")
	if VerifyPassword("ops@example.com", "pw-long-enough") {
		t.Fatal("must fail without an auth secret")
	}
	t.Setenv("SHOPPAGE_AUTH_SECRET", string(key))
	if !VerifyPassword("OPS@example.com", "pw-long-enough") {
		t.Fatal("valid credentials rejected")
	}
	if VerifyPassword("ops@example.com", "wrong") {
		t.Fatal("wrong password accepted")
	}
}

func TestBootstrapFillsMissingAuthWhenUnconfigured(t *testing.T) {
	t.Setenv("SHOPPAGE_ENV", "")
	t.Setenv("SHOPPAGE_AUTH_SECRET", "")
	t.Setenv("SHOPPAGE_ADMIN_EMAIL", "")
	t.Setenv("SHOPPAGE_ADMIN_PASSWORD", "")
	EnsureLocalAuth()
	if len(os.Getenv("SHOPPAGE_AUTH_SECRET")) < 32 {
		t.Fatal("auth secret not bootstrapped on an unconfigured instance")
	}
	if pw := getenv("SHOPPAGE_ADMIN_PASSWORD"); pw == "" {
		t.Fatal("default password not installed on an unconfigured instance")
	}
}

func getenv(k string) string { return strings.TrimSpace(os.Getenv(k)) }
