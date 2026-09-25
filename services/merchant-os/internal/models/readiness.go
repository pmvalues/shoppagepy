package models

import (
	"strings"
	"unicode"
)

// Sales channels a product can be listed on. The product record is the only
// place a merchant edits; each channel's requirements are checked against it.
const (
	ChannelShoppage = "Shoppage search"
	ChannelGoogle   = "Google Shopping"
	ChannelMeta     = "Facebook & Instagram"
	ChannelWhatsApp = "WhatsApp catalogue"
)

// ListingChannels is the display order of channels.
var ListingChannels = []string{ChannelShoppage, ChannelGoogle, ChannelMeta, ChannelWhatsApp}

// ReadinessCheck is one rule a listing is scored against. Points are only
// awarded when the rule passes; Fix tells the merchant exactly what to change.
type ReadinessCheck struct {
	Label  string
	Passed bool
	Points int
	Fix    string
	Blocks []string // channels that reject the listing when this fails
}

// ProductReadiness is the computed listing quality of one product: a 0–100
// discoverability score and which channels will accept it as-is.
type ProductReadiness struct {
	Score    int
	Checks   []ReadinessCheck
	Blocked  map[string][]string // channel -> reasons
	HasPhoto bool
}

// ReadyOn reports whether nothing blocks the product on a channel.
func (r ProductReadiness) ReadyOn(channel string) bool {
	return len(r.Blocked[channel]) == 0
}

// ReadyCount is the number of channels the product can list on today.
func (r ProductReadiness) ReadyCount() int {
	n := 0
	for _, ch := range ListingChannels {
		if r.ReadyOn(ch) {
			n++
		}
	}
	return n
}

// FailedChecks returns the checks still to fix, most valuable first.
func (r ProductReadiness) FailedChecks() []ReadinessCheck {
	var out []ReadinessCheck
	for _, c := range r.Checks {
		if !c.Passed {
			out = append(out, c)
		}
	}
	for i := 1; i < len(out); i++ {
		for j := i; j > 0 && out[j].Points > out[j-1].Points; j-- {
			out[j], out[j-1] = out[j-1], out[j]
		}
	}
	return out
}

// ValidGTIN reports whether code is a well-formed GTIN-8/12/13/14 with a
// correct GS1 check digit. Google Shopping rejects anything else.
func ValidGTIN(code string) bool {
	code = strings.TrimSpace(code)
	switch len(code) {
	case 8, 12, 13, 14:
	default:
		return false
	}
	sum := 0
	for i, r := range code {
		if !unicode.IsDigit(r) {
			return false
		}
		if i == len(code)-1 {
			break
		}
		d := int(r - '0')
		// weights alternate 3,1 counting from the digit left of the check digit
		if (len(code)-1-i)%2 == 1 {
			d *= 3
		}
		sum += d
	}
	check := (10 - sum%10) % 10
	return int(code[len(code)-1]-'0') == check
}

// GTINCheckDigit returns the GS1 check digit for a code body (all digits but
// the last). Used to generate valid demo barcodes and to suggest fixes.
func GTINCheckDigit(body string) int {
	sum := 0
	for i, r := range body {
		d := int(r - '0')
		if (len(body)-i)%2 == 1 {
			d *= 3
		}
		sum += d
	}
	return (10 - sum%10) % 10
}

// ComputeReadiness scores a product against every channel's listing rules.
// hasPhoto is supplied by the caller (photos live in the media library).
func ComputeReadiness(p CatalogSKU, hasPhoto bool) ProductReadiness {
	all := ListingChannels
	titleLen := len([]rune(strings.TrimSpace(p.Title)))
	descLen := len([]rune(strings.TrimSpace(p.Spec.LongDesc)))
	barcode := strings.TrimSpace(p.Spec.Barcode)

	checks := []ReadinessCheck{
		{Label: "Product title", Points: 15, Passed: titleLen >= 20 && titleLen <= 150,
			Fix: "Write a title of 20–150 characters: brand, product type, size and key feature.", Blocks: all},
		{Label: "Price", Points: 15, Passed: p.WholesaleZar > 0 || p.RetailZar > 0,
			Fix: "Set a selling price. Listings without a price are rejected everywhere.", Blocks: all},
		{Label: "Product photo", Points: 15, Passed: hasPhoto,
			Fix:    "Upload at least one clear photo on a plain background (Products → Media).",
			Blocks: []string{ChannelGoogle, ChannelMeta, ChannelWhatsApp}},
		{Label: "Barcode (GTIN)", Points: 15, Passed: ValidGTIN(barcode),
			Fix: gtinFix(barcode), Blocks: []string{ChannelGoogle}},
		{Label: "Description", Points: 10, Passed: descLen >= 150,
			Fix: "Describe materials, size, pack quantity and use in at least 150 characters. Buyers and AI search both read this."},
		{Label: "Category", Points: 5, Passed: strings.TrimSpace(p.Category) != "",
			Fix: "Choose a category so buyers can filter to it.", Blocks: []string{ChannelShoppage}},
		{Label: "Brand", Points: 5, Passed: strings.TrimSpace(p.Brand) != "",
			Fix: "Add the brand name, or your store name for own-brand goods.", Blocks: []string{ChannelGoogle}},
		{Label: "Search keywords", Points: 5, Passed: len(p.Spec.SEOTags) >= 3,
			Fix: "Add at least 3 keywords buyers would type, e.g. \"hotel hangers\"."},
		{Label: "Shipping weight", Points: 5, Passed: p.Spec.WeightKg > 0,
			Fix: "Enter the packed weight so delivery can be quoted."},
		{Label: "In stock", Points: 10, Passed: p.InStock && p.StockQuantity > 0,
			Fix: "Restock or mark as available on order. Out-of-stock items are hidden from search."},
	}

	r := ProductReadiness{Checks: checks, Blocked: map[string][]string{}, HasPhoto: hasPhoto}
	for _, c := range checks {
		if c.Passed {
			r.Score += c.Points
			continue
		}
		for _, ch := range c.Blocks {
			r.Blocked[ch] = append(r.Blocked[ch], c.Label)
		}
	}
	return r
}

func gtinFix(code string) string {
	digits := 0
	for _, r := range code {
		if unicode.IsDigit(r) {
			digits++
		}
	}
	switch {
	case code == "":
		return "Add the barcode printed on the pack (EAN-13). Google Shopping needs it for branded goods."
	case digits != len(code):
		return "The barcode may only contain digits."
	case len(code) != 8 && len(code) != 12 && len(code) != 13 && len(code) != 14:
		return "The barcode has " + itoa(len(code)) + " digits. EAN barcodes have 13; check the pack for missing digits."
	default:
		return "The last digit doesn't match the rest of the barcode, so it was probably mistyped. Re-enter it from the pack."
	}
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var b []byte
	for n > 0 {
		b = append([]byte{byte('0' + n%10)}, b...)
		n /= 10
	}
	return string(b)
}
