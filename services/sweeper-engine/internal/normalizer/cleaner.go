package normalizer

import (
	"crypto/sha256"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/shoppage/sweeper-engine/internal/models"
)

var (
	phoneRegex = regexp.MustCompile(`[^\d+]`)
	slugRegex  = regexp.MustCompile(`[^a-z0-9]+`)
)

// NormalizePhoneNumber standardizes South African telephone numbers to international format (+27...)
func NormalizePhoneNumber(raw string) string {
	cleaned := phoneRegex.ReplaceAllString(raw, "")
	if cleaned == "" {
		return ""
	}

	// Format: 0821234567 -> +27821234567
	if strings.HasPrefix(cleaned, "0") && len(cleaned) == 10 {
		return "+27" + cleaned[1:]
	}

	// Format: 27821234567 -> +27821234567
	if strings.HasPrefix(cleaned, "27") && len(cleaned) == 11 {
		return "+" + cleaned
	}

	// Format: +27821234567
	if strings.HasPrefix(cleaned, "+27") && len(cleaned) == 12 {
		return cleaned
	}

	return cleaned
}

// GenerateSlug turns a merchant name into a URL-safe slug
func GenerateSlug(name string) string {
	lower := strings.ToLower(strings.TrimSpace(name))
	slug := slugRegex.ReplaceAllString(lower, "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = "merchant"
	}
	return slug
}

// GenerateMerchantID creates a deterministic ID based on source and source ID or coordinates
func GenerateMerchantID(source models.SourceKind, key string) string {
	h := sha256.Sum256([]byte(fmt.Sprintf("%s:%s", source, key)))
	return fmt.Sprintf("loc_za_%x", h[:4])
}

// NormalizeRecord transforms a RawMerchantRecord into a clean NormalizedMerchantRecord
func NormalizeRecord(raw models.RawMerchantRecord) models.NormalizedMerchantRecord {
	cleanName := strings.TrimSpace(raw.Name)
	cleanPhone := NormalizePhoneNumber(raw.Phone)
	slug := GenerateSlug(cleanName)

	idKey := raw.SourceID
	if idKey == "" {
		idKey = fmt.Sprintf("%.6f,%.6f", raw.Latitude, raw.Longitude)
	}
	id := GenerateMerchantID(raw.Source, idKey)

	// Clean category
	category := strings.TrimSpace(raw.Category)
	if category == "" {
		category = "General Retail"
	}

	return models.NormalizedMerchantRecord{
		ID:          id,
		Slug:        slug,
		Name:        cleanName,
		Category:    category,
		Phone:       cleanPhone,
		Email:       strings.ToLower(strings.TrimSpace(raw.Email)),
		Website:     strings.TrimSpace(raw.Website),
		Street:      strings.TrimSpace(raw.Address),
		City:        strings.TrimSpace(raw.City),
		Province:    strings.TrimSpace(raw.Province),
		PostalCode:  strings.TrimSpace(raw.PostalCode),
		Latitude:    raw.Latitude,
		Longitude:   raw.Longitude,
		Verified:    false, // Default unverified until merchant claims/subscribes
		Source:      raw.Source,
		UpdatedAt:   time.Now().UTC(),
	}
}
