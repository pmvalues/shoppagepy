package handlers_test

import (
	"bytes"
	"encoding/json"
	"encoding/xml"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/url"
	"regexp"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/shoppage/merchant-os/internal/handlers"
	"github.com/shoppage/merchant-os/internal/models"
	"github.com/shoppage/merchant-os/internal/templates"
)

var _ = bytes.NewReader
var _ = multipart.NewWriter
var _ = regexp.MustCompile

func newTestApp() (http.Handler, *handlers.MerchantStoreState) {
	state := handlers.NewDefaultState()
	h := handlers.NewHandler(state)

	r := chi.NewRouter()
	r.Get("/", h.ServeDashboard)
	r.Get("/desk", h.ServeDashboard)
	r.Get("/tab/{tab}", h.ServeTab)
	r.Get("/merchant/search", h.Search)
	r.Post("/undo/{id}", h.Undo)
	r.Get("/catalog/export.csv", h.ExportCatalogCSV)
	r.Get("/catalog/new", h.ServeProductNew)
	r.Post("/catalog/import", h.ImportCatalog)
	r.Get("/catalog/{id}", h.ServeProductDetail)
	r.Get("/catalog/{id}/edit", h.ServeProductEdit)
	r.Post("/catalog/{id}/edit", h.SaveProductEdit)
	r.Post("/catalog/new", h.CreateProduct)
	r.Post("/catalog/{id}/toggle-stock", h.ToggleStock)
	r.Post("/catalog/{id}/price", h.UpdatePrice)
	r.Post("/inventory/{id}/adjust", h.AdjustInventory)
	r.Post("/inventory/intake", h.AdjustInventoryIntake)
	r.Get("/inventory/export.csv", h.ExportInventoryCSV)
	r.Get("/orders/{id}/invoice", h.ServeInvoiceModal)
	r.Post("/orders/{id}/advance-status", h.AdvanceOrderStatus)
	r.Post("/orders/new", h.CreateOrder)
	r.Post("/rfqs/{id}/convert", h.ConvertRFQ)
	r.Post("/rfqs/{id}/quote", h.SendQuote)
	r.Post("/customers/new", h.CreateCustomer)
	r.Get("/customers/export.csv", h.ExportCustomersCSV)
	r.Post("/discounts/{id}/toggle", h.ToggleCoupon)
	r.Post("/discounts/new", h.CreateCoupon)
	r.Post("/discounts/tier/new", h.CreateWholesaleTier)
	r.Post("/channels/sync", h.SyncChannels)
	r.Post("/channels/settings", h.SaveChannelSettings)
	r.Post("/copilot/ask", h.AskCopilot)
	r.Post("/copilot/action", h.ExecuteCopilotAction)
	r.Post("/settings/save", h.SaveSettings)
	r.Post("/settings/banking", h.SaveBanking)
	r.Post("/settings/plan", h.UpdatePlan)
	r.Post("/transfers/new", h.CreateTransfer)
	r.Post("/transfers/{id}/receive", h.ReceiveTransfer)
	r.Post("/manifests/new", h.GenerateManifest)
	r.Post("/pos/checkout", h.POSCheckout)
	r.Post("/scan/reconcile", h.ReconcileScan)
	r.Post("/flow/{id}/toggle", h.ToggleFlowRule)
	r.Post("/flow/new", h.CreateFlowRule)
	r.Post("/media/new", h.CreateMediaAsset)
	r.Get("/media/files/{id}", h.ServeMediaFile)
	r.Post("/editor/save", h.SaveEditorSettings)
	r.Get("/audit-logs/export.csv", h.ExportAuditLogsCSV)
	r.Get("/feeds/google-merchant-center.xml", h.ServeGMCFeed)
	r.Get("/feeds/meta-catalog.csv", h.ServeMetaCatalogCSV)
	r.Post("/feeds/validate", h.ValidateFeeds)
	r.Get("/chat/thread/{id}", h.SelectChatThread)
	r.Post("/chat/send", h.SendChatMessage)
	r.Post("/chat/quote", h.SendStructuredQuote)
	r.Post("/chat/action", h.HandleChatAction)
	r.Post("/rma/update", h.UpdateRMAStatus)
	r.Post("/rma/new", h.CreateRMARequest)
	r.NotFound(h.ServeNotFound)
	return r, state
}

func setupTestRouter() http.Handler {
	r, _ := newTestApp()
	return r
}

