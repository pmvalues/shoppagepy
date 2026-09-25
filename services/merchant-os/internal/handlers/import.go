package handlers

import (
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/shoppage/merchant-os/internal/models"
)

// Catalogue import: the fastest way to get a real catalogue live
// (docs/MERCHANT_CENTRE_SPEC.md §4). Columns are matched by name, loosely, so
// a spreadsheet exported from another system usually works as-is. Existing
// SKUs are updated; new SKUs are created with their opening stock. Stock on
// existing products is never overwritten by an import.

var importColumns = map[string][]string{
	"sku":         {"sku", "code", "item code", "product code", "stock code"},
	"title":       {"title", "name", "product", "product name", "description short"},
	"price":       {"price", "selling price", "wholesalezar", "wholesale", "trade price", "unit price"},
	"retail":      {"retail", "retailzar", "rrp", "recommended retail"},
	"stock":       {"stock", "stockquantity", "quantity", "qty", "on hand", "opening stock"},
	"barcode":     {"barcode", "gtin", "ean", "ean13", "upc"},
	"category":    {"category", "department", "group"},
	"brand":       {"brand", "vendor", "manufacturer"},
	"description": {"description", "long description", "details"},
	"weight":      {"weight", "weight kg", "weightkg"},
}

const importTemplate = "SKU,Title,Price,Retail,Stock,Barcode,Category,Brand,Description,Weight kg\n"

// ServeImportTemplate downloads an empty spreadsheet with the expected columns.
func (h *Handler) ServeImportTemplate(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="shoppage-products-template.csv"`)
	_, _ = io.WriteString(w, importTemplate)
}

func parsePrice(s string) (float64, bool) {
	s = strings.NewReplacer("R", "", " ", "", " ", "", ",", "").Replace(strings.TrimSpace(s))
	if s == "" {
		return 0, false
	}
	v, err := strconv.ParseFloat(s, 64)
	return v, err == nil && v >= 0
}

// ImportCatalog reads an uploaded CSV and adds or updates products.
func (h *Handler) ImportCatalog(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 5<<20)
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		http.Error(w, "The file is too large or unreadable. Upload a CSV under 5 MB.", http.StatusBadRequest)
		return
	}
	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Choose a CSV file to import.", http.StatusBadRequest)
		return
	}
	defer file.Close()

	cr := csv.NewReader(file)
	cr.FieldsPerRecord = -1
	cr.TrimLeadingSpace = true
	header, err := cr.Read()
	if err != nil {
		http.Error(w, "The file is empty or isn't a CSV.", http.StatusBadRequest)
		return
	}
	col := map[string]int{}
	for i, name := range header {
		n := strings.ToLower(strings.TrimSpace(strings.TrimPrefix(name, "\uFEFF")))
		for key, aliases := range importColumns {
			for _, a := range aliases {
				if n == a {
					if _, taken := col[key]; !taken {
						col[key] = i
					}
				}
			}
		}
	}
	if _, ok := col["sku"]; !ok {
		http.Error(w, "No SKU column found. Download the template to see the expected columns.", http.StatusBadRequest)
		return
	}
	if _, ok := col["title"]; !ok {
		http.Error(w, "No Title (or Name) column found. Download the template to see the expected columns.", http.StatusBadRequest)
		return
	}

	now := time.Now().UTC()
	added, updated := 0, 0
	var skipped []string
	h.state.mu.Lock()
	for row := 2; row <= 5001; row++ {
		rec, err := cr.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			skipped = append(skipped, fmt.Sprintf("row %d (unreadable)", row))
			continue
		}
		field := func(k string) string {
			if i, ok := col[k]; ok && i < len(rec) {
				return strings.TrimSpace(rec[i])
			}
			return ""
		}
		sku, title := field("sku"), field("title")
		if sku == "" && title == "" {
			continue
		}
		if sku == "" || title == "" {
			skipped = append(skipped, fmt.Sprintf("row %d (needs SKU and title)", row))
			continue
		}
		i := catalogIndexBySKU(h.state.Catalog, sku)
		isNew := i < 0
		if isNew {
			h.state.Catalog = append(h.state.Catalog, models.CatalogSKU{
				ID: fmt.Sprintf("sku_%d_%d", now.UnixNano(), row), StoreID: h.state.Store.ID, SKU: sku,
				FeedStatus: "Active", StockByHub: map[string]int{},
				Spec: models.ProductDetailSpec{Activities: []models.ProductActivity{{Icon: "plus", Description: "Imported from spreadsheet", TimeAgo: now.In(sast).Format("2 Jan, 15:04")}}},
			})
			i = len(h.state.Catalog) - 1
		}
		p := &h.state.Catalog[i]
		p.Title = title
		if v, ok := parsePrice(field("price")); ok {
			p.WholesaleZar = round2(v)
		}
		if v, ok := parsePrice(field("retail")); ok {
			p.RetailZar = round2(v)
		}
		for key, dst := range map[string]*string{"barcode": &p.Spec.Barcode, "category": &p.Category, "brand": &p.Brand, "description": &p.Spec.LongDesc} {
			if v := field(key); v != "" {
				*dst = v
			}
		}
		p.Spec.Barcode = strings.ReplaceAll(p.Spec.Barcode, " ", "")
		if v, err := strconv.ParseFloat(strings.ReplaceAll(field("weight"), ",", "."), 64); err == nil && v > 0 {
			p.Spec.WeightKg = v
		}
		if isNew {
			if q, err := strconv.Atoi(field("stock")); err == nil && q > 0 {
				h.state.adjustHubStock(i, "", q)
				h.state.postLedger(i, "Positive Adjmt.", "IMPORT", "Opening stock from import", h.state.primaryHubID(), q, now)
			} else {
				recountStock(p)
			}
			added++
		} else {
			updated++
		}
	}
	msg := fmt.Sprintf("Import finished: %d added, %d updated", added, updated)
	if len(skipped) > 0 {
		shown := skipped
		if len(shown) > 5 {
			shown = append(append([]string(nil), skipped[:5]...), fmt.Sprintf("and %d more", len(skipped)-5))
		}
		msg += fmt.Sprintf(", %d skipped: %s", len(skipped), strings.Join(shown, "; "))
	}
	h.state.audit(h.actor(r), "Products imported", "Catalog", "import", msg, now)
	h.state.mu.Unlock()

	setToast(w, msg+".", "")
	h.renderTab(w, r, "catalog")
}
