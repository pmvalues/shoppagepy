package handlers

import (
	"encoding/csv"
	"encoding/xml"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/shoppage/merchant-os/internal/models"
)

// Listing feeds are generated from the product records on every request, so
// there is nothing to "sync": Google and Meta fetch these URLs on their own
// schedule. A product is only included once it meets that channel's rules
// (see models.ComputeReadiness); nothing is invented to fill a gap.

// productPhotoURL returns the absolute URL of a product's photo, if any.
func (h *Handler) productPhotoURL(media []models.MediaAsset, sku string) string {
	for _, m := range media {
		if strings.Contains(strings.ToLower(m.Category), "photo") && strings.Contains(strings.ToUpper(m.Name), strings.ToUpper(sku)) {
			if strings.HasPrefix(m.URL, "http") {
				return m.URL
			}
			return strings.TrimRight(h.cfg.PublicBaseURL, "/") + m.URL
		}
	}
	return ""
}

func (h *Handler) productURL(p models.CatalogSKU) string {
	return fmt.Sprintf("%s/p/%s", strings.TrimRight(h.cfg.PublicBaseURL, "/"), p.ID)
}

type gItem struct {
	ID           string `xml:"g:id"`
	Title        string `xml:"g:title"`
	Description  string `xml:"g:description"`
	Link         string `xml:"g:link"`
	ImageLink    string `xml:"g:image_link"`
	Price        string `xml:"g:price"`
	Availability string `xml:"g:availability"`
	Condition    string `xml:"g:condition"`
	Brand        string `xml:"g:brand"`
	GTIN         string `xml:"g:gtin,omitempty"`
	MPN          string `xml:"g:mpn"`
	ProductType  string `xml:"g:product_type,omitempty"`
	WeightKg     string `xml:"g:shipping_weight,omitempty"`
}

type gFeed struct {
	XMLName xml.Name `xml:"rss"`
	Version string   `xml:"version,attr"`
	NS      string   `xml:"xmlns:g,attr"`
	Channel struct {
		Title       string  `xml:"title"`
		Link        string  `xml:"link"`
		Description string  `xml:"description"`
		Items       []gItem `xml:"item"`
	} `xml:"channel"`
}

// ServeGMCFeed serves the Google Merchant Center product feed.
func (h *Handler) ServeGMCFeed(w http.ResponseWriter, r *http.Request) {
	h.state.mu.RLock()
	store := h.state.Store
	readiness := computeReadiness(h.state)
	var feed gFeed
	feed.Version, feed.NS = "2.0", "http://base.google.com/ns/1.0"
	feed.Channel.Title = store.Name
	feed.Channel.Link = strings.TrimRight(h.cfg.PublicBaseURL, "/") + "/m/" + store.ID
	feed.Channel.Description = "Products from " + store.Name + " on Shoppage"
	for _, p := range h.state.Catalog {
		if !readiness[p.ID].ReadyOn(models.ChannelGoogle) {
			continue
		}
		it := gItem{
			ID: p.ID, Title: p.Title, Description: p.Spec.LongDesc, Link: h.productURL(p),
			ImageLink: h.productPhotoURL(h.state.MediaAssets, p.SKU), Price: fmt.Sprintf("%.2f ZAR", p.WholesaleZar),
			Availability: "in stock", Condition: "new", Brand: p.Brand, GTIN: p.Spec.Barcode, MPN: p.SKU, ProductType: p.Category,
		}
		if !p.InStock || p.StockQuantity <= 0 {
			it.Availability = "out of stock"
		}
		if p.Spec.WeightKg > 0 {
			it.WeightKg = fmt.Sprintf("%.3f kg", p.Spec.WeightKg)
		}
		feed.Channel.Items = append(feed.Channel.Items, it)
	}
	h.state.mu.RUnlock()

	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	_, _ = w.Write([]byte(xml.Header))
	enc := xml.NewEncoder(w)
	enc.Indent("", "  ")
	_ = enc.Encode(feed)
}

// ServeMetaCatalogCSV serves the Facebook & Instagram catalogue file.
func (h *Handler) ServeMetaCatalogCSV(w http.ResponseWriter, r *http.Request) {
	h.state.mu.RLock()
	defer h.state.mu.RUnlock()
	readiness := computeReadiness(h.state)

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="meta-catalog.csv"`)
	cw := csv.NewWriter(w)
	_ = cw.Write([]string{"id", "title", "description", "availability", "condition", "price", "link", "image_link", "brand", "gtin", "product_type"})
	for _, p := range h.state.Catalog {
		if !readiness[p.ID].ReadyOn(models.ChannelMeta) {
			continue
		}
		avail := "in stock"
		if !p.InStock || p.StockQuantity <= 0 {
			avail = "out of stock"
		}
		_ = cw.Write([]string{p.SKU, p.Title, p.Spec.LongDesc, avail, "new", fmt.Sprintf("%.2f ZAR", p.WholesaleZar),
			h.productURL(p), h.productPhotoURL(h.state.MediaAssets, p.SKU), p.Brand, p.Spec.Barcode, p.Category})
	}
	cw.Flush()
}

// ValidateFeeds re-checks every product against every channel's rules and
// reports the real result.
func (h *Handler) ValidateFeeds(w http.ResponseWriter, r *http.Request) {
	now := time.Now().UTC()
	h.state.mu.Lock()
	readiness := computeReadiness(h.state)
	ready, blocked := 0, 0
	for _, rd := range readiness {
		if rd.ReadyCount() == len(models.ListingChannels) {
			ready++
		} else {
			blocked++
		}
	}
	msg := fmt.Sprintf("Checked %d products: %d ready everywhere, %d with something to fix.", len(readiness), ready, blocked)
	h.state.audit(h.actor(r), "Listings checked", "Feeds", "all", msg, now)
	h.state.mu.Unlock()

	setToast(w, msg, "")
	h.renderTab(w, r, "feeds")
}

// SyncChannels is kept for older links. Feeds are generated live, so this
// only confirms that and records the check.
func (h *Handler) SyncChannels(w http.ResponseWriter, r *http.Request) {
	setToast(w, "Feeds are always current: Google and Meta read them straight from your product records.", "")
	h.renderTab(w, r, "channels")
}

// SaveChannelSettings records the merchant's messaging preferences.
func (h *Handler) SaveChannelSettings(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	now := time.Now().UTC()
	var on []string
	for _, k := range []string{"autoQuote", "pdfInvoice", "dispatchAlert"} {
		if r.FormValue(k) != "" {
			on = append(on, k)
		}
	}
	h.state.mu.Lock()
	h.state.audit(h.actor(r), "Messaging preferences saved", "ChannelPreferences", "whatsapp", "Enabled: "+strings.Join(on, ", "), now)
	h.state.mu.Unlock()
	setToast(w, "Preferences saved.", "")
	h.renderTab(w, r, "channels")
}