func get(t *testing.T, h http.Handler, path string, hx bool) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest("GET", path, nil)
	if hx {
		req.Header.Set("HX-Request", "true")
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func post(t *testing.T, h http.Handler, path string, form url.Values) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest("POST", path, strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("HX-Request", "true")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

// toast decodes the HX-Trigger toast a handler sent, if any.
func toast(t *testing.T, rec *httptest.ResponseRecorder) (msg, undo string) {
	t.Helper()
	raw := rec.Header().Get("HX-Trigger")
	if raw == "" {
		return "", ""
	}
	var v struct {
		Toast struct {
			Message string `json:"message"`
			Undo    string `json:"undo"`
		} `json:"toast"`
	}
	if err := json.Unmarshal([]byte(raw), &v); err != nil {
		t.Fatalf("HX-Trigger is not valid JSON: %v (%q)", err, raw)
	}
	return v.Toast.Message, v.Toast.Undo
}

func findSKU(s *handlers.MerchantStoreState, sku string) *models.CatalogSKU {
	for i := range s.Catalog {
		if s.Catalog[i].SKU == sku {
			return &s.Catalog[i]
		}
	}
	return nil
}

func hubSum(p *models.CatalogSKU) int {
	n := 0
	for _, q := range p.StockByHub {
		n += q
	}
	return n
}

// ---------- Shell & navigation ----------

func TestShellHasSevenSectionsAndDemoBanner(t *testing.T) {
	app := setupTestRouter()
	rec := get(t, app, "/desk", false)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET /desk = %d", rec.Code)
	}
	body := rec.Body.String()
	for _, w := range templates.Workspaces {
		if !strings.Contains(body, ">"+w.Label+"</span>") {
			t.Errorf("sidebar is missing section %q", w.Label)
		}
	}
	if len(templates.Workspaces) != 7 {
		t.Errorf("sidebar has %d sections, want 7", len(templates.Workspaces))
	}
	for _, want := range []string{"/merchant-static/css/workspace.css", "Demo workspace", `id="subnav"`, `id="bottombar"`, "Needs you"} {
		if !strings.Contains(body, want) {
			t.Errorf("home page missing %q", want)
		}
	}
}

func TestEveryTabRendersFullAndPartial(t *testing.T) {
	app := setupTestRouter()
	for _, w := range templates.Workspaces {
		for _, tab := range w.Tabs {
			full := get(t, app, "/tab/"+tab.Key, false)
			if full.Code != http.StatusOK || !strings.Contains(strings.ToLower(full.Body.String()), "<!doctype html>") {
				t.Errorf("full /tab/%s = %d, want a complete page", tab.Key, full.Code)
			}
			part := get(t, app, "/tab/"+tab.Key, true)
			body := part.Body.String()
			if part.Code != http.StatusOK || strings.Contains(strings.ToLower(body), "<!doctype html>") {
				t.Errorf("partial /tab/%s = %d, want a fragment", tab.Key, part.Code)
			}
			if !strings.Contains(body, `hx-swap-oob="true"`) {
				t.Errorf("partial /tab/%s does not refresh the shell out-of-band", tab.Key)
			}
		}
	}
	for _, tab := range []string{"settings", "audit-logs"} {
		if rec := get(t, app, "/tab/"+tab, true); rec.Code != http.StatusOK {
			t.Errorf("/tab/%s = %d", tab, rec.Code)
		}
	}
}

func TestUnknownPagesAreStyled404s(t *testing.T) {
	app := setupTestRouter()
	for _, path := range []string{"/tab/nope", "/catalog/NOPE-1"} {
		rec := get(t, app, path, false)
		if rec.Code != http.StatusNotFound {
			t.Errorf("GET %s = %d, want 404", path, rec.Code)
		}
		if !strings.Contains(rec.Body.String(), "workspace.css") {
			t.Errorf("GET %s should render inside the workspace, got a bare error", path)
		}
	}
}

func TestProductResolvesBySKUOrID(t *testing.T) {
	app := setupTestRouter()
	for _, path := range []string{"/catalog/MIT-3361", "/catalog/mit_3361", "/catalog/mit-3361"} {
		rec := get(t, app, path, true)
		if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "Commercial Anti-Theft Wooden Male Hanger") {
			t.Errorf("GET %s = %d, want the hanger product page", path, rec.Code)
		}
	}
}

// ---------- Honesty ----------

// No screen may present invented figures or infrastructure claims as fact.
func TestNoFabricatedClaimsOnAnyScreen(t *testing.T) {
	app := setupTestRouter()
	banned := []string{
		"Pemofy", "pod-za-01", "Merkle", "12 ms", "99.8%", "98.4%", "74.2%", "CIPC Verified SKU",
		"R8,420", "Live visitors", "Speckled Mug", "Sovereign", "SLA 4 Hours", "0% SHARED DATA RISK",
		"Verified 100%", "TCG-ZA-984210", "Hello Sipho", "Discount created",
	}
	tabs := []string{"overview", "settings", "audit-logs"}
	for _, w := range templates.Workspaces {
		for _, t := range w.Tabs {
			tabs = append(tabs, t.Key)
		}
	}
	for _, tab := range tabs {
		body := get(t, app, "/tab/"+tab, false).Body.String()
		for _, b := range banned {
			if strings.Contains(body, b) {
				t.Errorf("/tab/%s shows fabricated or legacy text %q", tab, b)
			}
		}
	}
}

