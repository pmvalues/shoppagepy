package handlers

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/shoppage/merchant-os/internal/models"
)

// Timezone for "today" and "this month": merchants trade in SAST.
var sast = time.FixedZone("SAST", 2*60*60)

func equalFoldTrim(a, b string) bool {
	return strings.EqualFold(strings.TrimSpace(a), strings.TrimSpace(b))
}

// orderIsClosed reports whether an order no longer needs the merchant.
func orderIsClosed(status string) bool {
	switch strings.ToLower(status) {
	case "dispatched", "delivered", "collected", "cancelled", "refunded":
		return true
	}
	return false
}

// orderCountsAsSale reports whether an order's value is real revenue
// (anything except cancelled or refunded).
func orderCountsAsSale(status string) bool {
	switch strings.ToLower(status) {
	case "cancelled", "refunded":
		return false
	}
	return true
}

func dayStart(t time.Time) time.Time {
	t = t.In(sast)
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, sast)
}

// sale is one revenue event from either an order or a counter sale.
type sale struct {
	at      time.Time
	zar     float64
	channel string
	payment string
	lines   []models.ProformaLineItem
}

func collectSales(s *MerchantStoreState) []sale {
	var out []sale
	for _, o := range s.Orders {
		if !orderCountsAsSale(o.Status) {
			continue
		}
		out = append(out, sale{at: o.Date, zar: o.GrandTotal, channel: "Trade orders & quotes", payment: o.PaymentMethod, lines: o.LineItems})
	}
	for _, t := range s.RecentPOSTxns {
		var lines []models.ProformaLineItem
		for _, it := range t.Items {
			lines = append(lines, models.ProformaLineItem{SKU: it.SKU, Title: it.Title, Quantity: it.Quantity, TotalZar: it.TotalZar})
		}
		out = append(out, sale{at: t.Timestamp, zar: t.TotalZar, channel: "Counter sales (POS)", payment: t.PaymentMethod, lines: lines})
	}
	return out
}

// hasProductPhoto reports whether the media library holds a product photo
// whose name references the SKU code.
func hasProductPhoto(media []models.MediaAsset, sku string) bool {
	for _, m := range media {
		if strings.Contains(strings.ToLower(m.Category), "photo") &&
			strings.Contains(strings.ToUpper(m.Name), strings.ToUpper(sku)) {
			return true
		}
	}
	return false
}

// computeReadiness scores every product for listing quality.
func computeReadiness(s *MerchantStoreState) map[string]models.ProductReadiness {
	out := make(map[string]models.ProductReadiness, len(s.Catalog))
	for _, p := range s.Catalog {
		out[p.ID] = models.ComputeReadiness(p, hasProductPhoto(s.MediaAssets, p.SKU))
	}
	return out
}

