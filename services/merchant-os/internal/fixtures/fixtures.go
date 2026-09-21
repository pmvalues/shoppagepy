// Package fixtures carries the demonstration store profile bundled with the
// Merchant OS. The profile exists so the workspace is explorable before
// persistence and real merchant onboarding land (see the engineering foundation
// E-4 in docs/PRODUCT_TRANSFORMATION_BLUEPRINT.md). No identity value lives in
// Go source — the JSON fixture is the single source, overridable per environment
// via SHOPPAGE_STORE_ID / SHOPPAGE_STORE_NAME.
package fixtures

import (
	_ "embed"
	"encoding/json"
	"time"

	"github.com/shoppage/merchant-os/internal/config"
	"github.com/shoppage/merchant-os/internal/models"
)

//go:embed store.json
var demoStoreJSON []byte

// DemoStoreProfile loads the bundled demonstration store profile and applies any
// environment overrides from cfg.
func DemoStoreProfile(cfg config.Config) models.StoreProfile {
	var p models.StoreProfile
	if err := json.Unmarshal(demoStoreJSON, &p); err != nil || p.ID == "" {
		p = models.StoreProfile{
			ID:                 "demo-store",
			Name:               "Demo Store",
			VerificationStatus: "candidate",
		}
	}
	if cfg.StoreID != "" {
		p.ID = cfg.StoreID
	}
	if cfg.StoreName != "" {
		p.Name = cfg.StoreName
		if p.LegalName == "" {
			p.LegalName = cfg.StoreName
		}
	}
	p.UpdatedAt = time.Now().UTC()
	return p
}