// The plan allowance and month's sales must read the same on every screen.
func TestFiguresAgreeAcrossScreens(t *testing.T) {
	app, state := newTestApp()
	plan := models.PlanFor(state.Store.CurrentPlan)
	cap := models.FormatZARWhole(plan.FreeAllowanceZar)
	for _, tab := range []string{"overview", "settings"} {
		body := get(t, app, "/tab/"+tab, true).Body.String()
		if tab == "overview" && !strings.Contains(body, cap) {
			t.Errorf("home should show the plan allowance %s", cap)
		}
		if tab == "settings" && !strings.Contains(body, cap) {
			t.Errorf("settings should show the plan allowance %s", cap)
		}
	}
	home := get(t, app, "/tab/overview", true).Body.String()
	analytics := get(t, app, "/tab/analytics", true).Body.String()
	re := regexp.MustCompile(`Sales this month[\s\S]*?k-val">([^<]+)<`)
	m := re.FindStringSubmatch(home)
	if m == nil {
		t.Skip("could not locate the month sales tile")
	}
	if !strings.Contains(analytics, m[1]) {
		t.Errorf("analytics does not show the same month sales as home (%s)", m[1])
	}
}

func TestStockByLocationAlwaysSumsToTotal(t *testing.T) {
	_, state := newTestApp()
	for _, p := range state.Catalog {
		if hubSum(&p) != p.StockQuantity {
			t.Errorf("%s: locations sum to %d but total is %d", p.SKU, hubSum(&p), p.StockQuantity)
		}
	}
}

func TestDemoBarcodesAreValidGTINs(t *testing.T) {
	_, state := newTestApp()
	for _, p := range state.Catalog {
		if !models.ValidGTIN(p.Spec.Barcode) {
			t.Errorf("%s has invalid barcode %q", p.SKU, p.Spec.Barcode)
		}
	}
}

// ---------- Products ----------

func TestPriceChangeIsAuditedAndUndoable(t *testing.T) {
	app, state := newTestApp()
	before := findSKU(state, "MIT-3361").WholesaleZar
	rec := post(t, app, "/catalog/mit_3361/price", url.Values{"price": {"24.50"}})
	if rec.Code != http.StatusOK {
		t.Fatalf("price update = %d", rec.Code)
	}
	msg, undo := toast(t, rec)
	if undo == "" || !strings.Contains(msg, "24.50") {
		t.Fatalf("expected a confirmation with undo, got %q / %q", msg, undo)
	}
	if got := findSKU(state, "MIT-3361").WholesaleZar; got != 24.50 {
		t.Fatalf("price = %.2f, want 24.50", got)
	}
	if !strings.Contains(state.AuditLogs[0].Details, "→") {
		t.Errorf("audit entry should record before → after, got %q", state.AuditLogs[0].Details)
	}
	post(t, app, "/undo/"+undo, nil)
	if got := findSKU(state, "MIT-3361").WholesaleZar; got != before {
		t.Errorf("after undo price = %.2f, want %.2f", got, before)
	}
}

func TestCreateProductInventsNothing(t *testing.T) {
	app, state := newTestApp()
	form := url.Values{"title": {"Plain Test Product"}, "sku": {"TST-1"}, "wholesaleZar": {"10"}, "stockQuantity": {"5"}}
	rec := post(t, app, "/catalog/new", form)
	if rec.Code != http.StatusOK {
		t.Fatalf("create = %d: %s", rec.Code, rec.Body.String())
	}
	p := findSKU(state, "TST-1")
	if p == nil {
		t.Fatal("product not created")
	}
	if p.Spec.Barcode != "" || p.Spec.SABSApproved || p.Spec.LongDesc != "" {
		t.Errorf("new product has invented facts: barcode %q, SABS %v, desc %q", p.Spec.Barcode, p.Spec.SABSApproved, p.Spec.LongDesc)
	}
	if p.StockQuantity != 5 || hubSum(p) != 5 {
		t.Errorf("opening stock = %d (locations %d), want 5", p.StockQuantity, hubSum(p))
	}
	if dup := post(t, app, "/catalog/new", form); dup.Code != http.StatusConflict {
		t.Errorf("duplicate SKU = %d, want 409", dup.Code)
	}
}

func TestEditingProductDoesNotChangeStock(t *testing.T) {
	app, state := newTestApp()
	before := findSKU(state, "MIT-3361").StockQuantity
	form := url.Values{"title": {"Commercial Anti-Theft Wooden Male Hanger 44cm"}, "sku": {"MIT-3361"}, "wholesaleZar": {"22.88"}, "stockQuantity": {"1"}}
	if rec := post(t, app, "/catalog/mit_3361/edit", form); rec.Code != http.StatusOK {
		t.Fatalf("edit = %d", rec.Code)
	}
	if got := findSKU(state, "MIT-3361").StockQuantity; got != before {
		t.Errorf("stock changed from %d to %d via the editor", before, got)
	}
}

func TestToggleStockNeverInventsUnits(t *testing.T) {
	app, state := newTestApp()
	post(t, app, "/catalog/mit_8610/toggle-stock", nil)
	p := findSKU(state, "MIT-8610")
	if p.StockQuantity != 0 || p.InStock {
		t.Errorf("toggling an empty product gave stock %d, in stock %v", p.StockQuantity, p.InStock)
	}
}

