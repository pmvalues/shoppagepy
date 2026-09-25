// Package env centralises environment detection shared by every Shoppage
// service. Detection fails closed: a process is treated as production unless
// it has been explicitly marked as a development or test instance.
package env

import (
	"fmt"
	"os"
	"strings"
)

// Mode names accepted in SHOPPAGE_ENV that opt a process out of production.
var nonProductionModes = map[string]bool{
	"development": true,
	"dev":         true,
	"local":       true,
	"test":        true,
}

// IsProduction reports whether production safeguards apply. Anything other
// than an explicit SHOPPAGE_ENV=development|dev|local|test — including an
// unset variable — is production, so a forgotten setting can never enable
// demo credentials or ephemeral storage on a public host.
func IsProduction() bool {
	return !nonProductionModes[strings.ToLower(strings.TrimSpace(os.Getenv("SHOPPAGE_ENV")))]
}

// AllowedOrigins reads ALLOWED_ORIGINS (comma-separated) and falls back to
// localhost-only; it never returns "*".
func AllowedOrigins() []string {
	var out []string
	for _, s := range strings.Split(os.Getenv("ALLOWED_ORIGINS"), ",") {
		s = strings.TrimSpace(s)
		if s != "" && s != "*" {
			out = append(out, s)
		}
	}
	if len(out) > 0 {
		return out
	}
	return []string{"http://localhost:3000", "http://localhost:3001"}
}

// RequireProductionSecrets returns an error naming every missing or weak
// secret when running in production. Development returns nil so the local
// bootstrap can fill demo values.
func RequireProductionSecrets() error {
	if !IsProduction() {
		return nil
	}
	var problems []string
	if len(os.Getenv("SHOPPAGE_AUTH_SECRET")) < 32 {
		problems = append(problems, "SHOPPAGE_AUTH_SECRET must be at least 32 characters")
	}
	if strings.TrimSpace(os.Getenv("SHOPPAGE_ADMIN_EMAIL")) == "" {
		problems = append(problems, "SHOPPAGE_ADMIN_EMAIL is required")
	}
	pass := os.Getenv("SHOPPAGE_ADMIN_PASSWORD")
	switch {
	case len(pass) < 12:
		problems = append(problems, "SHOPPAGE_ADMIN_PASSWORD must be at least 12 characters")
	case pass == "shoppage-local-admin" || pass == "admin123":
		problems = append(problems, "SHOPPAGE_ADMIN_PASSWORD is a known development default")
	}
	if len(problems) > 0 {
		return fmt.Errorf("production configuration refused (set SHOPPAGE_ENV=development for local use): %s",
			strings.Join(problems, "; "))
	}
	return nil
}
