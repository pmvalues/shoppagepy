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

// Order lifecycle: issued (awaiting payment) → confirmed (paid, to pack) →
// dispatched → delivered. Dispatch takes the units out of stock. Each step is
// written to the activity log with the signed-in user.

func nextOrderNumber(orders []models.ProformaOrder) string {
	max := 9800
	for _, o := range orders {
		n, err := strconv.Atoi(strings.TrimPrefix(o.OrderNumber, "#ORD-"))
		if err == nil && n > max {
			max = n
		}
	}
	return fmt.Sprintf("#ORD-%d", max+1)
}

// AdvanceOrderStatus moves an order to its next step.
func (h *Handler) AdvanceOrderStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	now := time.Now().UTC()
	var toast string

	h.state.mu.Lock()
	for i := range h.state.Orders {
		o := &h.state.Orders[i]
		if o.ID != id {
			continue
		}
		from := o.Status
		switch strings.ToLower(o.Status) {
		case "issued":
			o.Status = "confirmed"
			toast = fmt.Sprintf("%s marked paid. Ready to pack.", o.OrderNumber)
		case "confirmed", "paid", "packed":
			var short []string
			for _, ln := range o.LineItems {
				if j := catalogIndexBySKU(h.state.Catalog, ln.SKU); j >= 0 {
					if h.state.Catalog[j].StockQuantity < ln.Quantity {
						short = append(short, fmt.Sprintf("%s (%d on hand, %d ordered)", ln.SKU, h.state.Catalog[j].StockQuantity, ln.Quantity))
					}
				}
			}
			if len(short) > 0 {
				toast = "Not enough stock to dispatch: " + strings.Join(short, ", ") + "."
				break
			}
			for _, ln := range o.LineItems {
				if j := catalogIndexBySKU(h.state.Catalog, ln.SKU); j >= 0 {
					h.state.removeStock(j, ln.Quantity)
					h.state.postLedger(j, "Sale Shipment", strings.TrimPrefix(o.OrderNumber, "#"), "Dispatched to "+o.Company, h.state.primaryHubID(), -ln.Quantity, now)
				}
			}
			o.Status = "dispatched"
			toast = fmt.Sprintf("%s dispatched. Stock updated.", o.OrderNumber)
		case "dispatched":
			o.Status = "delivered"
			toast = fmt.Sprintf("%s marked delivered.", o.OrderNumber)
		}
		if o.Status != from {
			h.state.audit(h.actor(r), "Order status changed", "ProformaOrder", o.OrderNumber,
				fmt.Sprintf("%s → %s", orderStatusLabel(from), orderStatusLabel(o.Status)), now)
		}
		break
	}
	h.state.mu.Unlock()

	if toast != "" {
		setToast(w, toast, "")
	}
	h.renderTab(w, r, "orders")
}

// CreateOrder issues a new order (awaiting payment) at catalogue prices plus
// 15% VAT. Contact details are only what the merchant entered.
func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	qty, _ := strconv.Atoi(r.FormValue("quantity"))
	now := time.Now().UTC()

	h.state.mu.Lock()
	i := h.state.catalogIndexByID(r.FormValue("skuId"))
	company := strings.TrimSpace(r.FormValue("company"))
	if i < 0 || qty <= 0 || company == "" {
		h.state.mu.Unlock()
		setToast(w, "Choose a product, a quantity of at least 1, and the buyer's company.", "")
		h.renderTab(w, r, "orders")
		return
	}
	p := h.state.Catalog[i]
	subtotal := round2(p.WholesaleZar * float64(qty))
	vat := round2(subtotal * 0.15)
	num := nextOrderNumber(h.state.Orders)
	o := models.ProformaOrder{
		ID: fmt.Sprintf("ord_%d", now.UnixNano()), OrderNumber: num,
		Customer: strings.TrimSpace(r.FormValue("customer")), Company: company,
		Phone: strings.TrimSpace(r.FormValue("phone")), Email: strings.TrimSpace(r.FormValue("email")),
		Address:     strings.TrimSpace(r.FormValue("address")),
		SubtotalZar: subtotal, VatZar: vat, GrandTotal: round2(subtotal + vat),
		PaymentMethod: "Bank EFT", BankingRef: strings.TrimPrefix(num, "#"), Status: "issued",
		Date: now, DueDate: now.Add(72 * time.Hour),
		LineItems: []models.ProformaLineItem{{SKU: p.SKU, Title: p.Title, Quantity: qty, UnitPriceZar: p.WholesaleZar, TotalZar: subtotal}},
	}
	h.state.Orders = append([]models.ProformaOrder{o}, h.state.Orders...)
	h.state.audit(h.actor(r), "Order created", "ProformaOrder", num, fmt.Sprintf("%s: %d × %s, %s incl. VAT", company, qty, p.SKU, zar(o.GrandTotal)), now)
	h.state.mu.Unlock()

	setToast(w, fmt.Sprintf("%s created for %s (%s). Send the invoice so they can pay.", num, company, zar(o.GrandTotal)), "")
	h.renderTab(w, r, "orders")
}

