package handlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/shoppage/merchant-os/internal/templates"
)

// Search powers the Ctrl+K palette: actions and pages, then products,
// orders and customers matching every word of the query.
func (h *Handler) Search(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	words := strings.Fields(strings.ToLower(q))
	match := func(fields ...string) bool {
		hay := strings.ToLower(strings.Join(fields, " "))
		for _, w := range words {
			if !strings.Contains(hay, w) {
				return false
			}
		}
		return true
	}

	var out []templates.OmniResult
	if len(words) == 0 {
		out = append(out, templates.OmniActions()...)
		out = append(out, templates.OmniPages()...)
	} else {
		for _, a := range templates.OmniActions() {
			if match(a.Label, a.Hint) {
				out = append(out, a)
			}
		}
		for _, p := range templates.OmniPages() {
			if match(p.Label, p.Hint) {
				out = append(out, p)
			}
		}
		h.state.mu.RLock()
		n := 0
		for _, p := range h.state.Catalog {
			if n < 8 && match(p.Title, p.SKU, p.Brand, p.Category, p.Spec.Barcode) {
				out = append(out, templates.OmniProduct(p))
				n++
			}
		}
		n = 0
		for _, o := range sortedOrders(h.state.Orders) {
			if n < 6 && match(o.OrderNumber, o.Company, o.Customer, o.Status) {
				out = append(out, templates.OmniResult{Group: "Orders", Label: o.OrderNumber + " · " + o.Company,
					Hint: zar(o.GrandTotal) + " · " + orderStatusLabel(o.Status), Href: "/tab/orders?q=" + strings.TrimPrefix(o.OrderNumber, "#"), HX: true})
				n++
			}
		}
		n = 0
		for _, c := range h.state.Customers {
			if n < 6 && match(c.Company, c.ContactName, c.Email, c.Phone, c.City) {
				out = append(out, templates.OmniResult{Group: "Customers", Label: c.Company, Hint: c.ContactName + " · " + c.City,
					Href: "/tab/customers?q=" + strings.ReplaceAll(c.Company, " ", "+"), HX: true})
				n++
			}
		}
		h.state.mu.RUnlock()
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.OmnibarResults(q, out).Render(context.Background(), w)
}

// orderStatusLabel is the merchant-facing name of an order status.
func orderStatusLabel(status string) string {
	return templates.OrderStatusLabel(status)
}
