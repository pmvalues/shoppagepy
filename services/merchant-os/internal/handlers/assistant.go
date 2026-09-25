package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
	"unicode/utf16"

	"github.com/go-chi/chi/v5"
	"github.com/shoppage/merchant-os/internal/models"
	"github.com/shoppage/merchant-os/internal/templates"
)

// The assistant follows the merchant-centre rules (docs/MERCHANT_CENTRE_SPEC.md
// §5.14): it proposes, the merchant approves, and every applied change can be
// undone. It never invents prices, stock or identifiers. No language model is
// connected, so answers are computed from store data and labelled that way.

// unitsSold returns units of a SKU sold in the last `days` days.
func unitsSold(s *MerchantStoreState, sku string, now time.Time, days int) int {
	since := now.AddDate(0, 0, -days)
	n := 0
	for _, o := range s.Orders {
		if !orderCountsAsSale(o.Status) || o.Date.Before(since) {
			continue
		}
		for _, ln := range o.LineItems {
			if equalFoldTrim(ln.SKU, sku) {
				n += ln.Quantity
			}
		}
	}
	for _, t := range s.RecentPOSTxns {
		if t.Timestamp.Before(since) {
			continue
		}
		for _, it := range t.Items {
			if equalFoldTrim(it.SKU, sku) {
				n += it.Quantity
			}
		}
	}
	return n
}

// buildProposals derives suggestions from current data. Callers hold the lock.
// Existing proposals keep their status; new ones are added as "pending".
func buildProposals(s *MerchantStoreState, now time.Time) []models.Proposal {
	existing := map[string]models.Proposal{}
	for _, p := range s.Proposals {
		existing[p.ID] = p
	}
	var out []models.Proposal
	add := func(p models.Proposal) {
		if old, ok := existing[p.ID]; ok {
			p.Status, p.CreatedAt = old.Status, old.CreatedAt
		} else {
			p.Status, p.CreatedAt = "pending", now
		}
		out = append(out, p)
	}

	for _, item := range s.Catalog {
		if item.LowStockAlert <= 0 || item.StockQuantity > item.LowStockAlert {
			continue
		}
		sold := unitsSold(s, item.SKU, now, 30)
		// Cover the next 30 days of demand plus the reorder buffer.
		qty := sold + item.LowStockAlert - item.StockQuantity
		if qty < item.LowStockAlert {
			qty = item.LowStockAlert
		}
		qty = roundUp(qty, 50)
		add(models.Proposal{
			ID:       "restock_" + item.ID,
			Kind:     "restock",
			Title:    fmt.Sprintf("Reorder %s", item.Title),
			Reason:   fmt.Sprintf("%s left, reorder level %s. You sold %s in the last 30 days.", models.FormatInt(item.StockQuantity), models.FormatInt(item.LowStockAlert), models.FormatInt(sold)+" "+plural(sold, "unit", "units")),
			Change:   fmt.Sprintf("Draft a purchase order for %s units (about %s at your current price). Nothing is sent to a supplier.", models.FormatInt(qty), zar(float64(qty)*item.WholesaleZar)),
			TargetID: item.ID,
			Quantity: qty,
		})
	}

	for _, l := range s.Leads {
		if l.Status != "quoted" {
			continue
		}
		age := now.Sub(l.ReceivedAt)
		if age < time.Hour {
			continue
		}
		add(models.Proposal{
			ID:       "follow_" + l.ID,
			Kind:     "follow_up",
			Title:    fmt.Sprintf("Follow up with %s", l.BuyerName),
			Reason:   fmt.Sprintf("You quoted %s × %s (%s) %s ago and haven't heard back.", models.FormatInt(l.Quantity), l.ItemRequested, zar(l.EstimatedTotal), humanDuration(age)),
			Change:   "Open WhatsApp with a short follow-up message ready to send. You review it before it goes.",
			TargetID: l.ID,
		})
	}

	readiness := computeReadiness(s)
	for _, item := range s.Catalog {
		r := readiness[item.ID]
		failed := r.FailedChecks()
		if len(failed) == 0 {
			continue
		}
		blocked := []string{}
		for _, ch := range models.ListingChannels {
			if !r.ReadyOn(ch) {
				blocked = append(blocked, ch)
			}
		}
		if len(blocked) == 0 {
			continue
		}
		add(models.Proposal{
			ID:       "listing_" + item.ID,
			Kind:     "listing",
			Title:    fmt.Sprintf("Fix the listing for %s", item.Title),
			Reason:   fmt.Sprintf("Not showing on %s. Listing score %d/100.", strings.Join(blocked, ", "), r.Score),
			Change:   failed[0].Fix,
			TargetID: item.ID,
		})
	}

	rank := map[string]int{"restock": 0, "follow_up": 1, "listing": 2}
	sort.SliceStable(out, func(a, b int) bool { return rank[out[a].Kind] < rank[out[b].Kind] })
	return out
}

