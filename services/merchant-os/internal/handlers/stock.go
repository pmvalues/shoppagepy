package handlers

import "github.com/shoppage/merchant-os/internal/models"

// Stock is held per warehouse (CatalogSKU.StockByHub) and StockQuantity is
// always their sum. Every stock change goes through these helpers so the
// totals on Products, Inventory and Home can never drift apart.

// primaryHubID is where unassigned stock changes land: the first configured
// warehouse. Callers must hold the state lock.
func (s *MerchantStoreState) primaryHubID() string {
	if len(s.Warehouses) > 0 {
		return s.Warehouses[0].ID
	}
	return "main"
}

// hubIDFor resolves a hub by ID, name or ledger location code
// (e.g. "MIDRAND-01", "Cape Town Depot"); unknown values map to the primary hub.
func (s *MerchantStoreState) hubIDFor(ref string) string {
	for _, h := range s.Warehouses {
		if h.ID == ref || h.Name == ref {
			return h.ID
		}
	}
	switch ref {
	case "MIDRAND-01", "MAIN-JHB":
		return "wh_jhb"
	case "CPT-DOCK":
		return "wh_cpt"
	case "DBN-TRANSIT":
		return "wh_dbn"
	}
	return s.primaryHubID()
}

// adjustHubStock changes one product's stock at one hub by delta (never below
// zero) and recomputes the product total. Returns the applied delta.
func (s *MerchantStoreState) adjustHubStock(i int, hubID string, delta int) int {
	p := &s.Catalog[i]
	if p.StockByHub == nil {
		p.StockByHub = map[string]int{}
	}
	if hubID == "" {
		hubID = s.primaryHubID()
	}
	next := p.StockByHub[hubID] + delta
	if next < 0 {
		delta -= next
		next = 0
	}
	p.StockByHub[hubID] = next
	recountStock(p)
	return delta
}

// removeStock takes qty units out of a product, starting at the primary hub and
// then drawing from other hubs, as a sale or counter checkout would.
func (s *MerchantStoreState) removeStock(i int, qty int) {
	order := []string{s.primaryHubID()}
	for _, h := range s.Warehouses {
		if h.ID != order[0] {
			order = append(order, h.ID)
		}
	}
	for _, hub := range order {
		if qty <= 0 {
			break
		}
		qty += s.adjustHubStock(i, hub, -qty)
	}
}

// setStockTotal sets a product's total by applying the difference at the
// primary hub (drawing from other hubs when reducing past it).
func (s *MerchantStoreState) setStockTotal(i int, total int) {
	if total < 0 {
		total = 0
	}
	diff := total - s.Catalog[i].StockQuantity
	if diff >= 0 {
		s.adjustHubStock(i, "", diff)
		return
	}
	s.removeStock(i, -diff)
}

// moveStock transfers units between hubs without changing the product total.
func (s *MerchantStoreState) moveStock(i int, fromHub, toHub string, qty int) {
	moved := -s.adjustHubStock(i, fromHub, -qty)
	s.adjustHubStock(i, toHub, moved)
}

func recountStock(p *models.CatalogSKU) {
	total := 0
	for _, q := range p.StockByHub {
		total += q
	}
	p.StockQuantity = total
	p.InStock = total > 0
}

// normalize repairs state loaded from an older snapshot: products saved before
// per-hub stock existed get their whole total assigned to the primary hub.
// Callers must hold the write lock.
func (s *MerchantStoreState) normalize() {
	for i := range s.Catalog {
		p := &s.Catalog[i]
		if len(p.StockByHub) == 0 {
			p.StockByHub = map[string]int{}
			if p.StockQuantity > 0 {
				p.StockByHub[s.primaryHubID()] = p.StockQuantity
			}
		}
		recountStock(p)
	}
}

// catalogIndexByID finds a product by internal ID or SKU code, case-insensitive,
// so /catalog/MIT-3361 and /catalog/mit_3361 both resolve.
func (s *MerchantStoreState) catalogIndexByID(ref string) int {
	for i, p := range s.Catalog {
		if p.ID == ref {
			return i
		}
	}
	for i, p := range s.Catalog {
		if equalFoldTrim(p.SKU, ref) || equalFoldTrim(p.ID, ref) {
			return i
		}
	}
	return -1
}

func catalogIndexBySKU(catalog []models.CatalogSKU, sku string) int {
	for i, p := range catalog {
		if equalFoldTrim(p.SKU, sku) {
			return i
		}
	}
	return -1
}