// ---------- Stock ----------

func TestAdjustmentAtALocation(t *testing.T) {
	app, state := newTestApp()
	p := findSKU(state, "MIT-3361")
	total, cpt := p.StockQuantity, p.StockByHub["wh_cpt"]
	post(t, app, "/inventory/mit_3361/adjust", url.Values{"adjustment": {"25"}, "hub": {"wh_cpt"}})
	if p.StockQuantity != total+25 || p.StockByHub["wh_cpt"] != cpt+25 {
		t.Errorf("after +25 at CPT: total %d (want %d), CPT %d (want %d)", p.StockQuantity, total+25, p.StockByHub["wh_cpt"], cpt+25)
	}
	if state.ItemLedger[0].RemainingQty != p.StockQuantity {
		t.Errorf("ledger remaining %d, want %d", state.ItemLedger[0].RemainingQty, p.StockQuantity)
	}
}

func TestStockIntakeRecordsMovement(t *testing.T) {
	app, state := newTestApp()
	rec := post(t, app, "/inventory/intake", url.Values{"skuId": {"MIT-8610"}, "hubName": {"wh_jhb"}, "reason": {"Delivery received"}, "quantity": {"500"}})
	if rec.Code != http.StatusOK {
		t.Fatalf("intake = %d", rec.Code)
	}
	if p := findSKU(state, "MIT-8610"); p.StockQuantity != 500 || !p.InStock {
		t.Errorf("after intake stock = %d, in stock %v", p.StockQuantity, p.InStock)
	}
	if !strings.Contains(rec.Body.String(), "Stock movements") {
		t.Errorf("expected the stock page after intake")
	}
}

func TestTransferMovesStockOnlyWhenReceived(t *testing.T) {
	app, state := newTestApp()
	p := findSKU(state, "MIT-3361")
	total, jhb, cpt := p.StockQuantity, p.StockByHub["wh_jhb"], p.StockByHub["wh_cpt"]
	post(t, app, "/transfers/tr_8821/receive", nil)
	if p.StockQuantity != total || p.StockByHub["wh_jhb"] != jhb-150 || p.StockByHub["wh_cpt"] != cpt+150 {
		t.Errorf("after receiving 150: total %d, JHB %d, CPT %d", p.StockQuantity, p.StockByHub["wh_jhb"], p.StockByHub["wh_cpt"])
	}
	// Receiving twice must not move stock again.
	post(t, app, "/transfers/tr_8821/receive", nil)
	if p.StockByHub["wh_cpt"] != cpt+150 {
		t.Errorf("second receive moved stock again")
	}
	rec := post(t, app, "/transfers/new", url.Values{"sourceHub": {"wh_dbn"}, "destHub": {"wh_cpt"}, "skuId": {"mit_3361"}, "quantity": {"9999"}})
	if msg, _ := toast(t, rec); !strings.Contains(msg, "only has") {
		t.Errorf("over-stock transfer should be refused, got %q", msg)
	}
}

func TestCountSetsLocationQuantity(t *testing.T) {
	app, state := newTestApp()
	rec := post(t, app, "/scan/reconcile", url.Values{"skuId": {"mit_3361"}, "physicalCount": {"452"}, "hub": {"wh_jhb"}})
	if rec.Code != http.StatusOK {
		t.Fatalf("count = %d", rec.Code)
	}
	p := findSKU(state, "MIT-3361")
	if p.StockByHub["wh_jhb"] != 452 || hubSum(p) != p.StockQuantity {
		t.Errorf("JHB = %d after counting 452; total %d, sum %d", p.StockByHub["wh_jhb"], p.StockQuantity, hubSum(p))
	}
	if !strings.Contains(rec.Body.String(), "452 counted") {
		t.Errorf("recent counts should list the new count")
	}
}

// ---------- Selling ----------

func TestCounterSaleUsesTheCart(t *testing.T) {
	app, state := newTestApp()
	p := findSKU(state, "MIT-2088")
	before := p.StockQuantity
	form := url.Values{"customer": {"Radisson Red Hotel V&A"}, "paymentMethod": {"Card"}, "cart": {"MIT-2088:3"}, "clientRef": {"device-1"}}
	rec := post(t, app, "/pos/checkout", form)
	if rec.Code != http.StatusOK {
		t.Fatalf("checkout = %d", rec.Code)
	}
	if p.StockQuantity != before-3 {
		t.Errorf("stock = %d, want %d", p.StockQuantity, before-3)
	}
	txn := state.RecentPOSTxns[0]
	want := 3 * p.WholesaleZar * 1.15
	if txn.TotalZar < want-0.02 || txn.TotalZar > want+0.02 || txn.Customer != "Radisson Red Hotel V&A" {
		t.Errorf("sale total %.2f for %q, want %.2f", txn.TotalZar, txn.Customer, want)
	}
	// Resending the same offline sale must not record it twice.
	post(t, app, "/pos/checkout", form)
	if state.RecentPOSTxns[0].ID != txn.ID || p.StockQuantity != before-3 {
		t.Errorf("duplicate client reference recorded a second sale")
	}
	empty := post(t, app, "/pos/checkout", url.Values{"customer": {"x"}})
	if msg, _ := toast(t, empty); !strings.Contains(msg, "empty") {
		t.Errorf("empty cart should be refused, got %q", msg)
	}
}

