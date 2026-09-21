package index

import (
	"strings"
	"unicode"
)

// GenerateTrigrams splits a normalized string into 3-character shingles
func GenerateTrigrams(text string) map[string]struct{} {
	clean := strings.ToLower(strings.TrimSpace(text))
	// Pad string with boundary markers
	padded := "$" + clean + "$"
	trigrams := make(map[string]struct{})

	runes := []rune(padded)
	if len(runes) < 3 {
		if len(clean) > 0 {
			trigrams[clean] = struct{}{}
		}
		return trigrams
	}

	for i := 0; i <= len(runes)-3; i++ {
		tri := string(runes[i : i+3])
		trigrams[tri] = struct{}{}
	}
	return trigrams
}

// TrigramSimilarity computes the Jaccard similarity score between two texts (0.0 to 1.0)
func TrigramSimilarity(a, b string) float64 {
	if a == b {
		return 1.0
	}
	triA := GenerateTrigrams(a)
	triB := GenerateTrigrams(b)

	if len(triA) == 0 || len(triB) == 0 {
		return 0.0
	}

	intersection := 0
	for tri := range triA {
		if _, exists := triB[tri]; exists {
			intersection++
		}
	}

	union := len(triA) + len(triB) - intersection
	if union == 0 {
		return 0.0
	}

	return float64(intersection) / float64(union)
}

// Tokenize splits text into alphanumeric search tokens
func Tokenize(text string) []string {
	f := func(c rune) bool {
		return !unicode.IsLetter(c) && !unicode.IsNumber(c)
	}
	rawTokens := strings.FieldsFunc(strings.ToLower(text), f)
	var tokens []string
	for _, t := range rawTokens {
		if len(t) >= 2 {
			tokens = append(tokens, t)
		}
	}
	return tokens
}
