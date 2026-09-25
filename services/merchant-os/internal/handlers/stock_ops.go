package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/shoppage/merchant-os/internal/models"
	"github.com/shoppage/merchant-os/internal/templates"
)

// Stock-changing actions. Each one changes per-warehouse stock through the
// helpers in stock.go, writes one ledger entry with the real remaining
// quantity, and one audit entry naming the signed-in user.

// postLedger records a stock movement. Callers hold the write lock and pass
// the catalogue index after the stock change has been applied.
func (s *MerchantStoreState) postLedger(i int, entryType, doc, desc, hubID string, qty int, now time.Time) {
	p := s.Catalog[i]
	next := 4000
	for _, e := range s.ItemLedger {
		if e.EntryNumber >= next {
			next = e.EntryNumber + 1
		}
	}
	s.ItemLedger = append([]models.ItemLedgerEntry{{
		ID:           fmt.Sprintf("ile_%d", now.UnixNano()),
		EntryNumber:  next,
		PostingDate:  now,
		EntryType:    entryType,
		DocumentNo:   doc,
		SKU:          p.SKU,
		Description:  desc,
		Location:     s.hubName(hubID),
		Quantity:     qty,
		RemainingQty: p.StockQuantity,
		CostAmount:   float64(qty) * p.WholesaleZar,
	}}, s.ItemLedger...)
}

func (s *MerchantStoreState) hubName(id string) string {
	for _, h := range s.Warehouses {
		if h.ID == id {
			return h.Name
		}
	}
	return id
}

func (s *MerchantStoreState) audit(actor, action, entity, entityID, details string, now time.Time) {
	s.AuditLogs = append([]models.AuditLogEntry{{
		ID: fmt.Sprintf("log_%d", now.UnixNano()), Actor: actor, Action: action,
		Entity: entity, EntityID: entityID, Details: details, Timestamp: now,
	}}, s.AuditLogs...)
}

// ServeProductDetail renders a product page. Accepts the internal ID or the
// SKU code in any case (/catalog/MIT-3361 and /catalog/mit_3361).
func (h *Handler) ServeProductDetail(w http.ResponseWriter, r *http.Request) {
	h.serveProduct(w, r, false)
}

// ServeProductEdit renders the product editor.
func (h *Handler) ServeProductEdit(w http.ResponseWriter, r *http.Request) {
	h.serveProduct(w, r, true)
}

func (h *Handler) serveProduct(w http.ResponseWriter, r *http.Request, edit bool) {
	ref := chi.URLParam(r, "id")
	data := h.getViewDataFor("catalog", r)
	h.state.mu.RLock()
	i := h.state.catalogIndexByID(ref)
	var target models.CatalogSKU
	if i >= 0 {
		target = h.state.Catalog[i]
	}
	h.state.mu.RUnlock()

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if i < 0 {
		w.WriteHeader(http.StatusNotFound)
		_ = templates.RenderNotFound(w, data, "Product not found",
			fmt.Sprintf("No product has the code or ID \"%s\". It may have been deleted, or the link is mistyped.", ref),
			"/tab/catalog", "Back to products", r.Header.Get("HX-Request") == "true")
		return
	}
	data.ActiveSKU = &target
	hx := r.Header.Get("HX-Request") == "true"
	switch {
	case edit && hx:
		_ = templates.RenderProductEditViewData(w, data, target, false)
	case edit:
		_ = templates.RenderProductEditPageData(w, data, target, false)
	case hx:
		_ = templates.RenderProductDetailViewData(w, data, target)
	default:
		_ = templates.RenderProductDetailPageData(w, data, target)
	}
}

// ServeNotFound renders the workspace 404 page for unknown routes.
func (h *Handler) ServeNotFound(w http.ResponseWriter, r *http.Request) {
	data := h.getViewDataFor("", r)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusNotFound)
	_ = templates.RenderNotFound(w, data, "Page not found",
		"This page doesn't exist. Check the address, or head back to Home.", "/desk", "Go to Home",
		r.Header.Get("HX-Request") == "true")
}

