package templates

import "testing"

// FormatZAR is used on every displayed price, so its grouping/rounding rules
// are pinned here: non-breaking-space thousands, two decimals, sign preserved.
func TestFormatZAR(t *testing.T) {
	tests := []struct {
		name string
		in   float64
		want string
	}{
		{"zero", 0, "0.00"},
		{"under thousand", 899, "899.00"},
		{"exactly thousand", 1000, "1\u00A0000.00"},
		{"four digits", 9999, "9\u00A0999.00"},
		{"five digits", 19850, "19\u00A0850.00"},
		{"six digits", 123456, "123\u00A0456.00"},
		{"seven digits", 1234567, "1\u00A0234\u00A0567.00"},
		{"cents preserved", 34.86, "34.86"},
		{"binary-float half cent rounds down", 1.005, "1.00"},
		{"cents carry into whole", 9.999, "10.00"},
		{"negative", -4500.5, "-4\u00A0500.50"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := FormatZAR(tt.in); got != tt.want {
				t.Errorf("FormatZAR(%v) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}

func TestFormatZARWhole(t *testing.T) {
	tests := []struct {
		in   float64
		want string
	}{
		{400, "400"},
		{4000, "4\u00A0000"},
		{250, "250"},
	}
	for _, tt := range tests {
		if got := FormatZARWhole(tt.in); got != tt.want {
			t.Errorf("FormatZARWhole(%v) = %q, want %q", tt.in, got, tt.want)
		}
	}
}
