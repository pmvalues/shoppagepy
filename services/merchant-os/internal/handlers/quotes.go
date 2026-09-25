package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/shoppage/merchant-os/internal/models"
)

// tierDiscount returns the volume discount for a quantity from the
// merchant's own wholesale tiers.
func tierDiscount(tiers []models.WholesaleTier, qty int) (float64, string) {
	best, name := 0.0, ""
	for _, t := range tiers {
		if qty >= t.MinUnits && (t.MaxUnits == 0 || qty <= t.MaxUnits) && t.DiscountPct > best {
			best, name = t.DiscountPct, t.TierName
		}
	}
	return best, name
}

// matchLeadSKU finds the catalogue product an enquiry refers to.
func matchLeadSKU(catalog []models.CatalogSKU, l models.RFQLead) int {
	if l.SKU != "" {
		if i := catalogIndexBySKU(catalog, l.SKU); i >= 0 {
			return i
		}
	}
	want := strings.ToLower(l.ItemRequested)
	for i, p := range catalog {
		if strings.Contains(strings.ToLower(p.Title), want) || strings.Contains(want, strings.ToLower(p.Title)) {
			return i
		}
	}
	return -1
}

// SendQuote records the quote terms on an enquiry. The unit price is the
// merchant's price less their volume tier (or an explicit override).
func (h *Handler) SendQuote(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_ = r.ParseForm()
	now := time.Now().UTC()
	qty, _ := strconv.Atoi(r.FormValue("quantity"))
	unit, _ := strconv.ParseFloat(r.FormValue("unitPrice"), 64)
	delivery, _ := strconv.ParseFloat(r.FormValue("delivery"), 64)
	days, _ := strconv.Atoi(r.FormValue("validDays"))
	if days <= 0 {
		days = 7
	}

	h.state.mu.Lock()
	var msg string
	for i := range h.state.Leads {
		l := &h.state.Leads[i]
		if l.ID != id {
			continue
		}
		j := h.state.catalogIndexByID(r.FormValue("skuId"))
		if j < 0 || qty <= 0 || unit <= 0 {
			msg = "Choose the product, a quantity and a unit price."
			break
		}
		p := h.state.Catalog[j]
		l.SKU, l.ItemRequested, l.Quantity = p.SKU, p.Title, qty
		l.QuotedUnitZar, l.DeliveryZar = round2(unit), round2(delivery)
		l.EstimatedTotal = round2((float64(qty)*l.QuotedUnitZar + l.DeliveryZar) * 1.15)
		l.QuotedAt, l.ValidUntil = now, now.AddDate(0, 0, days)
		l.Status = "quoted"
		h.state.audit(h.actor(r), "Quote sent", "RFQLead", l.ID,
			fmt.Sprintf("%s: %d × %s at %s, delivery %s, total %s incl. VAT, valid %d days", l.BuyerCompany, qty, p.SKU, zar(unit), zar(delivery), zar(l.EstimatedTotal), days), now)
		msg = fmt.Sprintf("Quote recorded for %s: %s incl. VAT, valid until %s.", l.BuyerName, zar(l.EstimatedTotal), l.ValidUntil.In(sast).Format("2 Jan"))
		break
	}
	h.state.mu.Unlock()
	setToast(w, msg, "")
	h.renderTab(w, r, "rfqs")
}

// ConvertRFQ turns an accepted quote into an order at the quoted price.
func (h *Handler) ConvertRFQ(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	now := time.Now().UTC()
	var msg string

	h.state.mu.Lock()
	for i := range h.state.Leads {
		l := &h.state.Leads[i]
		if l.ID != id || l.Status == "accepted" {
			continue
		}
		j := matchLeadSKU(h.state.Catalog, *l)
		if j < 0 {
			msg = "Send a quote for a catalogue product first, so the order has a price."
			break
		}
		p := h.state.Catalog[j]
		unit := l.QuotedUnitZar
		if unit <= 0 {
			d, _ := tierDiscount(h.state.WholesaleTiers, l.Quantity)
			unit = round2(p.WholesaleZar * (1 - d/100))
		}
		sub := round2(float64(l.Quantity)*unit + l.DeliveryZar)
		vat := round2(sub * 0.15)
		num := nextOrderNumber(h.state.Orders)
		lines := []models.ProformaLineItem{{SKU: p.SKU, Title: p.Title, Quantity: l.Quantity, UnitPriceZar: unit, TotalZar: round2(float64(l.Quantity) * unit)}}
		if l.DeliveryZar > 0 {
			lines = append(lines, models.ProformaLineItem{SKU: "DELIVERY", Title: "Delivery", Quantity: 1, UnitPriceZar: l.DeliveryZar, TotalZar: l.DeliveryZar})
		}
		h.state.Orders = append([]models.ProformaOrder{{
			ID: fmt.Sprintf("ord_%d", now.UnixNano()), OrderNumber: num, Customer: l.BuyerName, Company: l.BuyerCompany,
			Phone: l.BuyerPhone, Address: l.BuyerCity, SubtotalZar: sub, VatZar: vat, GrandTotal: round2(sub + vat),
			PaymentMethod: "Bank EFT", BankingRef: strings.TrimPrefix(num, "#"), Status: "issued", Date: now, DueDate: now.Add(72 * time.Hour),
			LineItems: lines,
		}}, h.state.Orders...)
		l.Status = "accepted"
		h.state.audit(h.actor(r), "Quote converted to order", "RFQLead", l.ID, fmt.Sprintf("%s → %s (%s)", l.BuyerCompany, num, zar(sub+vat)), now)
		msg = fmt.Sprintf("%s created from the quote. It's awaiting payment.", num)
		break
	}
	h.state.mu.Unlock()
	setToast(w, msg, "")
	h.renderTab(w, r, "rfqs")
}