// computeMetrics derives every figure the workspace shows from stored records.
// Callers must hold at least the read lock.
func computeMetrics(s *MerchantStoreState, readiness map[string]models.ProductReadiness, now time.Time) models.Metrics {
	m := models.Metrics{Now: now}
	today := dayStart(now)
	yesterday := today.AddDate(0, 0, -1)
	monthStart := time.Date(today.Year(), today.Month(), 1, 0, 0, 0, 0, sast)
	prevMonthStart := monthStart.AddDate(0, -1, 0)
	prevMonthSameDay := prevMonthStart.Add(now.In(sast).Sub(monthStart))
	windowStart := today.AddDate(0, 0, -13)

	m.Daily = make([]models.DayPoint, 14)
	for i := range m.Daily {
		m.Daily[i].Day = windowStart.AddDate(0, 0, i)
	}

	channels := map[string]*models.ShareRow{}
	payments := map[string]*models.ShareRow{}
	products := map[string]*models.ShareRow{}
	for _, sl := range collectSales(s) {
		at := sl.at.In(sast)
		switch {
		case !at.Before(today):
			m.TodaySalesZar += sl.zar
			m.TodayOrders++
		case !at.Before(yesterday):
			m.YesterdaySalesZar += sl.zar
			m.YesterdayOrders++
		}
		if !at.Before(windowStart) && at.Before(today.AddDate(0, 0, 1)) {
			d := int(dayStart(at).Sub(windowStart).Hours() / 24)
			if d >= 0 && d < len(m.Daily) {
				m.Daily[d].SalesZar += sl.zar
				m.Daily[d].Orders++
			}
		}
		if !at.Before(prevMonthStart) && at.Before(prevMonthSameDay) {
			m.PrevMonthSalesZar += sl.zar
		}
		if at.Before(monthStart) {
			continue
		}
		m.MonthSalesZar += sl.zar
		m.MonthOrders++
		addShare(channels, sl.channel, sl.zar)
		addShare(payments, sl.payment, sl.zar)
		for _, ln := range sl.lines {
			addShare(products, ln.Title, ln.TotalZar)
		}
	}
	if m.MonthOrders > 0 {
		m.AvgOrderValueZar = m.MonthSalesZar / float64(m.MonthOrders)
	}
	for _, d := range m.Daily {
		m.Last14Sales += d.SalesZar
		m.Last14Orders += d.Orders
		if d.SalesZar > m.Best.SalesZar {
			m.Best = d
		}
	}
	m.ChannelMix = sortedShares(channels, m.MonthSalesZar, 0)
	m.PaymentMix = sortedShares(payments, m.MonthSalesZar, 0)
	m.TopProducts = sortedShares(products, m.MonthSalesZar, 5)

	// Plan allowance and fees.
	m.Plan = models.PlanFor(s.Store.CurrentPlan)
	m.AllowanceUsedZar = m.MonthSalesZar
	if m.Plan.FreeAllowanceZar > 0 {
		m.AllowancePct = m.MonthSalesZar / m.Plan.FreeAllowanceZar * 100
		if m.AllowancePct > 100 {
			m.AllowancePct = 100
		}
	}
	m.AllowanceRemainingZar = m.Plan.FreeAllowanceZar - m.MonthSalesZar
	if m.AllowanceRemainingZar < 0 {
		m.PlatformFeeZar = -m.AllowanceRemainingZar * m.Plan.FeeRatePct / 100
		m.AllowanceRemainingZar = 0
	}
	daysElapsed := now.In(sast).Sub(monthStart).Hours() / 24
	daysInMonth := float64(monthStart.AddDate(0, 1, -1).Day())
	if daysElapsed >= 1 {
		m.ProjectedMonthZar = m.MonthSalesZar / daysElapsed * daysInMonth
	} else {
		m.ProjectedMonthZar = m.MonthSalesZar
	}
	if over := m.ProjectedMonthZar - m.Plan.FreeAllowanceZar; over > 0 {
		m.ProjectedFeeZar = over * m.Plan.FeeRatePct / 100
	}

	// Orders.
	for _, o := range s.Orders {
		if orderIsClosed(o.Status) {
			continue
		}
		m.OpenOrders++
		switch strings.ToLower(o.Status) {
		case "issued":
			m.AwaitingPayment++
		default:
			m.ToFulfil++
		}
	}
	for _, r := range s.ReturnRequests {
		switch r.Status {
		case "Refund Issued", "Rejected":
		default:
			m.ReturnsOpen++
		}
	}

	// Quotes.
	for _, l := range s.Leads {
		m.QuotesTotal++
		switch l.Status {
		case "new", "quoted":
			m.OpenQuotes++
			m.QuotePipelineZar += l.EstimatedTotal
		case "accepted", "completed", "converted":
			m.QuotesWon++
		}
	}
	for _, t := range s.ChatThreads {
		m.UnreadMessages += t.UnreadCount
		if t.UnreadCount > 0 {
			m.WaitingThreads++
		}
	}

	// Catalogue and stock.
	hubIndex := map[string]int{}
	for _, h := range s.Warehouses {
		hubIndex[h.ID] = len(m.Hubs)
		m.Hubs = append(m.Hubs, models.HubStock{Hub: h})
	}
	for _, p := range s.Catalog {
		m.Products++
		if p.FeedStatus == "Active" {
			m.Published++
		}
		m.CatalogUnits += p.StockQuantity
		m.CatalogValueZar += float64(p.StockQuantity) * p.WholesaleZar
		if p.StockQuantity <= 0 {
			m.OutOfStock++
		}
		if p.LowStockAlert > 0 && p.StockQuantity <= p.LowStockAlert {
			m.LowStock = append(m.LowStock, models.StockAlert{ID: p.ID, SKU: p.SKU, Title: p.Title, Quantity: p.StockQuantity, Threshold: p.LowStockAlert})
		}
		for hub, q := range p.StockByHub {
			if i, ok := hubIndex[hub]; ok && q > 0 {
				m.Hubs[i].Products++
				m.Hubs[i].Units += q
				m.Hubs[i].ValueZar += float64(q) * p.WholesaleZar
			}
		}
		if r, ok := readiness[p.ID]; ok && r.ReadyCount() < len(models.ListingChannels) {
			m.FeedIssues++
		}
	}
	sort.SliceStable(m.LowStock, func(a, b int) bool { return m.LowStock[a].Quantity < m.LowStock[b].Quantity })

	m.Attention = attentionList(s, m)
	m.Setup = setupSteps(s, m)
	for _, st := range m.Setup {
		if st.Done {
			m.SetupDone++
		}
	}
	return m
}

func addShare(rows map[string]*models.ShareRow, label string, zar float64) {
	if label == "" {
		label = "Other"
	}
	r, ok := rows[label]
	if !ok {
		r = &models.ShareRow{Label: label}
		rows[label] = r
	}
	r.ValueZar += zar
	r.Count++
}

func sortedShares(rows map[string]*models.ShareRow, total float64, limit int) []models.ShareRow {
	out := make([]models.ShareRow, 0, len(rows))
	for _, r := range rows {
		if total > 0 {
			r.Pct = r.ValueZar / total * 100
		}
		out = append(out, *r)
	}
	sort.Slice(out, func(a, b int) bool {
		if out[a].ValueZar == out[b].ValueZar {
			return out[a].Label < out[b].Label
		}
		return out[a].ValueZar > out[b].ValueZar
	})
	if limit > 0 && len(out) > limit {
		out = out[:limit]
	}
	return out
}