// CreateRMARequest records an authorised return. No courier is booked, so
// the waybill stays empty until the merchant enters one.
func (h *Handler) CreateRMARequest(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	qty, _ := strconv.Atoi(r.FormValue("quantity"))
	if qty <= 0 {
		qty = 1
	}
	refund, _ := strconv.ParseFloat(r.FormValue("refundAmount"), 64)
	customer := strings.TrimSpace(r.FormValue("customer"))
	if customer == "" {
		customer = strings.TrimSpace(r.FormValue("customerName"))
	}
	sku := strings.TrimSpace(r.FormValue("sku"))
	now := time.Now().UTC()

	h.state.mu.Lock()
	title := sku
	if i := catalogIndexBySKU(h.state.Catalog, sku); i >= 0 {
		title = h.state.Catalog[i].Title
		if refund <= 0 {
			refund = round2(float64(qty) * h.state.Catalog[i].WholesaleZar * 1.15)
		}
	}
	num := fmt.Sprintf("RMA-%d-%04d", now.In(sast).Year(), len(h.state.ReturnRequests)+800)
	h.state.ReturnRequests = append([]models.ReturnRequest{{
		ID: fmt.Sprintf("rma_%d", now.UnixNano()), RMANumber: num, OrderNumber: strings.TrimSpace(r.FormValue("orderNumber")),
		CustomerName: customer, ItemTitle: title, SKU: sku, Quantity: qty, Reason: r.FormValue("reason"),
		Status: "Authorized", WaybillNo: strings.TrimSpace(r.FormValue("waybill")), RefundAmount: refund, CreatedAt: now,
	}}, h.state.ReturnRequests...)
	h.state.audit(h.actor(r), "Return authorised", "ReturnRequest", num, fmt.Sprintf("%s: %d × %s, refund %s", customer, qty, sku, zar(refund)), now)
	h.state.mu.Unlock()

	setToast(w, num+" authorised. Book the return courier and add the waybill when you have it.", "")
	showReturns(w, r)
	h.renderTab(w, r, "orders")
}

// UpdateRMAStatus moves a return forward. Receiving the goods puts the units
// back into stock at the main warehouse.
func (h *Handler) UpdateRMAStatus(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	id := r.FormValue("rmaId")
	status := r.FormValue("status")
	if status == "" {
		status = r.FormValue("newStatus")
	}
	now := time.Now().UTC()

	h.state.mu.Lock()
	for i := range h.state.ReturnRequests {
		rm := &h.state.ReturnRequests[i]
		if rm.ID != id && rm.RMANumber != id {
			continue
		}
		if status == "Goods Received" && rm.Status != "Goods Received" {
			if j := catalogIndexBySKU(h.state.Catalog, rm.SKU); j >= 0 {
				h.state.adjustHubStock(j, "", rm.Quantity)
				h.state.postLedger(j, "Positive Adjmt.", rm.RMANumber, "Customer return received", h.state.primaryHubID(), rm.Quantity, now)
			}
		}
		rm.Status = status
		h.state.audit(h.actor(r), "Return updated", "ReturnRequest", rm.RMANumber, fmt.Sprintf("%s → %s", rm.CustomerName, status), now)
		break
	}
	h.state.mu.Unlock()
	showReturns(w, r)
	h.renderTab(w, r, "orders")
}

// showReturns renders the Returns view after a return action.
func showReturns(w http.ResponseWriter, r *http.Request) {
	r.URL.RawQuery = "view=returns"
	w.Header().Set("HX-Push-Url", "/tab/orders?view=returns")
}
