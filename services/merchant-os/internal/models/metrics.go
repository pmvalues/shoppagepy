package models

import (
	"strings"
	"time"
)

// Plan is one subscription tier. It is the single source for every plan fact the
// workspace shows (monthly fee, free sales allowance, fee rate above it), so the
// dashboard, analytics, settings and assistant can never disagree.
type Plan struct {
	Name             string  // stored on StoreProfile.CurrentPlan
	Label            string  // short display name
	MonthlyFeeZar    float64 // subscription price
	FreeAllowanceZar float64 // monthly sales processed with no platform fee
	FeeRatePct       float64 // platform fee on sales above the allowance
	Summary          string
}

// Plans lists the subscription tiers in upgrade order.
var Plans = []Plan{
	{Name: "Launch Free (R0/mo)", Label: "Launch", MonthlyFeeZar: 0, FreeAllowanceZar: 50000, FeeRatePct: 1.0,
		Summary: "For new traders and WhatsApp shops."},
	{Name: "Grow (R199/mo)", Label: "Grow", MonthlyFeeZar: 199, FreeAllowanceZar: 75000, FeeRatePct: 0.8,
		Summary: "For growing merchants. Adds accounting export."},
	{Name: "Pro Wholesale (R599/mo)", Label: "Pro Wholesale", MonthlyFeeZar: 599, FreeAllowanceZar: 200000, FeeRatePct: 0.5,
		Summary: "For wholesalers with several locations and staff."},
}

// PlanFor resolves a stored plan name; unknown or empty names fall back to Launch.
func PlanFor(name string) Plan {
	for _, p := range Plans {
		if strings.EqualFold(p.Name, name) {
			return p
		}
	}
	return Plans[0]
}

// DayPoint is one day of sales for charts.
type DayPoint struct {
	Day      time.Time
	SalesZar float64
	Orders   int
}

// ShareRow is one slice of a mix (sales channel, payment method).
type ShareRow struct {
	Label    string
	ValueZar float64
	Count    int
	Pct      float64
}

// StockAlert is a product at or below its reorder level.
type StockAlert struct {
	ID        string
	SKU       string
	Title     string
	Quantity  int
	Threshold int
}

// AttentionItem is one row of the Home "needs you" list. Every item links to
// the place where the merchant resolves it.
type AttentionItem struct {
	Kind   string // "order", "stock", "message", "quote", "feed", "setup"
	Tone   string // "warn", "danger", "info"
	Title  string
	Detail string
	Href   string
	Action string
}

// HubStock is the derived view of one location: how many products it holds
// and the units on hand, summed from each product's per-location stock.
type HubStock struct {
	Hub      WarehouseHub
	Products int
	Units    int
	ValueZar float64
}

// Metrics is every computed number the workspace displays. It is derived from
// stored records on each request (see handlers.computeMetrics); templates must
// read figures from here rather than typing them into markup.
type Metrics struct {
	Now time.Time

	TodaySalesZar     float64
	YesterdaySalesZar float64
	TodayOrders       int
	YesterdayOrders   int

	MonthSalesZar     float64
	MonthOrders       int
	PrevMonthSalesZar float64
	AvgOrderValueZar  float64

	OpenOrders      int
	AwaitingPayment int
	ToFulfil        int

	OpenQuotes       int
	QuotePipelineZar float64
	QuotesWon        int
	QuotesTotal      int
	ReturnsOpen      int
	UnreadMessages   int
	WaitingThreads   int

	Products        int
	Published       int
	OutOfStock      int
	LowStock        []StockAlert
	CatalogValueZar float64
	CatalogUnits    int
	Hubs            []HubStock

	Plan                  Plan
	AllowanceUsedZar      float64
	AllowanceRemainingZar float64
	AllowancePct          float64
	PlatformFeeZar        float64
	ProjectedMonthZar     float64
	ProjectedFeeZar       float64

	Daily        []DayPoint // last 14 days, oldest first
	Best         DayPoint
	Last14Sales  float64
	Last14Orders int
	ChannelMix   []ShareRow
	PaymentMix   []ShareRow
	TopProducts  []ShareRow

	FeedIssues int
	Attention  []AttentionItem
	Setup      []SetupStep
	SetupDone  int
}

// SetupStep is one onboarding checklist item, computed from store state.
type SetupStep struct {
	Title  string
	Detail string
	Href   string
	Done   bool
}

// PctChange returns the percentage change from prev to cur, and false when
// there is no baseline to compare against.
func PctChange(cur, prev float64) (float64, bool) {
	if prev <= 0 {
		return 0, false
	}
	return (cur - prev) / prev * 100, true
}

// UndoEntry records a reversible change so the merchant can take it back from
// the confirmation toast (price edits, applied assistant proposals).
type UndoEntry struct {
	ID       string    `json:"id"`
	Kind     string    `json:"kind"` // "price", "proposal"
	TargetID string    `json:"targetId"`
	Label    string    `json:"label"`
	OldValue float64   `json:"oldValue"`
	NewValue float64   `json:"newValue"`
	At       time.Time `json:"at"`
	Undone   bool      `json:"undone"`
}