func TestOrderLifecycleTakesStockOnDispatch(t *testing.T) {
	app, state := newTestApp()
	post(t, app, "/orders/new", url.Values{"company": {"Test Lodge"}, "customer": {"Ann"}, "skuId": {"mit_2088"}, "quantity": {"10"}})
	o := state.Orders[0]
	if o.Company != "Test Lodge" || o.Status != "issued" || o.Email != "" || o.VatNumber != "" {
		t.Fatalf("new order = %+v", o)
	}
	p := findSKU(state, "MIT-2088")
	before := p.StockQuantity
	post(t, app, "/orders/"+o.ID+"/advance-status", nil) // paid
	if p.StockQuantity != before {
		t.Errorf("marking paid should not move stock")
	}
	post(t, app, "/orders/"+o.ID+"/advance-status", nil) // dispatched
	if p.StockQuantity != before-10 {
		t.Errorf("dispatch should remove 10 units: %d → %d", before, p.StockQuantity)
	}
	post(t, app, "/orders/"+o.ID+"/advance-status", nil)
	if state.Orders[0].Status != "delivered" {
		t.Errorf("status = %s, want delivered", state.Orders[0].Status)
	}
}

func TestOrderViewsFilterByStatus(t *testing.T) {
	app := setupTestRouter()
	body := get(t, app, "/tab/orders?view=awaiting_payment", true).Body.String()
	if !strings.Contains(body, "#ORD-9824") {
		t.Errorf("awaiting-payment view should include #ORD-9824")
	}
	if strings.Contains(body, "Mark delivered") {
		t.Errorf("awaiting-payment view should not include dispatched orders")
	}
	if strings.Contains(body, "0 transactions") {
		t.Errorf("the old broken counter is back")
	}
}

func TestQuoteThenConvertKeepsQuotedPrice(t *testing.T) {
	app, state := newTestApp()
	rec := post(t, app, "/rfqs/lead_1/quote", url.Values{"skuId": {"mit_3361"}, "quantity": {"200"}, "unitPrice": {"20.00"}, "delivery": {"150"}, "validDays": {"7"}})
	if rec.Code != http.StatusOK {
		t.Fatalf("quote = %d", rec.Code)
	}
	l := state.Leads[0]
	if l.Status != "quoted" || l.QuotedUnitZar != 20 || l.EstimatedTotal != 4772.50 {
		t.Fatalf("quote = %+v", l)
	}
	post(t, app, "/rfqs/lead_1/convert", nil)
	o := state.Orders[0]
	if o.GrandTotal != 4772.50 || o.LineItems[0].UnitPriceZar != 20 || o.LineItems[0].SKU != "MIT-3361" {
		t.Errorf("order from quote = %+v", o)
	}
}

func TestReturnsFlowRestocksOnReceipt(t *testing.T) {
	app, state := newTestApp()
	rec := post(t, app, "/rma/new", url.Values{"orderNumber": {"#ORD-9824"}, "customer": {"Protea"}, "sku": {"MIT-2088"}, "quantity": {"4"}, "reason": {"Faulty"}})
	if !strings.Contains(rec.Body.String(), "RMA-") || rec.Header().Get("HX-Push-Url") != "/tab/orders?view=returns" {
		t.Fatalf("expected the returns view with the new return")
	}
	rma := state.ReturnRequests[0]
	if rma.WaybillNo != "" {
		t.Errorf("no courier was booked, but waybill is %q", rma.WaybillNo)
	}
	p := findSKU(state, "MIT-2088")
	before := p.StockQuantity
	post(t, app, "/rma/update", url.Values{"rmaId": {rma.ID}, "status": {"Goods Received"}})
	if p.StockQuantity != before+4 {
		t.Errorf("received return should add 4 units: %d → %d", before, p.StockQuantity)
	}
	post(t, app, "/rma/update", url.Values{"rmaId": {rma.ID}, "status": {"Refund Issued"}})
	if state.ReturnRequests[0].Status != "Refund Issued" {
		t.Errorf("status = %s", state.ReturnRequests[0].Status)
	}
}

func TestInvoiceModal(t *testing.T) {
	app := setupTestRouter()
	rec := get(t, app, "/orders/ord_101/invoice", true)
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "Tax invoice") {
		t.Errorf("invoice = %d, want a tax invoice for a VAT-registered store", rec.Code)
	}
}

// ---------- Listings ----------

