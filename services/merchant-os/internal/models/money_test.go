package models

import "testing"

func TestFormatZAR(t *testing.T) {
	tests := []struct {
		in   float64
		want string
	}{
		{0, "R\u00A00.00"},
		{22.88, "R\u00A022.88"},
		{1500, "R\u00A01\u00A0500.00"},
		{84260, "R\u00A084\u00A0260.00"},
		{1234567.891, "R\u00A01\u00A0234\u00A0567.89"},
		{-9.75, "−R\u00A09.75"},
	}
	for _, tt := range tests {
		if got := FormatZAR(tt.in); got != tt.want {
			t.Errorf("FormatZAR(%v) = %q, want %q", tt.in, got, tt.want)
		}
	}
	if got := FormatZARWhole(84259.6); got != "R\u00A084\u00A0260" {
		t.Errorf("FormatZARWhole = %q", got)
	}
	if got := FormatInt(3102); got != "3\u00A0102" {
		t.Errorf("FormatInt = %q", got)
	}
}

func TestValidGTIN(t *testing.T) {
	valid := []string{"6009882400018", "4006381333931", "96385074", "036000291452"}
	for _, c := range valid {
		if !ValidGTIN(c) {
			t.Errorf("ValidGTIN(%q) = false, want true", c)
		}
	}
	invalid := []string{"", "60098824001", "6009882400017", "60098824OO17"}
	for _, c := range invalid {
		if ValidGTIN(c) {
			t.Errorf("ValidGTIN(%q) = true, want false", c)
		}
	}
	if d := GTINCheckDigit("400638133393"); d != 1 {
		t.Errorf("GTINCheckDigit = %d, want 1", d)
	}
}

func TestReadinessBlocksGoogleWithoutBarcode(t *testing.T) {
	p := CatalogSKU{Title: "Commercial Anti-Theft Wooden Hanger 44cm", Brand: "Mitrend", Category: "Hospitality",
		WholesaleZar: 22.88, InStock: true, StockQuantity: 10, Spec: ProductDetailSpec{Barcode: "123"}}
	r := ComputeReadiness(p, true)
	if r.ReadyOn(ChannelGoogle) {
		t.Fatal("expected Google Shopping to be blocked by an invalid barcode")
	}
	if !r.ReadyOn(ChannelShoppage) {
		t.Fatalf("expected Shoppage search to accept the listing, blocked by %v", r.Blocked[ChannelShoppage])
	}
	if r.Score >= 100 || r.Score <= 0 {
		t.Fatalf("unexpected score %d", r.Score)
	}
}
