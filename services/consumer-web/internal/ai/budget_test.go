package ai

import (
	"testing"
	"time"
)

func TestDailyBudgetResetsAtUTCMidnight(t *testing.T) {
	now := time.Date(2026, 9, 25, 23, 59, 0, 0, time.UTC)
	b := NewDailyBudget(2)
	b.now = func() time.Time { return now }
	if !b.Take() || !b.Take() {
		t.Fatal("first two calls must be allowed")
	}
	if b.Take() {
		t.Fatal("third call exceeds the daily budget")
	}
	now = now.Add(2 * time.Minute)
	if !b.Take() {
		t.Fatal("budget must reset on a new UTC day")
	}
}

func TestZeroBudgetDisablesLiveCalls(t *testing.T) {
	if NewDailyBudget(0).Take() {
		t.Fatal("GEMINI_DAILY_LIMIT=0 must disable live calls")
	}
}