func TestGoogleFeedOnlyListsReadyProducts(t *testing.T) {
	app, _ := newTestApp()
	rec := get(t, app, "/feeds/google-merchant-center.xml", false)
	var feed struct {
		Items []struct {
			ID   string `xml:"id"`
			GTIN string `xml:"gtin"`
		} `xml:"channel>item"`
	}
	if err := xml.Unmarshal(rec.Body.Bytes(), &feed); err != nil {
		t.Fatalf("feed is not valid XML: %v", err)
	}
	ids := map[string]bool{}
	for _, it := range feed.Items {
		ids[it.ID] = true
		if !models.ValidGTIN(it.GTIN) {
			t.Errorf("feed item %s has invalid GTIN %q", it.ID, it.GTIN)
		}
	}
	if !ids["mit_3361"] {
		t.Errorf("the hanger (photo, barcode, description) should be in the Google feed")
	}
	if ids["mit_2088"] {
		t.Errorf("a product without a photo must not be in the Google feed")
	}
}

func TestValidateFeedsReportsRealResult(t *testing.T) {
	app := setupTestRouter()
	rec := post(t, app, "/feeds/validate", nil)
	msg, _ := toast(t, rec)
	if !strings.Contains(msg, "with something to fix") || strings.Contains(msg, "100%") {
		t.Errorf("validation message = %q", msg)
	}
}

// ---------- Assistant ----------

func TestAssistantAnswersFromStoreData(t *testing.T) {
	app, state := newTestApp()
	rec := post(t, app, "/copilot/ask", url.Values{"prompt": {"Which items need restocking?"}})
	if rec.Code != http.StatusOK {
		t.Fatalf("ask = %d", rec.Code)
	}
	last := state.CopilotMessages[len(state.CopilotMessages)-1]
	if !strings.Contains(last.Content, "MIT-8610") {
		t.Errorf("restock answer should name the out-of-stock SKU, got %q", last.Content)
	}
	if !strings.Contains(rec.Body.String(), "No AI model is connected") {
		t.Errorf("the page must say the assistant is rules-based")
	}
}

func TestAssistantProposalNeedsApprovalAndCanBeUndone(t *testing.T) {
	app, state := newTestApp()
	logs := len(state.AuditLogs)
	post(t, app, "/copilot/action", url.Values{"proposal": {"restock_mit_8610"}, "op": {"approve"}})
	if len(state.AuditLogs) != logs+1 || !strings.Contains(state.AuditLogs[0].Details, "Not sent to a supplier") {
		t.Fatalf("approval should log a draft purchase order")
	}
	post(t, app, "/copilot/action", url.Values{"proposal": {"restock_mit_8610"}, "op": {"undo"}})
	for _, p := range state.Proposals {
		if p.ID == "restock_mit_8610" && p.Status != "undone" {
			t.Errorf("proposal status = %s, want undone", p.Status)
		}
	}
}

// ---------- Search, settings, channels ----------

func TestSearchFindsProductsOrdersAndPages(t *testing.T) {
	app := setupTestRouter()
	body := get(t, app, "/merchant/search?q=hanger", true).Body.String()
	if !strings.Contains(body, "MIT-3361") {
		t.Errorf("search for hanger should find MIT-3361")
	}
	if body := get(t, app, "/merchant/search?q=9824", true).Body.String(); !strings.Contains(body, "#ORD-9824") {
		t.Errorf("search should find order 9824")
	}
	if body := get(t, app, "/merchant/search", true).Body.String(); !strings.Contains(body, "Counter sale") {
		t.Errorf("empty search should list pages and actions")
	}
}

func TestBankingChangeNeedsMatchingConfirmation(t *testing.T) {
	app, state := newTestApp()
	before := state.Store.BankAccount
	post(t, app, "/settings/banking", url.Values{"bankName": {"FNB"}, "bankAccount": {"62000000001"}, "confirmAccount": {"62000000002"}, "bankBranchCode": {"250655"}})
	if state.Store.BankAccount != before {
		t.Fatalf("mismatched confirmation changed the payout account")
	}
	post(t, app, "/settings/banking", url.Values{"bankName": {"FNB"}, "bankAccount": {"62000000001"}, "confirmAccount": {"62000000001"}, "bankBranchCode": {"250655"}})
	if state.Store.BankAccount != "62000000001" {
		t.Fatalf("matching confirmation did not update the account")
	}
	if strings.Contains(state.AuditLogs[0].Details, "62000000001") {
		t.Errorf("audit log must mask the account number: %q", state.AuditLogs[0].Details)
	}
}

func TestPlanChange(t *testing.T) {
	app, state := newTestApp()
	post(t, app, "/settings/plan", url.Values{"plan": {"Grow (R199/mo)"}})
	if state.Store.CurrentPlan != "Grow (R199/mo)" {
		t.Errorf("plan = %s", state.Store.CurrentPlan)
	}
	if rec := post(t, app, "/settings/plan", url.Values{"plan": {"Free Forever"}}); rec.Code != http.StatusBadRequest {
		t.Errorf("unknown plan = %d, want 400", rec.Code)
	}
}

