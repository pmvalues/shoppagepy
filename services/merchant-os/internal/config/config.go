// Package config holds environment-driven configuration for the Merchant OS.
// Anything that changes between environments (origins, paths, store identity)
// comes from here and nowhere else; handlers and templates must not hardcode it.
package config

import "os"

// Config is the runtime configuration for the merchant workspace.
type Config struct {
	// PublicBaseURL is the consumer-facing origin used for storefront links and
	// syndicated feed URLs (e.g. https://shoppage.co.za). Never localhost in
	// production.
	PublicBaseURL string
	// DataDir is the writable directory for uploads and (later) the SQLite store.
	DataDir string
	// StoreID overrides the bundled demo profile's store identifier.
	StoreID string
	// StoreName overrides the bundled demo profile's display name.
	StoreName string
}

// Load builds Config from the environment, with safe development defaults.
func Load() Config {
	return Config{
		PublicBaseURL: env("SHOPPAGE_PUBLIC_URL", "http://localhost:3000"),
		DataDir:       env("MERCHANT_DATA_DIR", env("DATA_DIR", "data")),
		StoreID:       os.Getenv("SHOPPAGE_STORE_ID"),
		StoreName:     os.Getenv("SHOPPAGE_STORE_NAME"),
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