func roundUp(n, step int) int {
	if n%step == 0 {
		return n
	}
	return (n/step + 1) * step
}

func humanDuration(d time.Duration) string {
	switch {
	case d < time.Hour:
		return fmt.Sprintf("%d minutes", int(d.Minutes()))
	case d < 48*time.Hour:
		h := int(d.Hours())
		return fmt.Sprintf("%d %s", h, plural(h, "hour", "hours"))
	default:
		days := int(d.Hours() / 24)
		return fmt.Sprintf("%d days", days)
	}
}

// followUpLink builds a wa.me link with a draft message for a quoted lead.
func followUpLink(l models.RFQLead, store models.StoreProfile) string {
	phone := strings.TrimPrefix(strings.ReplaceAll(l.BuyerPhone, " ", ""), "+")
	msg := fmt.Sprintf("Hi %s, just checking in on our quote for %d × %s (%s). Happy to answer any questions. %s",
		l.BuyerName, l.Quantity, l.ItemRequested, zar(l.EstimatedTotal), store.Name)
	return "https://wa.me/" + phone + "?text=" + url.QueryEscape(msg)
}

// answer computes a reply to a merchant question from store data. It
// recognises a handful of intents and says plainly when it can't help.
func answer(s *MerchantStoreState, m models.Metrics, prompt string) string {
	q := strings.ToLower(prompt)
	has := func(words ...string) bool {
		for _, w := range words {
			if strings.Contains(q, w) {
				return true
			}
		}
		return false
	}
	switch {
	case has("restock", "low stock", "running low", "reorder", "out of stock"):
		if len(m.LowStock) == 0 {
			return "Nothing is at or below its reorder level right now."
		}
		var parts []string
		for _, a := range m.LowStock {
			parts = append(parts, fmt.Sprintf("%s (%s): %s left, reorder level %s", a.Title, a.SKU, models.FormatInt(a.Quantity), models.FormatInt(a.Threshold)))
		}
		return fmt.Sprintf("%d %s need restocking: %s. Suggested reorder quantities are in the list on the right.", len(parts), plural(len(parts), "product", "products"), strings.Join(parts, "; "))
	case has("top", "best", "selling", "seller"):
		if len(m.TopProducts) == 0 {
			return "No sales recorded this month yet."
		}
		var parts []string
		for i, p := range m.TopProducts {
			parts = append(parts, fmt.Sprintf("%d. %s: %s", i+1, p.Label, zar(p.ValueZar)))
		}
		return "Top products this month by sales value: " + strings.Join(parts, "; ") + "."
	case has("sales", "revenue", "made", "turnover", "today", "month"):
		return fmt.Sprintf("Today: %s from %d %s. This month: %s from %d %s, average %s per sale. %s of your %s free allowance is used.",
			zar(m.TodaySalesZar), m.TodayOrders, plural(m.TodayOrders, "sale", "sales"),
			zar(m.MonthSalesZar), m.MonthOrders, plural(m.MonthOrders, "sale", "sales"), zar(m.AvgOrderValueZar),
			zar(m.AllowanceUsedZar), zar(m.Plan.FreeAllowanceZar))
	case has("payment", "unpaid", "awaiting", "owe", "eft"):
		var parts []string
		for _, o := range s.Orders {
			if strings.EqualFold(o.Status, "issued") {
				parts = append(parts, fmt.Sprintf("%s from %s (%s)", o.OrderNumber, o.Company, zar(o.GrandTotal)))
			}
		}
		if len(parts) == 0 {
			return "No orders are waiting for payment."
		}
		return "Waiting for payment: " + strings.Join(parts, "; ") + "."
	case has("quote", "rfq", "lead"):
		return fmt.Sprintf("%d open %s worth about %s. %d won so far out of %d received.", m.OpenQuotes, plural(m.OpenQuotes, "quote", "quotes"), zar(m.QuotePipelineZar), m.QuotesWon, m.QuotesTotal)
	case has("listing", "google", "feed", "barcode", "photo", "seo"):
		if m.FeedIssues == 0 {
			return "All products meet the listing rules for every channel."
		}
		return fmt.Sprintf("%d %s can't list on every channel yet. Open Marketing → Where you sell to see the exact fix for each one.", m.FeedIssues, plural(m.FeedIssues, "product", "products"))
	}
	return "I can answer questions about sales, top products, stock to reorder, unpaid orders, quotes and listings, using your store's own records. Try \"Which items need restocking?\""
}