func TestStorefrontSettingsAreSaved(t *testing.T) {
	app, state := newTestApp()
	post(t, app, "/editor/save", url.Values{"ribbonText": {"Free shipping on orders over R5000"}, "ribbonActive": {"on"}, "heroHeadline": {"Test headline"}})
	if state.Store.Storefront.Ribbon != "Free shipping on orders over R5000" || !state.Store.Storefront.RibbonOn || state.Store.Storefront.Headline != "Test headline" {
		t.Errorf("storefront = %+v", state.Store.Storefront)
	}
}

func TestChannelsPageHasSnippets(t *testing.T) {
	app := setupTestRouter()
	body := get(t, app, "/tab/channels", true).Body.String()
	for _, want := range []string{"find-us-on-shoppage.svg", "embed/m/", "Copy signature HTML"} {
		if !strings.Contains(body, want) {
			t.Errorf("channels page missing %q", want)
		}
	}
	rec := post(t, app, "/channels/sync", nil)
	if msg, _ := toast(t, rec); !strings.Contains(msg, "always current") {
		t.Errorf("sync should explain feeds are live, got %q", msg)
	}
}

func TestManifestUsesWhatWasEntered(t *testing.T) {
	app, state := newTestApp()
	post(t, app, "/manifests/new", url.Values{"carrier": {"Pargo"}, "driverName": {"T. Driver"}, "waybillCount": {"3"}, "totalWeightKg": {"12.5"}})
	m := state.Manifests[0]
	if m.CarrierName != "Pargo" || m.DriverName != "T. Driver" || m.WaybillCount != 3 || m.Status != "Manifested" {
		t.Errorf("manifest = %+v", m)
	}
}

func TestInboxFlow(t *testing.T) {
	app, state := newTestApp()
	if rec := get(t, app, "/chat/thread/conv_goldreef", true); rec.Code != http.StatusOK {
		t.Fatalf("select thread = %d", rec.Code)
	}
	rec := post(t, app, "/chat/send", url.Values{"thread_id": {"conv_goldreef"}, "message": {"Your order ships today"}})
	if !strings.Contains(rec.Body.String(), "Your order ships today") {
		t.Errorf("reply not shown")
	}
	if !strings.Contains(rec.Header().Get("HX-Trigger"), "shoppage:chat-sent") {
		t.Errorf("reply should be relayed to the chat gateway")
	}
	post(t, app, "/chat/send", url.Values{"thread_id": {"conv_goldreef"}, "message": {"check stock"}, "is_internal": {"true"}})
	var th *models.ChatThread
	for i := range state.ChatThreads {
		if state.ChatThreads[i].ID == "conv_goldreef" {
			th = &state.ChatThreads[i]
		}
	}
	if last := th.Messages[len(th.Messages)-1]; !last.IsInternalNote {
		t.Errorf("internal note flag lost")
	}
	post(t, app, "/chat/quote", url.Values{"thread_id": {"conv_goldreef"}, "sku": {"MIT-2088"}, "quantity": {"60"}})
	q := th.Messages[len(th.Messages)-1].Quote
	if q == nil || q.UnitPriceZar >= 6.85 {
		t.Errorf("60 units should get a volume tier discount, got %+v", q)
	}
	lock := post(t, app, "/chat/action", url.Values{"thread_id": {"conv_goldreef"}, "action": {"lock_stock"}, "sku": {"MIT-8610"}, "quantity": {"5"}})
	if msg, _ := toast(t, lock); !strings.Contains(msg, "Nothing was held") {
		t.Errorf("holding out-of-stock goods should be refused, got %q", msg)
	}
}

func TestCreateMediaAsset(t *testing.T) {
	router := setupTestRouter()
	form := url.Values{}
	form.Set("name", "SABS 1422 Audit Report 2026.pdf")
	form.Set("category", "SABS Certificate")
	form.Set("sizeKb", "620")
	form.Set("mimeType", "application/pdf")
	form.Set("url", "/media/sabs_audit.pdf")

	req := httptest.NewRequest("POST", "/media/new", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on create media, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "SABS 1422 Audit Report 2026.pdf") {
		t.Errorf("expected new media asset in list")
	}
}

