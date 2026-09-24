package templates

import "sync"

// RetailerStat is one retailer facet used to build the deals navigation. The
// list comes from the loaded deals, so a retailer can never be advertised with
// a branch count or a catalogue the platform does not hold.
type RetailerStat struct {
	Key   string
	Label string
	Deals int
}

// PlatformStats are the live catalogue counters rendered in the chrome
// (sidebar, commerce rail, page copy). They are supplied by the composition
// root so templates never hardcode a scale figure and never import the store.
type PlatformStats struct {
	Merchants      int
	Products       int
	Malls          int
	Deals          int
	Retailers      []RetailerStat
	MaxDiscountPct int
	// SampleData is true when the catalogue is the bundled demonstration
	// content rather than an operator-supplied dataset. Templates must
	// disclose it instead of letting sample rows read as live truth.
	SampleData bool
	// DataNotice is the one-line proven disclosure for sample mode.
	DataNotice string
}

var (
	statsMu       sync.RWMutex
	statsProvider func() PlatformStats
)

// SetStatsProvider wires the live counters at startup. Pass nil to clear.
func SetStatsProvider(fn func() PlatformStats) {
	statsMu.Lock()
	statsProvider = fn
	statsMu.Unlock()
}

// Stats returns the current platform counters. When no provider is wired
// (unit tests, static renders) it returns zero values, and callers must render
// those as "not published" rather than inventing a number.
func Stats() PlatformStats {
	statsMu.RLock()
	fn := statsProvider
	statsMu.RUnlock()
	if fn == nil {
		return PlatformStats{}
	}
	return fn()
}