// AskCopilot records a question and a data-derived answer.
func (h *Handler) AskCopilot(w http.ResponseWriter, r *http.Request) {
	prompt := strings.TrimSpace(r.FormValue("prompt"))
	if prompt == "" {
		prompt = "What can you help with?"
	}
	now := time.Now().UTC()

	h.state.mu.Lock()
	readiness := computeReadiness(h.state)
	m := computeMetrics(h.state, readiness, now)
	reply := answer(h.state, m, prompt)
	h.state.CopilotMessages = append(h.state.CopilotMessages,
		models.CopilotMessage{ID: fmt.Sprintf("msg_%d", now.UnixNano()), Role: "user", Content: prompt, Timestamp: now},
		models.CopilotMessage{ID: fmt.Sprintf("msg_%d", now.UnixNano()+1), Role: "assistant", Content: reply, Timestamp: now},
	)
	if n := len(h.state.CopilotMessages); n > 40 {
		h.state.CopilotMessages = h.state.CopilotMessages[n-40:]
	}
	h.state.mu.Unlock()

	h.renderTab(w, r, "copilot")
}

// ExecuteCopilotAction approves, dismisses or undoes a proposal. Nothing is
// applied without this explicit request from the merchant.
func (h *Handler) ExecuteCopilotAction(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	id := r.FormValue("proposal")
	op := r.FormValue("op")
	now := time.Now().UTC()
	actor := h.actor(r)

	h.state.mu.Lock()
	h.state.Proposals = buildProposals(h.state, now)
	idx := -1
	for i, p := range h.state.Proposals {
		if p.ID == id {
			idx = i
			break
		}
	}
	var toast string
	if idx >= 0 {
		p := &h.state.Proposals[idx]
		switch {
		case op == "approve" && (p.Status == "pending" || p.Status == "undone") && p.Kind == "restock":
			ref := fmt.Sprintf("PO-%s-%04d", now.In(sast).Format("0601"), now.UnixNano()%10000)
			p.Status = "applied"
			h.state.AuditLogs = append([]models.AuditLogEntry{{
				ID: fmt.Sprintf("log_%d", now.UnixNano()), Actor: actor, Action: "Purchase order drafted",
				Entity: "PurchaseOrder", EntityID: ref,
				Details: fmt.Sprintf("Draft %s for %s units of %s, approved from an assistant suggestion. Not sent to a supplier.", ref, models.FormatInt(p.Quantity), p.TargetID), Timestamp: now,
			}}, h.state.AuditLogs...)
			h.pushUndo(models.UndoEntry{Kind: "proposal", TargetID: p.ID, Label: "Draft " + ref + " created"}, now)
			toast = "Draft " + ref + " created. Nothing was sent to a supplier."
		case op == "dismiss" && p.Status == "pending":
			p.Status = "dismissed"
			toast = "Suggestion dismissed."
		case op == "undo" && p.Status == "applied":
			p.Status = "undone"
			h.state.AuditLogs = append([]models.AuditLogEntry{{
				ID: fmt.Sprintf("log_%d", now.UnixNano()), Actor: actor, Action: "Purchase order draft cancelled",
				Entity: "Proposal", EntityID: p.ID, Details: "Undone by the merchant.", Timestamp: now,
			}}, h.state.AuditLogs...)
			toast = "Undone."
		}
	}
	h.state.mu.Unlock()

	if toast != "" {
		setToast(w, toast, "")
	}
	h.renderTab(w, r, "copilot")
}

