package env

import "testing"

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