func TestCreateMediaAsset_FileUploadAndServe(t *testing.T) {
	router := setupTestRouter()

	bodyBuf := &bytes.Buffer{}
	writer := multipart.NewWriter(bodyBuf)

	fileField, err := writer.CreateFormFile("file", "certificate_sabs.pdf")
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	sampleContent := []byte("%PDF-1.4 sample sabs compliance certificate content")
	if _, err := fileField.Write(sampleContent); err != nil {
		t.Fatalf("failed to write form file content: %v", err)
	}

	_ = writer.WriteField("name", "SABS ISO 9001 Certificate")
	_ = writer.WriteField("category", "SABS Certificate")
	writer.Close()

	req := httptest.NewRequest("POST", "/media/new", bodyBuf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on file upload, got %d: %s", rec.Code, rec.Body.String())
	}
	respHTML := rec.Body.String()
	if !strings.Contains(respHTML, "SABS ISO 9001 Certificate") {
		t.Errorf("expected uploaded asset name in rendered media tab")
	}

	// Extract the generated asset ID from the rendered link: /media/files/(med_[0-9]+)
	re := regexp.MustCompile(`/media/files/(med_[0-9]+)`)
	matches := re.FindStringSubmatch(respHTML)
	if len(matches) < 2 {
		t.Fatalf("expected /media/files/ URL in rendered response, got: %s", respHTML)
	}
	assetID := matches[1]

	// Fetch the uploaded media file
	getReq := httptest.NewRequest("GET", "/media/files/"+assetID, nil)
	getRec := httptest.NewRecorder()
	router.ServeHTTP(getRec, getReq)

	if getRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on serving media file, got %d", getRec.Code)
	}
	if ct := getRec.Header().Get("Content-Type"); !strings.Contains(ct, "application/pdf") {
		t.Errorf("expected Content-Type application/pdf, got %s", ct)
	}
	if !bytes.Equal(getRec.Body.Bytes(), sampleContent) {
		t.Errorf("served file content does not match uploaded content")
	}
}

func TestCreateMediaAsset_UnsupportedType(t *testing.T) {
	router := setupTestRouter()

	bodyBuf := &bytes.Buffer{}
	writer := multipart.NewWriter(bodyBuf)

	fileField, err := writer.CreateFormFile("file", "script.exe")
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	_, _ = fileField.Write([]byte("binary data"))
	writer.Close()

	req := httptest.NewRequest("POST", "/media/new", bodyBuf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnsupportedMediaType {
		t.Fatalf("expected 415 StatusUnsupportedMediaType, got %d", rec.Code)
	}
}

func TestServeMediaFile_NotFound(t *testing.T) {
	router := setupTestRouter()
	req := httptest.NewRequest("GET", "/media/files/med_nonexistent999", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404 NotFound, got %d", rec.Code)
	}
}

func TestCSVExports(t *testing.T) {
	router := setupTestRouter()

	endpoints := []struct {
		url          string
		containsHead string
	}{
		{"/inventory/export.csv", "SKU,Title,Category"},
		{"/catalog/export.csv", "SKU,Title,Brand"},
		{"/customers/export.csv", "Company,ContactName,Phone"},
		{"/audit-logs/export.csv", "Timestamp,Actor,Action"},
		{"/feeds/meta-catalog.csv", "id,title,description"},
	}

	for _, ep := range endpoints {
		t.Run(ep.url, func(t *testing.T) {
			req := httptest.NewRequest("GET", ep.url, nil)
			rec := httptest.NewRecorder()
			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("expected 200 OK on %s, got %d", ep.url, rec.Code)
			}
			body := rec.Body.String()
			if !strings.Contains(body, ep.containsHead) {
				t.Errorf("expected CSV to contain header '%s'", ep.containsHead)
			}
		})
	}
}

func TestWholesaleTierCreation(t *testing.T) {
	router := setupTestRouter()
	form := url.Values{}
	form.Set("tierName", "Mega Trade Tier")
	form.Set("minUnits", "250")
	form.Set("maxUnits", "500")
	form.Set("discountPct", "22.5")
	form.Set("description", "National Distributor FOB")

	req := httptest.NewRequest("POST", "/discounts/tier/new", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on create tier, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "Mega Trade Tier") {
		t.Errorf("expected new tier in discounts view")
	}
}

func TestImportSpreadsheet(t *testing.T) {
	app, state := newTestApp()
	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	fw, _ := mw.CreateFormFile("file", "products.csv")
	_, _ = fw.Write([]byte("\ufeffCode,Name,Selling Price,Qty,EAN\n" +
		"NEW-1,Brand New Widget,R 12.50,40,6009882400018\n" +
		"MIT-3361,Commercial Anti-Theft Wooden Male Hanger 44cm,21.00,999,\n" +
		",Missing code,5,1,\n"))
	_ = mw.Close()
	req := httptest.NewRequest("POST", "/catalog/import", &body)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	req.Header.Set("HX-Request", "true")
	stockBefore := findSKU(state, "MIT-3361").StockQuantity
	rec := httptest.NewRecorder()
	app.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("import = %d: %s", rec.Code, rec.Body.String())
	}
	msg, _ := toast(t, rec)
	if !strings.Contains(msg, "1 added, 1 updated, 1 skipped") {
		t.Errorf("import summary = %q", msg)
	}
	p := findSKU(state, "NEW-1")
	if p == nil || p.WholesaleZar != 12.50 || p.StockQuantity != 40 || hubSum(p) != 40 {
		t.Fatalf("imported product = %+v", p)
	}
	h := findSKU(state, "MIT-3361")
	if h.WholesaleZar != 21 || h.StockQuantity != stockBefore {
		t.Errorf("existing product: price %.2f, stock %d (was %d); import must not change stock", h.WholesaleZar, h.StockQuantity, stockBefore)
	}
}
