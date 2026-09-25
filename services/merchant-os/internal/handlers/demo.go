package handlers

import (
	"fmt"
	"time"

	"github.com/shoppage/merchant-os/internal/models"
)

// seedDemo makes the bundled sample business internally consistent so every
// screen tells the same story: stock is held per warehouse and sums to each
// product's total, barcodes are valid GS1 codes, and there is a month of order
// history for charts to draw from. It runs only for the sample business;
// real workspaces start empty and fill from the merchant's own records.
func seedDemo(s *MerchantStoreState, now time.Time) {
	s.Demo = true
	s.Store.Storefront = models.Storefront{
		Headline:       "Hotel hangers, security rings and food-safe packaging, from Midrand",
		About:          "Trade supplier to hotels, lodges and caterers across South Africa. Order by the carton; quotes the same day.",
		Ribbon:         "Same-day quotes on WhatsApp for orders over R 5 000",
		RibbonOn:       true,
		WhatsAppButton: true,
		TradingHours:   "Mon–Fri 08:00–17:00",
	}

	hubSplit := map[string]map[string]int{
		"mit_3361": {"wh_jhb": 330, "wh_cpt": 120},
		"mit_2088": {"wh_jhb": 792, "wh_cpt": 288, "wh_dbn": 120},
		"mit_8609": {"wh_jhb": 1900, "wh_cpt": 600, "wh_dbn": 500},
		"mit_8610": {},
	}
	for i := range s.Catalog {
		p := &s.Catalog[i]
		if split, ok := hubSplit[p.ID]; ok {
			p.StockByHub = map[string]int{}
			for hub, q := range split {
				p.StockByHub[hub] = q
			}
		}
		// Demo barcodes use the South African GS1 prefix (600) with a
		// correct check digit, so feed validation passes on real rules.
		body := fmt.Sprintf("60098824%04d", i+1)
		p.Spec.Barcode = fmt.Sprintf("%s%d", body, models.GTINCheckDigit(body))
	}
	s.normalize()
	for i := range s.ItemLedger {
		s.ItemLedger[i].Location = s.hubName(s.hubIDFor(s.ItemLedger[i].Location))
	}

	// Earlier fulfilled orders, so charts and averages have history. Totals
	// are built from real catalogue prices plus 15% VAT.
	type line struct {
		sku string
		qty int
	}
	history := []struct {
		daysAgo float64
		company string
		contact string
		payment string
		status  string
		lines   []line
	}{
		{27.4, "Sandton Convention Centre", "Thulani Khumalo", "Bank EFT", "delivered", []line{{"MIT-3361", 150}, {"MIT-2088", 150}}},
		{25.2, "Gauteng Catering Solutions", "Brenda Fourie", "Capitec Pay", "delivered", []line{{"MIT-8609", 800}}},
		{22.6, "Protea Hotel Balalaika Sandton", "David van der Merwe", "Bank EFT", "delivered", []line{{"MIT-3361", 120}}},
		{19.3, "Cape Coast Lodge Group", "Marelize Botha", "Ozow Instant EFT", "delivered", []line{{"MIT-2088", 300}, {"MIT-3361", 60}}},
		{16.1, "Gauteng Catering Solutions", "Brenda Fourie", "Capitec Pay", "delivered", []line{{"MIT-8609", 1200}, {"MIT-8610", 1000}}},
		{13.5, "Sandton Convention Centre", "Thulani Khumalo", "Bank EFT", "delivered", []line{{"MIT-3361", 200}}},
		{11.2, "Gold Reef City Casino & Hotel", "Lindiwe Zulu", "Bank EFT", "delivered", []line{{"MIT-2088", 300}}},
		{9.4, "Buildmax Commercial Supplies", "Johan van der Merwe", "PayFast Card", "delivered", []line{{"MIT-8609", 500}}},
		{7.3, "Protea Hotel Balalaika Sandton", "David van der Merwe", "Bank EFT", "delivered", []line{{"MIT-3361", 80}, {"MIT-2088", 80}}},
		{5.6, "Cape Coast Lodge Group", "Marelize Botha", "Ozow Instant EFT", "dispatched", []line{{"MIT-3361", 100}}},
		{3.2, "Gauteng Catering Solutions", "Brenda Fourie", "Capitec Pay", "dispatched", []line{{"MIT-8609", 600}, {"MIT-8610", 800}}},
		{0.2, "Sandton Convention Centre", "Thulani Khumalo", "Bank EFT", "confirmed", []line{{"MIT-2088", 120}}},
	}
	number := 9806
	for _, hst := range history {
		o := models.ProformaOrder{
			ID:            fmt.Sprintf("ord_%d", number),
			OrderNumber:   fmt.Sprintf("#ORD-%d", number),
			Customer:      hst.contact,
			Company:       hst.company,
			PaymentMethod: hst.payment,
			BankingRef:    fmt.Sprintf("ORD-%d", number),
			Status:        hst.status,
			Date:          now.Add(-time.Duration(hst.daysAgo * float64(24*time.Hour))),
		}
		o.DueDate = o.Date.Add(72 * time.Hour)
		for _, ln := range hst.lines {
			if i := catalogIndexBySKU(s.Catalog, ln.sku); i >= 0 {
				p := s.Catalog[i]
				total := float64(ln.qty) * p.WholesaleZar
				o.LineItems = append(o.LineItems, models.ProformaLineItem{SKU: p.SKU, Title: p.Title, Quantity: ln.qty, UnitPriceZar: p.WholesaleZar, TotalZar: total})
				o.SubtotalZar += total
			}
		}
		o.VatZar = round2(o.SubtotalZar * 0.15)
		o.GrandTotal = round2(o.SubtotalZar + o.VatZar)
		s.Orders = append(s.Orders, o)
		number++
	}

	// The sample "quoted" enquiry carries real quote terms, priced from the
	// catalogue and the volume tiers like any quote sent from the Quotes page.
	for i := range s.Leads {
		l := &s.Leads[i]
		if l.Status != "quoted" {
			continue
		}
		if j := matchLeadSKU(s.Catalog, *l); j >= 0 {
			d, _ := tierDiscount(s.WholesaleTiers, l.Quantity)
			l.SKU = s.Catalog[j].SKU
			l.QuotedUnitZar = round2(s.Catalog[j].WholesaleZar * (1 - d/100))
			l.EstimatedTotal = round2(float64(l.Quantity) * l.QuotedUnitZar * 1.15)
		}
		l.QuotedAt = l.ReceivedAt.Add(30 * time.Minute)
		l.ValidUntil = l.QuotedAt.AddDate(0, 0, 7)
	}

	// The assistant starts with suggestions derived from the data above, not a
	// scripted conversation.
	s.CopilotMessages = nil
	s.Proposals = buildProposals(s, now)
}

func round2(v float64) float64 {
	return float64(int64(v*100+0.5)) / 100
}
