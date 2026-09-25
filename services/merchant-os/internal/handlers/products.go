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

func splitTags(raw string) []string {
	var out []string
	for _, p := range strings.Split(raw, ",") {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}

// suggestSKU proposes the next free code in the store's own pattern.
func suggestSKU(s *MerchantStoreState) string {
	prefix, max := templates.EntityCode(s.Store.LegalName), 0
	if len(prefix) > 3 {
		prefix = prefix[:3]
	}
	for _, p := range s.Catalog {
		if i := strings.LastIndex(p.SKU, "-"); i > 0 {
			if n, err := strconv.Atoi(p.SKU[i+1:]); err == nil && n > max {
				max = n
				prefix = p.SKU[:i]
			}
		}
	}
	return fmt.Sprintf("%s-%04d", prefix, max+1)
}

// ServeProductNew opens a blank product. Nothing is pre-filled except a
// suggested SKU: no invented barcode, description or compliance claims.
func (h *Handler) ServeProductNew(w http.ResponseWriter, r *http.Request) {
	data := h.getViewDataFor("catalog", r)
	h.state.mu.RLock()
	p := models.CatalogSKU{ID: "new", StoreID: h.state.Store.ID, SKU: suggestSKU(h.state), Brand: h.state.Store.Name, FeedStatus: "Active"}
	h.state.mu.RUnlock()
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if r.Header.Get("HX-Request") == "true" {
		_ = templates.RenderProductEditViewData(w, data, p, true)
		return
	}
	_ = templates.RenderProductEditPageData(w, data, p, true)
}

// applyProductForm copies the editable fields from the form.
func applyProductForm(p *models.CatalogSKU, r *http.Request) {
	str := func(k string) string { return strings.TrimSpace(r.FormValue(k)) }
	p.Title, p.SKU, p.Brand, p.Category = str("title"), str("sku"), str("brand"), str("category")
	p.Spec.LongDesc, p.Spec.Barcode = str("description"), strings.ReplaceAll(str("barcode"), " ", "")
	p.Spec.HSCode, p.Spec.Material, p.Spec.Dimensions = str("hsCode"), str("material"), str("dimensions")
	p.Spec.SEOTags = splitTags(r.FormValue("tags"))
	if v, err := strconv.ParseFloat(str("wholesaleZar"), 64); err == nil && v >= 0 {
		p.WholesaleZar = round2(v)
	}
	if v, err := strconv.ParseFloat(str("retailZar"), 64); err == nil && v >= 0 {
		p.RetailZar = round2(v)
	} else if str("retailZar") == "" {
		p.RetailZar = 0
	}
	if v, err := strconv.Atoi(str("lowStockAlert")); err == nil && v >= 0 {
		p.LowStockAlert = v
	}
	if v, err := strconv.ParseFloat(str("weightKg"), 64); err == nil && v >= 0 {
		p.Spec.WeightKg = v
	}
}

func (h *Handler) showProduct(w http.ResponseWriter, r *http.Request, id string) {
	w.Header().Set("HX-Push-Url", "/catalog/"+id)
	data := h.getViewDataFor("catalog", r)
	h.state.mu.RLock()
	i := h.state.catalogIndexByID(id)
	var p models.CatalogSKU
	if i >= 0 {
		p = h.state.Catalog[i]
	}
	h.state.mu.RUnlock()
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.RenderProductDetailViewData(w, data, p)
}

// SaveProductEdit saves the product. Stock isn't edited here: it changes only
// through stock movements so every unit stays accounted for.
func (h *Handler) SaveProductEdit(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_ = r.ParseForm()
	now := time.Now().UTC()
	h.state.mu.Lock()
	i := h.state.catalogIndexByID(id)
	if i < 0 {
		h.state.mu.Unlock()
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}
	p := &h.state.Catalog[i]
	if strings.TrimSpace(r.FormValue("title")) == "" || strings.TrimSpace(r.FormValue("sku")) == "" {
		h.state.mu.Unlock()
		http.Error(w, "A product needs a title and a SKU.", http.StatusBadRequest)
		return
	}
	oldPrice := p.WholesaleZar
	applyProductForm(p, r)
	p.Spec.Activities = append([]models.ProductActivity{{Icon: "edit", Description: "Details updated by " + h.actor(r), TimeAgo: now.In(sast).Format("2 Jan, 15:04")}}, p.Spec.Activities...)
	detail := "Details updated"
	if oldPrice != p.WholesaleZar {
		detail = fmt.Sprintf("Details updated; price %s → %s", zar(oldPrice), zar(p.WholesaleZar))
	}
	h.state.audit(h.actor(r), "Product updated", "CatalogSKU", p.SKU, detail, now)
	pid, title := p.ID, p.Title
	h.state.mu.Unlock()

	setToast(w, title+" saved.", "")
	h.showProduct(w, r, pid)
}

// CreateProduct adds a product with only the facts the merchant entered.
func (h *Handler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	now := time.Now().UTC()
	if strings.TrimSpace(r.FormValue("title")) == "" || strings.TrimSpace(r.FormValue("sku")) == "" {
		http.Error(w, "A product needs a title and a SKU.", http.StatusBadRequest)
		return
	}
	h.state.mu.Lock()
	if catalogIndexBySKU(h.state.Catalog, r.FormValue("sku")) >= 0 {
		h.state.mu.Unlock()
		http.Error(w, "Another product already uses that SKU.", http.StatusConflict)
		return
	}
	p := models.CatalogSKU{ID: fmt.Sprintf("sku_%d", now.UnixNano()), StoreID: h.state.Store.ID, FeedStatus: "Active", StockByHub: map[string]int{}}
	applyProductForm(&p, r)
	p.Spec.Activities = []models.ProductActivity{{Icon: "plus", Description: "Created by " + h.actor(r), TimeAgo: now.In(sast).Format("2 Jan, 15:04")}}
	h.state.Catalog = append([]models.CatalogSKU{p}, h.state.Catalog...)
	if qty, _ := strconv.Atoi(r.FormValue("stockQuantity")); qty > 0 {
		h.state.adjustHubStock(0, "", qty)
		h.state.postLedger(0, "Positive Adjmt.", "OPENING", "Opening stock", h.state.primaryHubID(), qty, now)
	} else {
		recountStock(&h.state.Catalog[0])
	}
	h.state.audit(h.actor(r), "Product created", "CatalogSKU", p.SKU, p.Title, now)
	h.state.mu.Unlock()

	setToast(w, p.Title+" added. Check the listing checklist to reach every channel.", "")
	h.showProduct(w, r, p.ID)
}
