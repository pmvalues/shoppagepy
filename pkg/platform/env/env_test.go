package env

import (
	"strings"
	"testing"
)

func TestIsProductionFailsClosed(t *testing.T) {
	cases := map[string]bool{
		"":            true,
		"production":  true,
		"staging":     true,
		"typo":        true,
		"development": false,
		"DEV":         false,
		" local ":     false,
		"test":        false,
	}
	for val, want := range cases {
		t.Setenv("SHOPPAGE_ENV", val)
		if got := IsProduction(); got != want {
			t.Errorf("SHOPPAGE_ENV=%q: IsProduction()=%v, want %v", val, got, want)
		}
	}
}

func TestRequireProductionSecrets(t *testing.T) {
	t.Setenv("SHOPPAGE_ENV", "production")
	t.Setenv("SHOPPAGE_AUTH_SECRET", "")
	t.Setenv("SHOPPAGE_ADMIN_EMAIL", "")
	t.Setenv("SHOPPAGE_ADMIN_PASSWORD", "shoppage-local-admin")
	err := RequireProductionSecrets()
	if err == nil {
		t.Fatal("expected refusal with missing secrets")
	}
	for _, want := range []string{"SHOPPAGE_AUTH_SECRET", "SHOPPAGE_ADMIN_EMAIL", "SHOPPAGE_ADMIN_PASSWORD"} {
		if !strings.Contains(err.Error(), want) {
			t.Errorf("error %q does not mention %s", err, want)
		}
	}

	t.Setenv("SHOPPAGE_AUTH_SECRET", strings.Repeat("x", 48))
	t.Setenv("SHOPPAGE_ADMIN_EMAIL", "ops@shoppage.co.za")
	t.Setenv("SHOPPAGE_ADMIN_PASSWORD", "a-long-real-password")
	if err := RequireProductionSecrets(); err != nil {
		t.Fatalf("valid secrets refused: %v", err)
	}

	t.Setenv("SHOPPAGE_ENV", "development")
	t.Setenv("SHOPPAGE_AUTH_SECRET", "")
	if err := RequireProductionSecrets(); err != nil {
		t.Fatalf("development must not require secrets: %v", err)
	}
}

func TestAllowedOriginsNeverWildcard(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "*, https://shoppage.co.za ,")
	got := AllowedOrigins()
	if len(got) != 1 || got[0] != "https://shoppage.co.za" {
		t.Fatalf("got %v", got)
	}
	t.Setenv("ALLOWED_ORIGINS", "*")
	if got := AllowedOrigins(); got[0] != "http://localhost:3000" {
		t.Fatalf("wildcard-only must fall back to localhost, got %v", got)
	}
}
