package templates

import (
	"fmt"
	"strings"
	"time"

	"github.com/shoppage/merchant-os/internal/models"
)

// EntityCode derives a short legal-entity badge from a registered name,
// e.g. "Mitrend Products (Pty) Ltd" -> "MITREND". Derived from data, not hardcoded.
func EntityCode(legal string) string {
	base := legal
	for _, suffix := range []string{" (Pty) Ltd.", " (Pty) Ltd", " (RF) NPC", " (RF)", " NPC", " CC", " Ltd", " (Ltd)"} {
		base = strings.ReplaceAll(base, suffix, "")
	}
	parts := strings.Fields(strings.TrimSpace(base))
	if len(parts) == 0 {
		return "STORE"
	}
	return strings.ToUpper(parts[0])
}

// FiscalYear renders the current fiscal year badge, e.g. "FY26".
func FiscalYear(t time.Time) string {
	return fmt.Sprintf("FY%02d", t.Year()%100)
}

// MediaTotalKb sums the recorded size of every media asset (uploaded or linked).
func MediaTotalKb(assets []models.MediaAsset) int {
	total := 0
	for _, a := range assets {
		total += a.SizeKb
	}
	return total
}

// MediaCountCategory counts assets whose category contains the given text.
func MediaCountCategory(assets []models.MediaAsset, contains string) int {
	n := 0
	for _, a := range assets {
		if strings.Contains(strings.ToLower(a.Category), strings.ToLower(contains)) {
			n++
		}
	}
	return n
}

// MediaStoredLocally reports whether an asset is a file stored on this node
// (as opposed to an externally hosted link).
func MediaStoredLocally(a models.MediaAsset) bool {
	return strings.HasPrefix(a.URL, "/media/files/")
}

// Greeting returns a time-of-day greeting for the workspace top bar.
func Greeting(t time.Time) string {
	switch hour := t.Hour(); {
	case hour < 12:
		return "Good morning"
	case hour < 17:
		return "Good afternoon"
	default:
		return "Good evening"
	}
}
