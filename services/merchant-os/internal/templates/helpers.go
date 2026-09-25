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

// ZAR formats money for display ("R 1 500.00"); see models.FormatZAR.
func ZAR(v float64) string { return models.FormatZAR(v) }

// ZARWhole formats whole-rand headline figures ("R 84 260").
func ZARWhole(v float64) string { return models.FormatZARWhole(v) }

// Int formats a count with thousands separators.
func Int(n int) string { return models.FormatInt(n) }

// Pct formats a percentage with no decimals, or one below 10.
func Pct(v float64) string {
	if v > 0 && v < 10 {
		return fmt.Sprintf("%.1f%%", v)
	}
	return fmt.Sprintf("%.0f%%", v)
}

// Width returns a CSS width for a 0–100 value, clamped.
func Width(pct float64) string {
	if pct < 0 {
		pct = 0
	}
	if pct > 100 {
		pct = 100
	}
	return fmt.Sprintf("width:%.1f%%", pct)
}

// OrderStatusLabel is the merchant-facing name of an order status.
func OrderStatusLabel(status string) string {
	switch strings.ToLower(status) {
	case "issued":
		return "Awaiting payment"
	case "confirmed":
		return "Paid · to pack"
	case "paid":
		return "Paid"
	case "packed":
		return "Packed"
	case "dispatched":
		return "Dispatched"
	case "delivered":
		return "Delivered"
	case "collected":
		return "Collected"
	case "cancelled":
		return "Cancelled"
	case "refunded":
		return "Refunded"
	}
	return strings.Title(status)
}

// OrderStatusClass maps an order status to a status pill tone.
func OrderStatusClass(status string) string {
	switch strings.ToLower(status) {
	case "issued":
		return "status warn"
	case "confirmed", "paid", "packed":
		return "status info"
	case "dispatched", "delivered", "collected":
		return "status ok"
	case "cancelled", "refunded":
		return "status bad"
	}
	return "status"
}

// Ago renders a short relative time ("5 min ago", "yesterday", "12 Sep").
func Ago(t, now time.Time) string {
	d := now.Sub(t)
	switch {
	case d < time.Minute:
		return "just now"
	case d < time.Hour:
		return fmt.Sprintf("%d min ago", int(d.Minutes()))
	case d < 24*time.Hour:
		return fmt.Sprintf("%d h ago", int(d.Hours()))
	case d < 48*time.Hour:
		return "yesterday"
	case d < 7*24*time.Hour:
		return fmt.Sprintf("%d days ago", int(d.Hours()/24))
	}
	return LocalDate(t)
}

var sast = time.FixedZone("SAST", 2*60*60)

// LocalDate renders a date in SAST as "12 Sep 2026".
func LocalDate(t time.Time) string { return t.In(sast).Format("2 Jan 2006") }

// LocalDateTime renders "12 Sep, 14:05" in SAST.
func LocalDateTime(t time.Time) string { return t.In(sast).Format("2 Jan, 15:04") }

// ScoreClass picks the ring tone for a 0–100 listing score.
func ScoreClass(score int) string {
	switch {
	case score >= 85:
		return "score-ring"
	case score >= 60:
		return "score-ring warn"
	}
	return "score-ring bad"
}

// ScoreStyle sets the ring fill.
func ScoreStyle(score int) string { return fmt.Sprintf("--v:%d", score) }

// Plural picks a word form for a count.
func Plural(n int, one, many string) string {
	if n == 1 {
		return one
	}
	return many
}

// Signed renders a signed change like "▲ 12%" / "▼ 4%".
func Signed(v float64) string {
	if v >= 0 {
		return fmt.Sprintf("▲ %.0f%%", v)
	}
	return fmt.Sprintf("▼ %.0f%%", -v)
}