// ToggleStock marks a product available or unavailable. Marking an empty
// product available no longer invents stock: it stays at zero and the
// merchant is told to record a delivery.
func (h *Handler) ToggleStock(w http.ResponseWriter, r *http.Request) {
	ref := chi.URLParam(r, "id")
	now := time.Now().UTC()
	h.state.mu.Lock()
	i := h.state.catalogIndexByID(ref)
	var updated models.CatalogSKU
	if i >= 0 {
		p := &h.state.Catalog[i]
		if p.StockQuantity > 0 {
			p.InStock = !p.InStock
		} else {
			p.InStock = false
		}
		state := "unavailable"
		if p.InStock {
			state = "available"
		}
		h.state.audit(h.actor(r), "Availability changed", "CatalogSKU", p.SKU, "Marked "+state, now)
		updated = *p
	}
	h.state.mu.Unlock()
	if i < 0 {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}
	if updated.StockQuantity == 0 {
		setToast(w, "No stock on hand. Record a delivery in Stock to make it available.", "")
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.RenderStockButton(w, updated)
}

// UpdatePrice changes a product's selling price. The change is audited
// (before → after) and can be undone from the confirmation toast.
func (h *Handler) UpdatePrice(w http.ResponseWriter, r *http.Request) {
	ref := chi.URLParam(r, "id")
	newPrice, err := strconv.ParseFloat(strings.TrimSpace(r.FormValue("price")), 64)
	if err != nil || newPrice < 0 {
		http.Error(w, "Enter a price of R 0.00 or more.", http.StatusBadRequest)
		return
	}
	newPrice = round2(newPrice)
	now := time.Now().UTC()

	h.state.mu.Lock()
	i := h.state.catalogIndexByID(ref)
	if i < 0 {
		h.state.mu.Unlock()
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}
	p := &h.state.Catalog[i]
	old := p.WholesaleZar
	if old == newPrice {
		h.state.mu.Unlock()
		w.WriteHeader(http.StatusNoContent)
		return
	}
	p.WholesaleZar = newPrice
	h.state.audit(h.actor(r), "Price updated", "CatalogSKU", p.SKU, fmt.Sprintf("%s → %s", zar(old), zar(newPrice)), now)
	undoID := h.pushUndo(models.UndoEntry{Kind: "price", TargetID: p.ID, Label: p.SKU, OldValue: old, NewValue: newPrice}, now)
	title := p.Title
	h.state.mu.Unlock()

	setToast(w, fmt.Sprintf("%s: price changed from %s to %s.", title, zar(old), zar(newPrice)), undoID)
	w.WriteHeader(http.StatusOK)
}

// AdjustInventory applies a quick +/- adjustment at a warehouse.
func (h *Handler) AdjustInventory(w http.ResponseWriter, r *http.Request) {
	ref := chi.URLParam(r, "id")
	adj, _ := strconv.Atoi(r.FormValue("adjustment"))
	now := time.Now().UTC()

	h.state.mu.Lock()
	if i := h.state.catalogIndexByID(ref); i >= 0 && adj != 0 {
		hub := h.state.hubIDFor(r.FormValue("hub"))
		applied := h.state.adjustHubStock(i, hub, adj)
		entry := "Positive Adjmt."
		if applied < 0 {
			entry = "Negative Adjmt."
		}
		reason := strings.TrimSpace(r.FormValue("reason"))
		if reason == "" {
			reason = "Quick adjustment"
		}
		h.state.postLedger(i, entry, fmt.Sprintf("ADJ-%d", now.Unix()%100000), reason, hub, applied, now)
		h.state.audit(h.actor(r), "Stock adjusted", "CatalogSKU", h.state.Catalog[i].SKU,
			fmt.Sprintf("%+d at %s (%s). Now %d on hand.", applied, h.state.hubName(hub), reason, h.state.Catalog[i].StockQuantity), now)
	}
	h.state.mu.Unlock()
	h.renderTab(w, r, "inventory")
}

// AdjustInventoryIntake posts a delivery, return or write-off with a reason.
func (h *Handler) AdjustInventoryIntake(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	ref := r.FormValue("skuId")
	reason := strings.TrimSpace(r.FormValue("reason"))
	if reason == "" {
		reason = "Delivery received"
	}
	bin := strings.TrimSpace(r.FormValue("bin"))
	qty, _ := strconv.Atoi(r.FormValue("quantity"))
	now := time.Now().UTC()
	batchRef := strings.TrimSpace(r.FormValue("batchRef"))
	if batchRef == "" {
		batchRef = fmt.Sprintf("GRN-%d", now.Unix()%100000)
	}

	h.state.mu.Lock()
	if i := h.state.catalogIndexByID(ref); i >= 0 && qty != 0 {
		hub := h.state.hubIDFor(r.FormValue("hubName"))
		applied := h.state.adjustHubStock(i, hub, qty)
		entry := "Purchase Receipt"
		switch {
		case applied < 0:
			entry = "Negative Adjmt."
		case reason == "Sales Return":
			entry = "Positive Adjmt."
		}
		desc := reason
		if bin != "" {
			desc += ", bin " + bin
		}
		h.state.postLedger(i, entry, batchRef, desc, hub, applied, now)
		h.state.audit(h.actor(r), "Stock movement posted", "CatalogSKU", h.state.Catalog[i].SKU,
			fmt.Sprintf("%+d units at %s (%s, ref %s)", applied, h.state.hubName(hub), reason, batchRef), now)
		setToast(w, fmt.Sprintf("%s: %+d units at %s. %d on hand.", h.state.Catalog[i].SKU, applied, h.state.hubName(hub), h.state.Catalog[i].StockQuantity), "")
	}
	h.state.mu.Unlock()
	h.renderTab(w, r, "inventory")
}

// ReconcileScan records a physical count at one warehouse. The count replaces
// that warehouse's quantity; the variance is posted to the ledger.
func (h *Handler) ReconcileScan(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	ref := r.FormValue("skuId")
	counted, err := strconv.Atoi(r.FormValue("physicalCount"))
	now := time.Now().UTC()

	h.state.mu.Lock()
	if i := h.state.catalogIndexByID(ref); i >= 0 && err == nil && counted >= 0 {
		hub := h.state.hubIDFor(r.FormValue("hub"))
		before := h.state.Catalog[i].StockByHub[hub]
		delta := h.state.adjustHubStock(i, hub, counted-before)
		entry := "Positive Adjmt."
		if delta < 0 {
			entry = "Negative Adjmt."
		}
		desc := fmt.Sprintf("Count at %s: %d counted, %d on record (%+d)", h.state.hubName(hub), counted, before, delta)
		h.state.postLedger(i, entry, fmt.Sprintf("COUNT-%d", now.Unix()%100000), desc, hub, delta, now)
		h.state.audit(h.actor(r), "Stock count recorded", "CatalogSKU", h.state.Catalog[i].SKU, desc, now)
		setToast(w, desc+".", "")
	}
	h.state.mu.Unlock()
	h.renderTab(w, r, "scan")
}

// CreateTransfer books stock to move between warehouses. Units stay counted
// at the source until the transfer is received.
func (h *Handler) CreateTransfer(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	qty, _ := strconv.Atoi(r.FormValue("quantity"))
	carrier := strings.TrimSpace(r.FormValue("carrier"))
	if carrier == "" {
		carrier = "Own vehicle"
	}
	now := time.Now().UTC()

	h.state.mu.Lock()
	i := h.state.catalogIndexByID(r.FormValue("skuId"))
	src := h.state.hubIDFor(r.FormValue("sourceHub"))
	dst := h.state.hubIDFor(r.FormValue("destHub"))
	var problem string
	switch {
	case i < 0:
		problem = "Choose a product to transfer."
	case qty <= 0:
		problem = "Enter how many units to send."
	case src == dst:
		problem = "Choose two different warehouses."
	case h.state.Catalog[i].StockByHub[src] < qty:
		problem = fmt.Sprintf("%s only has %d units at %s.", h.state.Catalog[i].SKU, h.state.Catalog[i].StockByHub[src], h.state.hubName(src))
	}
	if problem == "" {
		p := h.state.Catalog[i]
		ref := fmt.Sprintf("TR-%d", 8800+len(h.state.Transfers)+1)
		h.state.Transfers = append([]models.StockTransfer{{
			ID: fmt.Sprintf("tr_%d", now.UnixNano()), TransferRef: ref,
			SourceHub: h.state.hubName(src), DestHub: h.state.hubName(dst),
			SKU: p.SKU, ItemTitle: p.Title, Quantity: qty, Status: "In-Transit", Carrier: carrier,
			DispatchedAt: now, ExpectedAt: now.Add(36 * time.Hour),
		}}, h.state.Transfers...)
		h.state.audit(h.actor(r), "Transfer dispatched", "StockTransfer", ref,
			fmt.Sprintf("%d × %s from %s to %s via %s", qty, p.SKU, h.state.hubName(src), h.state.hubName(dst), carrier), now)
		setToast(w, fmt.Sprintf("%s booked: %d × %s to %s.", ref, qty, p.SKU, h.state.hubName(dst)), "")
	}
	h.state.mu.Unlock()
	if problem != "" {
		setToast(w, problem, "")
	}
	h.renderTab(w, r, "transfers")
}

// ReceiveTransfer moves the units from source to destination warehouse.
func (h *Handler) ReceiveTransfer(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	now := time.Now().UTC()

	h.state.mu.Lock()
	for t := range h.state.Transfers {
		tr := &h.state.Transfers[t]
		if tr.ID != id || tr.Status == "Received" {
			continue
		}
		tr.Status = "Received"
		if i := catalogIndexBySKU(h.state.Catalog, tr.SKU); i >= 0 {
			src, dst := h.state.hubIDFor(tr.SourceHub), h.state.hubIDFor(tr.DestHub)
			h.state.moveStock(i, src, dst, tr.Quantity)
			h.state.postLedger(i, "Transfer Receipt", tr.TransferRef,
				fmt.Sprintf("Received at %s from %s", tr.DestHub, tr.SourceHub), dst, tr.Quantity, now)
		}
		h.state.audit(h.actor(r), "Transfer received", "StockTransfer", tr.TransferRef,
			fmt.Sprintf("%d × %s received at %s", tr.Quantity, tr.SKU, tr.DestHub), now)
		break
	}
	h.state.mu.Unlock()
	h.renderTab(w, r, "transfers")
}

// POSCheckout records a counter sale from the posted cart
// ("SKU:qty,SKU:qty"), charging catalogue prices plus 15% VAT, less any
// discount, and taking the units out of stock.
func (h *Handler) POSCheckout(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	customer := strings.TrimSpace(r.FormValue("customer"))
	if customer == "" {
		customer = "Walk-in customer"
	}
	method := strings.TrimSpace(r.FormValue("paymentMethod"))
	if method == "" {
		method = "Cash"
	}
	discountPct, _ := strconv.ParseFloat(r.FormValue("discountPct"), 64)
	if discountPct < 0 || discountPct > 100 {
		discountPct = 0
	}
	now := time.Now().UTC()

	type want struct {
		idx int
		qty int
	}
	clientRef := strings.TrimSpace(r.FormValue("clientRef"))
	h.state.mu.Lock()
	if clientRef != "" {
		for _, t := range h.state.RecentPOSTxns {
			if t.ClientRef == clientRef {
				h.state.mu.Unlock()
				setToast(w, "Sale "+t.ReceiptNumber+" was already recorded.", "")
				h.renderTab(w, r, "pos")
				return
			}
		}
	}
	var cart []want
	var problem string
	for _, part := range strings.Split(r.FormValue("cart"), ",") {
		sku, qtyStr, ok := strings.Cut(strings.TrimSpace(part), ":")
		if !ok {
			continue
		}
		qty, _ := strconv.Atoi(qtyStr)
		i := catalogIndexBySKU(h.state.Catalog, sku)
		if i < 0 || qty <= 0 {
			continue
		}
		if h.state.Catalog[i].StockQuantity < qty {
			problem = fmt.Sprintf("Only %d × %s in stock.", h.state.Catalog[i].StockQuantity, h.state.Catalog[i].SKU)
			break
		}
		cart = append(cart, want{i, qty})
	}
	if problem == "" && len(cart) == 0 {
		problem = "The cart is empty. Tap products to add them."
	}
	if problem != "" {
		h.state.mu.Unlock()
		setToast(w, problem, "")
		h.renderTab(w, r, "pos")
		return
	}

	receipt := fmt.Sprintf("POS-%s-%04d", now.In(sast).Format("2006"), len(h.state.RecentPOSTxns)+1)
	txn := models.POSTransaction{ID: fmt.Sprintf("pos_%d", now.UnixNano()), ReceiptNumber: receipt,
		Customer: customer, PaymentMethod: method, Timestamp: now, ClientRef: clientRef}
	subtotal := 0.0
	for _, c := range cart {
		p := h.state.Catalog[c.idx]
		line := round2(float64(c.qty) * p.WholesaleZar)
		txn.Items = append(txn.Items, models.POSItem{SKU: p.SKU, Title: p.Title, PriceZar: p.WholesaleZar, Quantity: c.qty, TotalZar: line})
		subtotal += line
		h.state.removeStock(c.idx, c.qty)
		h.state.postLedger(c.idx, "Sale Shipment", receipt, "Counter sale to "+customer, h.state.primaryHubID(), -c.qty, now)
	}
	subtotal = round2(subtotal * (1 - discountPct/100))
	txn.TotalZar = round2(subtotal * 1.15)
	h.state.RecentPOSTxns = append([]models.POSTransaction{txn}, h.state.RecentPOSTxns...)
	h.state.Store.GrossRevenueZar += txn.TotalZar
	h.state.audit(h.actor(r), "Counter sale", "POSTransaction", receipt,
		fmt.Sprintf("%s paid by %s (%d %s)", zar(txn.TotalZar), method, len(txn.Items), plural(len(txn.Items), "line", "lines")), now)
	h.state.mu.Unlock()

	setToast(w, fmt.Sprintf("Sale %s recorded: %s by %s.", receipt, zar(txn.TotalZar), method), "")
	h.renderTab(w, r, "pos")
}
