// Package env centralises environment detection shared by every Shoppage
// service. Detection fails closed: a process is treated as production unless
// it has been explicitly marked as a development or test instance.
package env

import (
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
