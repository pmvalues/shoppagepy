package models

import (
	"math"
	"strconv"
	"strings"
)

// FormatZAR renders a rand amount the way the consumer site does (South
// African convention): non-breaking-space thousands and two decimals,
// 19850 → "R 19 850.00". Every money figure in the workspace goes through it.
func FormatZAR(v float64) string {
	neg := v < 0
	cents := int64(math.Round(math.Abs(v) * 100))
	s := "R\u00A0" + groupThousands(cents/100) + "." + pad2(cents%100)
	if neg {
		return "−" + s
	}
	return s
}

// FormatZARWhole rounds to whole rand for headline figures: "R 84 260".
func FormatZARWhole(v float64) string {
	neg := v < 0
	s := "R\u00A0" + groupThousands(int64(math.Round(math.Abs(v))))
	if neg {
		return "−" + s
	}
	return s
}

// FormatInt groups a count with non-breaking-space thousands: 3102 → "3 102".
func FormatInt(n int) string {
	if n < 0 {
		return "−" + groupThousands(int64(-n))
	}
	return groupThousands(int64(n))
}

func groupThousands(n int64) string {
	w := strconv.FormatInt(n, 10)
	var b strings.Builder
	for i, ch := range w {
		if i > 0 && (len(w)-i)%3 == 0 {
			b.WriteRune('\u00A0')
		}
		b.WriteRune(ch)
	}
	return b.String()
}

func pad2(n int64) string {
	if n < 10 {
		return "0" + strconv.FormatInt(n, 10)
	}
	return strconv.FormatInt(n, 10)
}
