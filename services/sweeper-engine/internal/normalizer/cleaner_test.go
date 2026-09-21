package normalizer_test

import (
	"testing"

	"github.com/shoppage/sweeper-engine/internal/models"
	"github.com/shoppage/sweeper-engine/internal/normalizer"
)

func TestNormalizePhoneNumber(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"Standard local with 0", "082 123 4567", "+27821234567"},
		{"Standard landline with brackets", "(021) 555-1234", "+27215551234"},
		{"Without leading +", "27821234567", "+27821234567"},
		{"Already international", "+27821234567", "+27821234567"},
		{"Empty phone", "", ""},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := normalizer.NormalizePhoneNumber(tc.input)
			if got != tc.expected {
				t.Errorf("NormalizePhoneNumber(%q) = %q; want %q", tc.input, got, tc.expected)
			}
		})
	}
}

func TestGenerateSlug(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"Standard brand", "Protea Brake & Clutch", "protea-brake-clutch"},
		{"Special chars", "Builders Warehouse (Pty) Ltd.", "builders-warehouse-pty-ltd"},
		{"Whitespace padding", "   Woolworths Food   ", "woolworths-food"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := normalizer.GenerateSlug(tc.input)
			if got != tc.expected {
				t.Errorf("GenerateSlug(%q) = %q; want %q", tc.input, got, tc.expected)
			}
		})
	}
}

func TestNormalizeRecord(t *testing.T) {
	raw := models.RawMerchantRecord{
		Source:     models.SourceOSM,
		SourceID:   "osm_node_9999",
		Name:       "  Cape Town Hardware Co.  ",
		Category:   "Hardware Store",
		Address:    "12 Main Rd",
		City:       "Cape Town",
		Province:   "Western Cape",
		PostalCode: "8001",
		Country:    "ZA",
		Phone:      "021 444 8888",
		Email:      "Sales@CTHardware.co.za",
		Latitude:   -33.9249,
		Longitude:  18.4241,
	}

	norm := normalizer.NormalizeRecord(raw)

	if norm.Name != "Cape Town Hardware Co." {
		t.Errorf("expected trimmed name, got %q", norm.Name)
	}
	if norm.Slug != "cape-town-hardware-co" {
		t.Errorf("expected slug 'cape-town-hardware-co', got %q", norm.Slug)
	}
	if norm.Phone != "+27214448888" {
		t.Errorf("expected phone '+27214448888', got %q", norm.Phone)
	}
	if norm.Email != "sales@cthardware.co.za" {
		t.Errorf("expected lowercase email, got %q", norm.Email)
	}
	if norm.Verified != false {
		t.Errorf("expected unverified by default, got true")
	}
}