// attentionList builds Home's "needs you" list, most urgent first. Each row
// links to the screen where the merchant resolves it.
func attentionList(s *MerchantStoreState, m models.Metrics) []models.AttentionItem {
	var items []models.AttentionItem
	for _, t := range s.ChatThreads {
		if t.UnreadCount > 0 {
			items = append(items, models.AttentionItem{Kind: "message", Tone: "warn",
				Title:  fmt.Sprintf("%s is waiting for a reply", t.BuyerName),
				Detail: fmt.Sprintf("%s · %s", t.BuyerCompany, t.LastMessage),
				Href:   "/chat/thread/" + t.ID, Action: "Reply"})
		}
	}
	for _, o := range s.Orders {
		if strings.EqualFold(o.Status, "issued") {
			items = append(items, models.AttentionItem{Kind: "order", Tone: "warn",
				Title:  fmt.Sprintf("Check payment for %s", o.OrderNumber),
				Detail: fmt.Sprintf("%s · %s by %s", o.Company, zar(o.GrandTotal), o.PaymentMethod),
				Href:   "/tab/orders?status=awaiting_payment", Action: "Check"})
		} else if !orderIsClosed(o.Status) {
			items = append(items, models.AttentionItem{Kind: "order", Tone: "info",
				Title:  fmt.Sprintf("Pack and dispatch %s", o.OrderNumber),
				Detail: fmt.Sprintf("%s · %d lines", o.Company, len(o.LineItems)),
				Href:   "/tab/pick-pack", Action: "Pack"})
		}
	}
	for _, l := range s.Leads {
		if l.Status == "new" {
			items = append(items, models.AttentionItem{Kind: "quote", Tone: "warn",
				Title:  fmt.Sprintf("Quote %d × %s", l.Quantity, l.ItemRequested),
				Detail: fmt.Sprintf("%s, %s · about %s", l.BuyerName, l.BuyerCity, zar(l.EstimatedTotal)),
				Href:   "/tab/rfqs", Action: "Quote"})
		}
	}
	for _, a := range m.LowStock {
		tone, title := "warn", fmt.Sprintf("%s is running low", a.Title)
		if a.Quantity <= 0 {
			tone, title = "danger", fmt.Sprintf("%s is out of stock", a.Title)
		}
		items = append(items, models.AttentionItem{Kind: "stock", Tone: tone, Title: title,
			Detail: fmt.Sprintf("%s · %d left, reorder level %d", a.SKU, a.Quantity, a.Threshold),
			Href:   "/tab/inventory?stock=low", Action: "Restock"})
	}
	for _, r := range s.ReturnRequests {
		if r.Status == "Requested" || r.Status == "Authorized" {
			items = append(items, models.AttentionItem{Kind: "order", Tone: "info",
				Title:  fmt.Sprintf("Return %s is %s", r.RMANumber, strings.ToLower(r.Status)),
				Detail: fmt.Sprintf("%s · %d × %s", r.CustomerName, r.Quantity, r.SKU),
				Href:   "/tab/orders?view=returns", Action: "Review"})
		}
	}
	if m.FeedIssues > 0 {
		items = append(items, models.AttentionItem{Kind: "feed", Tone: "info",
			Title:  fmt.Sprintf("%d %s can't list everywhere yet", m.FeedIssues, plural(m.FeedIssues, "product", "products")),
			Detail: "Fix missing photos or barcodes to reach Google and Meta shoppers.",
			Href:   "/tab/feeds", Action: "Fix"})
	}
	rank := map[string]int{"danger": 0, "warn": 1, "info": 2}
	sort.SliceStable(items, func(a, b int) bool { return rank[items[a].Tone] < rank[items[b].Tone] })
	return items
}

// setupSteps is the onboarding checklist, each step computed from real state.
func setupSteps(s *MerchantStoreState, m models.Metrics) []models.SetupStep {
	st := s.Store
	return []models.SetupStep{
		{Title: "Add your business details", Detail: "Name, address and contact number buyers will see.",
			Href: "/tab/settings", Done: st.Name != "" && st.Address != "" && st.Phone != ""},
		{Title: "Add 10 products", Detail: fmt.Sprintf("%d of 10 added. Importing a spreadsheet is fastest.", min(m.Products, 10)),
			Href: "/tab/catalog", Done: m.Products >= 10},
		{Title: "Add payout bank details", Detail: "So buyers can pay by EFT and you get paid.",
			Href: "/tab/settings", Done: st.BankAccount != "" && st.BankBranchCode != ""},
		{Title: "Connect WhatsApp", Detail: "Answer buyers and share your catalogue where they already are.",
			Href: "/tab/channels", Done: st.WhatsApp != ""},
		{Title: "Make your first sale", Detail: "Send a quote or ring up a counter sale.",
			Href: "/tab/pos", Done: m.MonthOrders > 0},
	}
}

func plural(n int, one, many string) string {
	if n == 1 {
		return one
	}
	return many
}

// zar formats rand amounts for handler-built strings.
func zar(v float64) string { return models.FormatZAR(v) }
