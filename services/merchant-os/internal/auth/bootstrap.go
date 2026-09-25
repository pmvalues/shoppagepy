package auth

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/shoppage/platform/env"
)

const (
	localSecretFile  = ".shoppage-auth-secret"
	localEmailEnv    = "SHOPPAGE_ADMIN_EMAIL"
	localPasswordEnv = "SHOPPAGE_ADMIN_PASSWORD"
	// Local-only demo credentials used when the operator has not configured
	// SHOPPAGE_ADMIN_*. Printed once at bootstrap so the desk is usable without
	// hunting through docs. Overridden by any non-empty env value.
	defaultLocalEmail    = "admin@shoppage.local"
	defaultLocalPassword = "shoppage-local-admin"
)

// IsProduction reports whether production safeguards apply. It delegates to
// the shared, fail-closed detector: only an explicit SHOPPAGE_ENV of
// development|dev|local|test counts as non-production.
func IsProduction() bool {
	return env.IsProduction()
}

// EnsureLocalAuth bootstraps development credentials when the desk has no
// SHOPPAGE_AUTH_SECRET / SHOPPAGE_ADMIN_* configured.
//
// Production (any SHOPPAGE_ENV other than development|dev|local|test,
// including unset) never bootstraps: those instances must fail closed until an operator sets
// real secrets. Development persists a generated HMAC secret under data/ so
// sessions survive restarts, and fills demo admin credentials when unset.
// Returns true when a missing secret was bootstrapped (caller may log it).
func EnsureLocalAuth() (bootstrapped bool) {
	if IsProduction() {
		return false
	}

	if len(os.Getenv("SHOPPAGE_AUTH_SECRET")) < 32 {
		secret, created := loadOrCreateSecret()
		if secret == "" {
			return false
		}
		_ = os.Setenv("SHOPPAGE_AUTH_SECRET", secret)
		bootstrapped = created
	}

	if os.Getenv(localEmailEnv) == "" {
		_ = os.Setenv(localEmailEnv, defaultLocalEmail)
	}
	if os.Getenv(localPasswordEnv) == "" {
		_ = os.Setenv(localPasswordEnv, defaultLocalPassword)
		fmt.Printf("[auth] Local Merchant OS login: %s / %s (set %s to override)\n",
			defaultLocalEmail, defaultLocalPassword, localPasswordEnv)
	}
	return bootstrapped
}

func loadOrCreateSecret() (string, bool) {
	for _, dir := range secretDirs() {
		path := filepath.Join(dir, localSecretFile)
		if b, err := os.ReadFile(path); err == nil {
			s := strings.TrimSpace(string(b))
			if len(s) >= 32 {
				return s, false
			}
		}
	}
	secret := randomSecret(48)
	for _, dir := range secretDirs() {
		if dir == "" {
			continue
		}
		if err := os.MkdirAll(dir, 0o755); err != nil {
			continue
		}
		path := filepath.Join(dir, localSecretFile)
		if err := os.WriteFile(path, []byte(secret+"\n"), 0o600); err == nil {
			fmt.Printf("[auth] Wrote development session secret to %s\n", path)
			return secret, true
		}
	}
	return secret, true
}

func secretDirs() []string {
	var dirs []string
	if d := strings.TrimSpace(os.Getenv("MERCHANT_DATA_DIR")); d != "" {
		dirs = append(dirs, d)
	}
	if d := strings.TrimSpace(os.Getenv("DATA_DIR")); d != "" {
		dirs = append(dirs, d)
	}
	dirs = append(dirs, "data")
	if exe, err := os.Executable(); err == nil {
		dirs = append(dirs, filepath.Join(filepath.Dir(exe), "data"))
	}
	return dirs
}

func randomSecret(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return strings.Repeat("0", 64)
	}
	return hex.EncodeToString(b)
}