// pushUndo records a reversible change. Callers hold the write lock.
func (h *Handler) pushUndo(e models.UndoEntry, now time.Time) string {
	e.ID = fmt.Sprintf("undo_%d", now.UnixNano())
	e.At = now
	h.state.UndoLog = append([]models.UndoEntry{e}, h.state.UndoLog...)
	if len(h.state.UndoLog) > 50 {
		h.state.UndoLog = h.state.UndoLog[:50]
	}
	return e.ID
}

// Undo reverses a recorded change (price edits and applied proposals).
func (h *Handler) Undo(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	now := time.Now().UTC()
	actor := h.actor(r)
	msg := "That change can no longer be undone."

	h.state.mu.Lock()
	for i := range h.state.UndoLog {
		e := &h.state.UndoLog[i]
		if e.ID != id || e.Undone {
			continue
		}
		switch e.Kind {
		case "price":
			if j := h.state.catalogIndexByID(e.TargetID); j >= 0 {
				h.state.Catalog[j].WholesaleZar = e.OldValue
				h.state.AuditLogs = append([]models.AuditLogEntry{{
					ID: fmt.Sprintf("log_%d", now.UnixNano()), Actor: actor, Action: "Price change undone",
					Entity: "CatalogSKU", EntityID: h.state.Catalog[j].SKU,
					Details: fmt.Sprintf("%s → %s", zar(e.NewValue), zar(e.OldValue)), Timestamp: now,
				}}, h.state.AuditLogs...)
				e.Undone = true
				msg = fmt.Sprintf("Price restored to %s.", zar(e.OldValue))
			}
		case "proposal":
			for k := range h.state.Proposals {
				if h.state.Proposals[k].ID == e.TargetID && h.state.Proposals[k].Status == "applied" {
					h.state.Proposals[k].Status = "undone"
					e.Undone = true
					msg = "Draft purchase order cancelled."
				}
			}
		}
		break
	}
	h.state.mu.Unlock()

	setToast(w, msg, "")
	w.Header().Set("HX-Refresh", "true")
	w.WriteHeader(http.StatusOK)
}

// renderTab renders a workspace tab for HTMX swaps or as a full page.
func (h *Handler) renderTab(w http.ResponseWriter, r *http.Request, tab string) {
	data := h.getViewDataFor(tab, r)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if r.Header.Get("HX-Request") == "" {
		_ = templates.RenderDashboard(w, data)
		return
	}
	_ = templates.RenderTabPartial(w, tab, data)
}

// setToast asks the shell to show a confirmation, optionally with an Undo
// button that posts to /undo/{undoID}.
func setToast(w http.ResponseWriter, message, undoID string) {
	hxTrigger(w, map[string]any{"toast": map[string]string{"message": message, "undo": undoID}})
}

// hxTrigger sets the HX-Trigger header. Header values must be ASCII, so any
// other character is escaped as a JSON \uXXXX sequence (surrogate pairs above
// the Basic Multilingual Plane).
func hxTrigger(w http.ResponseWriter, events map[string]any) {
	b, _ := json.Marshal(events)
	var out strings.Builder
	for _, r := range string(b) {
		switch {
		case r < 0x80:
			out.WriteRune(r)
		case r > 0xFFFF:
			r1, r2 := utf16.EncodeRune(r)
			fmt.Fprintf(&out, `\u%04x\u%04x`, r1, r2)
		default:
			fmt.Fprintf(&out, `\u%04x`, r)
		}
	}
	w.Header().Set("HX-Trigger", out.String())
}
