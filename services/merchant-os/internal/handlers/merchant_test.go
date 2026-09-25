package handlers_test

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/url"
	"regexp"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/shoppage/merchant-os/internal/handlers"
)

func setupTestRouter() http.Handler {
	state := handlers.NewDefaultState()
	h := handlers.NewHandler(state)

	r := chi.NewRouter()
	r.Get("/", h.ServeDashboard)
	r.Get("/tab/{tab}", h.ServeTab)
	r.Get("/catalog/export.csv", h.ExportCatalogCSV)
	r.Get("/catalog/new", h.ServeProductNew)
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
	r.Get("/chat/thread/{id}", h.SelectChatThread)
	r.Post("/chat/send", h.SendChatMessage)
	r.Post("/chat/quote", h.SendStructuredQuote)
	r.Post("/chat/action", h.HandleChatAction)
	r.Post("/feeds/validate", h.ValidateFeeds)
	r.Post("/rma/update", h.UpdateRMAStatus)
	r.Post("/rma/new", h.CreateRMARequest)
	return r
}

func TestServeDashboard(t *testing.T) {
	router := setupTestRouter()
	req := httptest.NewRequest("GET", "/", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "Mitrend Products (Pty) Ltd") {
		t.Errorf("expected dashboard HTML to contain store name")
	}
	if !strings.Contains(body, "Overview & Velocity") && !strings.Contains(body, "Overview &amp; Velocity") {
		t.Errorf("expected dashboard HTML to contain Overview tab")
	}
	if !strings.Contains(body, "Item Ledger Entries (ILE)") {
		t.Errorf("expected dashboard HTML to contain Item Ledger Entries (ILE)")
	}
}

func TestServeAllERPModules(t *testing.T) {
	router := setupTestRouter()

	tabs := []struct {
		tab      string
		contains string
	}{
		{"overview", "Free GMV Threshold Meter"},
		{"catalog", "Published Products"},
		{"orders", "B2B Proforma Orders Ledger"},
		{"chat", "Direct Messages & Buyer Chat Desk"},
		{"inventory", "Inventory & Multi-Warehouse Hubs"},
		{"customers", "B2B Customers & Commercial Accounts CRM"},
		{"rfqs", "Live Trade RFQ & Negotiation Desk"},
		{"analytics", "Analytics & Commercial GMV Funnel"},
		{"discounts", "Wholesale Tier Pricing & Promotional Discounts"},
		{"channels", "Omnichannel Commerce & WhatsApp Trade Desks"},
		{"feeds", "Google Merchant Center & Meta Feeds"},
		{"copilot", "Pemofy AI Copilot Studio"},
		{"settings", "Store Settings, Banking & Sovereign Cloud Pod"},
		{"pick-pack", "Pick & Pack Warehouse Station"},
		{"manifests", "Carrier Shipping Manifests & Waybill Dispatch"},
		{"transfers", "Inter-Hub Stock Transfers & Regional Logistics"},
		{"scan", "Barcode Scanner Station & Cycle Count Audits"},
		{"pos", "Trade Counter POS Terminal & Walk-In Sales"},
		{"flow", "Flow Automations & Event-Driven Rules"},
		{"media", "Media & Documents"},
		{"audit-logs", "Compliance & Operational Audit Trail"},
		{"editor", "Storefront Theme Studio & Visual Customizer"},
	}

	for _, tc := range tabs {
		t.Run(tc.tab, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/tab/"+tc.tab, nil)
			rec := httptest.NewRecorder()
			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("expected 200 OK for tab %s, got %d", tc.tab, rec.Code)
			}
			body := rec.Body.String()
			cleanContains := strings.ReplaceAll(tc.contains, "&", "&amp;")
			if !strings.Contains(body, tc.contains) && !strings.Contains(body, cleanContains) {
				t.Errorf("expected tab %s to contain '%s'", tc.tab, tc.contains)
			}
		})
	}
}

func TestServeTabRefreshVsHTMX(t *testing.T) {
	router := setupTestRouter()

	// 1. Direct browser request / F5 refresh (no HX-Request header)
	reqDirect := httptest.NewRequest("GET", "/tab/overview", nil)
	recDirect := httptest.NewRecorder()
	router.ServeHTTP(recDirect, reqDirect)

	if recDirect.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", recDirect.Code)
	}
	bodyDirect := recDirect.Body.String()
	if !strings.Contains(strings.ToLower(bodyDirect), "<!doctype html>") {
		t.Errorf("expected direct /tab/overview request to render full <!doctype html> layout shell")
	}
	if !strings.Contains(bodyDirect, "Shoppage Merchant OS") {
		t.Errorf("expected direct /tab/overview request to contain page title")
	}
	if !strings.Contains(bodyDirect, "--primary: #0e7c56;") {
		t.Errorf("expected direct /tab/overview request to include inline styling")
	}

	// 2. HTMX partial request (with HX-Request: true header)
	reqHTMX := httptest.NewRequest("GET", "/tab/overview", nil)
	reqHTMX.Header.Set("HX-Request", "true")
	recHTMX := httptest.NewRecorder()
	router.ServeHTTP(recHTMX, reqHTMX)

	if recHTMX.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", recHTMX.Code)
	}
	bodyHTMX := recHTMX.Body.String()
	if strings.Contains(strings.ToLower(bodyHTMX), "<!doctype html>") {
		t.Errorf("expected HTMX /tab/overview request to return only partial snippet, not <!doctype html>")
	}
	if !strings.Contains(bodyHTMX, "Free GMV Threshold Meter") {
		t.Errorf("expected HTMX /tab/overview request to return tab content snippet")
	}
}

func TestProductDetailAndEditModals(t *testing.T) {
	router := setupTestRouter()

	// Detail Modal (Pemofy design)
	req := httptest.NewRequest("GET", "/catalog/mit_3361", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for product detail modal, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "Commercial Anti-Theft Wooden Male Hanger 44cm") {
		t.Errorf("expected detail modal to contain product title")
	}
	if !strings.Contains(body, "gallery-card") || !strings.Contains(body, "info-card") {
		t.Errorf("expected detail modal to contain Pemofy gallery-card and info-card")
	}
	if !strings.Contains(body, "score-ring") {
		t.Errorf("expected detail modal to contain Pemofy SEO score-ring")
	}
	if !strings.Contains(body, "Product information") || !strings.Contains(body, "Recent activity") {
		t.Errorf("expected detail modal to contain Pemofy specifications and activity panels")
	}

	// Edit Modal (Pemofy 5-tab design)
	reqEdit := httptest.NewRequest("GET", "/catalog/mit_3361/edit", nil)
	recEdit := httptest.NewRecorder()
	router.ServeHTTP(recEdit, reqEdit)

	if recEdit.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for product edit modal, got %d", recEdit.Code)
	}
	editBody := recEdit.Body.String()
	if !strings.Contains(editBody, "Edit: Commercial Anti-Theft Wooden Male Hanger 44cm") {
		t.Errorf("expected edit modal to contain edit title")
	}
	if !strings.Contains(editBody, "editor-tabs") {
		t.Errorf("expected edit modal to contain Pemofy editor-tabs")
	}
	if !strings.Contains(editBody, "tab-pane-general") || !strings.Contains(editBody, "tab-pane-inventory") || !strings.Contains(editBody, "tab-pane-variants") {
		t.Errorf("expected edit modal to contain tab panes for general, inventory, and variants")
	}
	if !strings.Contains(editBody, "publish-card") || !strings.Contains(editBody, "side-form") {
		t.Errorf("expected edit modal to contain Pemofy side-form and publish-card")
	}

	// Save Edit Verification
	editForm := url.Values{}
	editForm.Set("title", "Commercial Anti-Theft Wooden Male Hanger 44cm (Updated)")
	editForm.Set("brand", "Mitrend Premium")
	editForm.Set("category", "Hospitality Supplies")
	editForm.Set("wholesaleZar", "45.00")
	editForm.Set("retailZar", "65.00")
	editForm.Set("stockQuantity", "950")
	editForm.Set("lowStockAlert", "80")
	editForm.Set("description", "Updated heavy gauge beech wood anti-theft coat hanger.")
	editForm.Set("material", "Solid Beechwood")
	editForm.Set("hsCode", "4421.10")

	reqPost := httptest.NewRequest("POST", "/catalog/mit_3361/edit", strings.NewReader(editForm.Encode()))
	reqPost.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	recPost := httptest.NewRecorder()
	router.ServeHTTP(recPost, reqPost)

	if recPost.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for save product edit, got %d", recPost.Code)
	}
	postBody := recPost.Body.String()
	if !strings.Contains(postBody, "Commercial Anti-Theft Wooden Male Hanger 44cm (Updated)") {
		t.Errorf("expected saved catalog to contain updated title")
	}
}

func TestInvoiceModal(t *testing.T) {
	router := setupTestRouter()
	req := httptest.NewRequest("GET", "/orders/ord_101/invoice", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for invoice modal, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "Official B2B Proforma Tax Invoice") {
		t.Errorf("expected invoice modal to contain tax proforma badge")
	}
	if !strings.Contains(body, "#ORD-9824") {
		t.Errorf("expected invoice modal to contain order number")
	}
	if !strings.Contains(body, "SARS VAT (15%)") {
		t.Errorf("expected invoice modal to contain 15%% VAT")
	}
}

func TestInventoryAdjustment(t *testing.T) {
	router := setupTestRouter()
	form := url.Values{}
	form.Set("adjustment", "25")

	req := httptest.NewRequest("POST", "/inventory/mit_3361/adjust", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on inventory adjust, got %d", rec.Code)
	}
	body := rec.Body.String()
	// 450 + 25 = 475 units
	if !strings.Contains(body, "475 units") {
		t.Errorf("expected stock count to be 475 units after +25 intake")
	}
}

func TestCopilotAsk(t *testing.T) {
	router := setupTestRouter()
	form := url.Values{}
	form.Set("prompt", "What is my margin on wooden hangers?")

	req := httptest.NewRequest("POST", "/copilot/ask", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on copilot ask, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "What is my margin on wooden hangers?") {
		t.Errorf("expected user prompt in conversation stream")
	}
	if !strings.Contains(body, "Pemofy Copilot") {
		t.Errorf("expected AI copilot reply in stream")
	}
}

func TestConvertRFQ(t *testing.T) {
	router := setupTestRouter()
	req := httptest.NewRequest("POST", "/rfqs/lead_1/convert", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on convert RFQ, got %d", rec.Code)
	}
}

func TestToggleStock(t *testing.T) {
	router := setupTestRouter()
	req := httptest.NewRequest("POST", "/catalog/mit_3361/toggle-stock", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on stock toggle, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "Out of Stock") {
		t.Errorf("expected button to show Out of Stock after toggle, got: %s", body)
	}
}

func TestServeGMCFeed(t *testing.T) {
	router := setupTestRouter()
	req := httptest.NewRequest("GET", "/feeds/google-merchant-center.xml", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on GMC feed, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "xmlns:g=\"http://base.google.com/ns/1.0\"") {
		t.Errorf("expected GMC namespace in feed")
	}
	if !strings.Contains(body, "<g:price>") {
		t.Errorf("expected price tags in GMC feed")
	}
	if !strings.Contains(body, "<g:link>") || !strings.Contains(body, "<g:image_link>") {
		t.Errorf("expected link and image_link tags in GMC feed")
	}
	if !strings.Contains(body, "<g:gtin>") {
		t.Errorf("expected GTIN/EAN-13 tags in GMC feed")
	}
	if !strings.Contains(body, "<g:shipping>") || !strings.Contains(body, "<g:country>ZA</g:country>") {
		t.Errorf("expected South African regional shipping tags in GMC feed")
	}
	if !strings.Contains(body, "<g:condition>new</g:condition>") {
		t.Errorf("expected condition tag in GMC feed")
	}
}

func TestCreateTransfer(t *testing.T) {
	router := setupTestRouter()
	form := url.Values{}
	form.Set("sourceHub", "Midrand Central Hub")
	form.Set("destHub", "Cape Town Depot")
	form.Set("skuId", "mit_3361")
	form.Set("quantity", "75")
	form.Set("carrier", "Road Freight Express")

	req := httptest.NewRequest("POST", "/transfers/new", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on create transfer, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "Cape Town Depot") {
		t.Errorf("expected transfer partial to contain destination hub")
	}
	if !strings.Contains(body, "75") {
		t.Errorf("expected transfer quantity in response")
	}
}

func TestPOSCheckout(t *testing.T) {
	router := setupTestRouter()
	form := url.Values{}
	form.Set("customer", "Radisson Red Hotel V&A")
	form.Set("paymentMethod", "Capitec Pay QR")

	req := httptest.NewRequest("POST", "/pos/checkout", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on pos checkout, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "Radisson Red Hotel V&A") && !strings.Contains(body, "Radisson Red Hotel V&amp;A") {
		t.Errorf("expected POS partial to contain customer name")
	}
}

func TestToggleFlowRule(t *testing.T) {
	router := setupTestRouter()
	req := httptest.NewRequest("POST", "/flow/flow_1/toggle", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on toggle flow, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "Flow Automations") {
		t.Errorf("expected flow automations partial")
	}
}

func TestGenerateManifest(t *testing.T) {
	router := setupTestRouter()
	req := httptest.NewRequest("POST", "/manifests/new", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on generate manifest, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "The Courier Guy Road Freight") {
		t.Errorf("expected manifest to contain carrier name")
	}
}

func TestReceiveTransfer(t *testing.T) {
	router := setupTestRouter()
	req := httptest.NewRequest("POST", "/transfers/tr_8821/receive", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on receive transfer, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "Received") {
		t.Errorf("expected transfer status to be Received")
	}
}

func TestReconcileScan(t *testing.T) {
	router := setupTestRouter()
	form := url.Values{}
	form.Set("skuId", "mit_3361")
	form.Set("physicalCount", "452")

	req := httptest.NewRequest("POST", "/scan/reconcile", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on scan reconcile, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "452") {
		t.Errorf("expected updated physical count in scan partial")
	}
}

func TestCreateFlowRule(t *testing.T) {
	router := setupTestRouter()
	form := url.Values{}
	form.Set("name", "Alert on Big Orders")
	form.Set("trigger", "Order Total > R10,000")
	form.Set("condition", "All Warehouses")
	form.Set("action", "Send WhatsApp to Sipho")

	req := httptest.NewRequest("POST", "/flow/new", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on create flow rule, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "Alert on Big Orders") {
		t.Errorf("expected new flow rule name in stream")
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

func TestSaveEditorSettings(t *testing.T) {
	router := setupTestRouter()
	form := url.Values{}
	form.Set("ribbonText", "Free shipping on orders over R5000")

	req := httptest.NewRequest("POST", "/editor/save", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on save editor, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "Storefront Theme Studio") {
		t.Errorf("expected theme studio partial")
	}
}

func TestStockIntakeAndILE(t *testing.T) {
	router := setupTestRouter()
	form := url.Values{}
	form.Set("skuId", "mit_3361")
	form.Set("hubName", "MIDRAND-01")
	form.Set("reason", "Purchase Order Inward")
	form.Set("bin", "Bay 4, Shelf B-02")
	form.Set("quantity", "100")
	form.Set("batchRef", "PO-2026-TEST")

	req := httptest.NewRequest("POST", "/inventory/intake", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on stock intake, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "Inventory & Multi-Warehouse Hubs") && !strings.Contains(body, "Inventory &amp; Multi-Warehouse Hubs") {
		t.Errorf("expected inventory tab returned after intake")
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

func TestChannelSyncAndSettings(t *testing.T) {
	router := setupTestRouter()

	// Sync
	reqSync := httptest.NewRequest("POST", "/channels/sync", nil)
	recSync := httptest.NewRecorder()
	router.ServeHTTP(recSync, reqSync)

	if recSync.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on channel sync, got %d", recSync.Code)
	}
	bodySync := recSync.Body.String()
	if !strings.Contains(bodySync, "Omnichannel Commerce") {
		t.Errorf("expected channels tab on sync")
	}

	// Settings
	form := url.Values{}
	form.Set("autoQuotes", "on")
	reqSet := httptest.NewRequest("POST", "/channels/settings", strings.NewReader(form.Encode()))
	reqSet.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	recSet := httptest.NewRecorder()
	router.ServeHTTP(recSet, reqSet)

	if recSet.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on save channel settings, got %d", recSet.Code)
	}
}

func TestFeedDiagnostics(t *testing.T) {
	router := setupTestRouter()
	req := httptest.NewRequest("POST", "/feeds/validate", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on feed diagnostics, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "Google Merchant Center") {
		t.Errorf("expected feeds view on validate")
	}
}

func TestCopilotActionAndPlanUpdate(t *testing.T) {
	router := setupTestRouter()

	// Copilot Action
	formCop := url.Values{}
	formCop.Set("action", "restock")
	reqCop := httptest.NewRequest("POST", "/copilot/action", strings.NewReader(formCop.Encode()))
	reqCop.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	recCop := httptest.NewRecorder()
	router.ServeHTTP(recCop, reqCop)

	if recCop.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on copilot action, got %d", recCop.Code)
	}

	// Plan update
	formPlan := url.Values{}
	formPlan.Set("plan", "Grow (R199/mo)")
	reqPlan := httptest.NewRequest("POST", "/settings/plan", strings.NewReader(formPlan.Encode()))
	reqPlan.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	recPlan := httptest.NewRecorder()
	router.ServeHTTP(recPlan, reqPlan)

	if recPlan.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on plan update, got %d", recPlan.Code)
	}
}

func TestDirectMessagesAndChat(t *testing.T) {
	router := setupTestRouter()

	// 1. Test Select Thread
	reqThread := httptest.NewRequest("GET", "/chat/thread/conv_goldreef", nil)
	recThread := httptest.NewRecorder()
	router.ServeHTTP(recThread, reqThread)

	if recThread.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on select chat thread, got %d", recThread.Code)
	}
	bodyThread := recThread.Body.String()
	if !strings.Contains(bodyThread, "Gold Reef City Casino &amp; Hotel") && !strings.Contains(bodyThread, "Gold Reef City Casino & Hotel") {
		t.Errorf("expected selected thread to contain Gold Reef City")
	}

	// 2. Test Send Chat Message
	formMsg := url.Values{}
	formMsg.Set("thread_id", "conv_goldreef")
	formMsg.Set("message", "Waybill tracking reference generated via The Courier Guy: TCG-2026-9921.")
	reqMsg := httptest.NewRequest("POST", "/chat/send", strings.NewReader(formMsg.Encode()))
	reqMsg.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	recMsg := httptest.NewRecorder()
	router.ServeHTTP(recMsg, reqMsg)

	if recMsg.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on send chat message, got %d", recMsg.Code)
	}
	bodyMsg := recMsg.Body.String()
	if !strings.Contains(bodyMsg, "TCG-2026-9921") {
		t.Errorf("expected chat stream to contain dispatched message")
	}

	// 3. Test Send Structured Quote
	formQuote := url.Values{}
	formQuote.Set("thread_id", "conv_goldreef")
	formQuote.Set("sku", "MIT-2088")
	formQuote.Set("quantity", "300")
	formQuote.Set("discount_tier", "10")
	reqQuote := httptest.NewRequest("POST", "/chat/quote", strings.NewReader(formQuote.Encode()))
	reqQuote.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	recQuote := httptest.NewRecorder()
	router.ServeHTTP(recQuote, reqQuote)

	if recQuote.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on send structured quote, got %d", recQuote.Code)
	}
	bodyQuote := recQuote.Body.String()
	if !strings.Contains(bodyQuote, "QUO-2026-") {
		t.Errorf("expected chat stream to contain generated quote card")
	}
}

func TestSidebarCollapseAndActiveHighlight(t *testing.T) {
	router := setupTestRouter()

	req := httptest.NewRequest("GET", "/tab/overview", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on full dashboard layout, got %d", rec.Code)
	}

	body := rec.Body.String()
	if !strings.Contains(body, "id=\"sidebar-toggle-btn\"") {
		t.Errorf("expected layout to contain #sidebar-toggle-btn in LeftSidebar brand header")
	}
	if !strings.Contains(body, "merchant_sidebar_collapsed") {
		t.Errorf("expected layout to contain merchant_sidebar_collapsed localStorage persistence")
	}
	if !strings.Contains(body, "toggleMerchantSidebar") {
		t.Errorf("expected layout to contain toggleMerchantSidebar function")
	}
	if !strings.Contains(body, "syncActiveTabHighlight") {
		t.Errorf("expected layout to contain syncActiveTabHighlight function")
	}
	if !strings.Contains(body, ".thread-item.active-thread") {
		t.Errorf("expected layout to contain .thread-item.active-thread CSS style")
	}
}

func TestPemofyProductViews(t *testing.T) {
	router := setupTestRouter()

	// 1. Test Product Detail HTMX view
	reqDetailHX := httptest.NewRequest("GET", "/catalog/mit_3361", nil)
	reqDetailHX.Header.Set("HX-Request", "true")
	recDetailHX := httptest.NewRecorder()
	router.ServeHTTP(recDetailHX, reqDetailHX)

	if recDetailHX.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for detail HTMX view, got %d", recDetailHX.Code)
	}
	bodyDetailHX := recDetailHX.Body.String()
	if strings.Contains(bodyDetailHX, "modal-card") {
		t.Errorf("expected detail view to NOT be wrapped in modal-card popup")
	}
	if !strings.Contains(bodyDetailHX, "data-view=\"detail\"") {
		t.Errorf("expected detail view to have data-view=\"detail\"")
	}
	if !strings.Contains(bodyDetailHX, "← Back to products") {
		t.Errorf("expected detail view to have ← Back to products")
	}

	// 2. Test Product Edit HTMX view
	reqEditHX := httptest.NewRequest("GET", "/catalog/mit_3361/edit", nil)
	reqEditHX.Header.Set("HX-Request", "true")
	recEditHX := httptest.NewRecorder()
	router.ServeHTTP(recEditHX, reqEditHX)

	if recEditHX.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for edit HTMX view, got %d", recEditHX.Code)
	}
	bodyEditHX := recEditHX.Body.String()
	if strings.Contains(bodyEditHX, "modal-card") {
		t.Errorf("expected edit view to NOT be wrapped in modal-card popup")
	}
	if !strings.Contains(bodyEditHX, "data-view=\"edit\"") {
		t.Errorf("expected edit view to have data-view=\"edit\"")
	}
	if !strings.Contains(bodyEditHX, "editor-tabs") {
		t.Errorf("expected edit view to have editor-tabs")
	}

	// 3. Test Add Product New HTMX view
	reqNewHX := httptest.NewRequest("GET", "/catalog/new", nil)
	reqNewHX.Header.Set("HX-Request", "true")
	recNewHX := httptest.NewRecorder()
	router.ServeHTTP(recNewHX, reqNewHX)

	if recNewHX.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for new product HTMX view, got %d", recNewHX.Code)
	}
	bodyNewHX := recNewHX.Body.String()
	if strings.Contains(bodyNewHX, "modal-card") {
		t.Errorf("expected new product view to NOT be wrapped in modal-card popup")
	}
	if !strings.Contains(bodyNewHX, "Add product") {
		t.Errorf("expected new product view to have Add product header")
	}

	// 4. Test Product Detail direct browser page load
	reqDetailFull := httptest.NewRequest("GET", "/catalog/mit_3361", nil)
	recDetailFull := httptest.NewRecorder()
	router.ServeHTTP(recDetailFull, reqDetailFull)

	if recDetailFull.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for full page load, got %d", recDetailFull.Code)
	}
	bodyDetailFull := recDetailFull.Body.String()
	if !strings.Contains(bodyDetailFull, "Shoppage Merchant OS") {
		t.Errorf("expected full page layout on direct browser request")
	}
}

func TestSlackTeamsChatWorkstation(t *testing.T) {
	router := setupTestRouter()

	// 1. Verify /tab/chat renders Slack/Teams channel header, internal whispers, and block cards
	req := httptest.NewRequest("GET", "/tab/chat", nil)
	req.Header.Set("HX-Request", "true")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for /tab/chat, got %d", rec.Code)
	}
	body := rec.Body.String()

	expectedSnippets := []string{
		"Direct Messages &amp; Buyer Chat Desk",
		"Active Trade Channels",
		"RFQ #1042",
		"INTERNAL TEAM NOTE",
		"Staff Only (Hidden from Buyer)",
		"Midrand Hub Warehouse",
		"Stock Lock active",
		"tab-mode-internal",
		"tab-mode-buyer",
		"Post Whisper 🔒",
	}

	for _, s := range expectedSnippets {
		if !strings.Contains(body, s) {
			t.Errorf("expected /tab/chat to contain %q", s)
		}
	}

	// 2. Post an internal staff whisper
	whisperForm := url.Values{}
	whisperForm.Set("thread_id", "conv_protea")
	whisperForm.Set("message", "Midrand Bay 4: Reserve an additional 50 units for Protea Hotel VIP suite annex.")
	whisperForm.Set("is_internal", "true")

	reqWhisper := httptest.NewRequest("POST", "/chat/send", strings.NewReader(whisperForm.Encode()))
	reqWhisper.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	reqWhisper.Header.Set("HX-Request", "true")
	recWhisper := httptest.NewRecorder()
	router.ServeHTTP(recWhisper, reqWhisper)

	if recWhisper.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for posting whisper, got %d", recWhisper.Code)
	}
	bodyWhisper := recWhisper.Body.String()
	if !strings.Contains(bodyWhisper, "Midrand Bay 4: Reserve an additional 50 units") {
		t.Errorf("expected whisper message in chat stream")
	}
	if !strings.Contains(bodyWhisper, "Staff Whisper") {
		t.Errorf("expected Staff Whisper sender badge")
	}

	// 3. Trigger Block Kit action: Lock Stock
	stockForm := url.Values{}
	stockForm.Set("thread_id", "conv_protea")
	stockForm.Set("action", "lock_stock")
	stockForm.Set("sku", "MIT-3361")
	stockForm.Set("quantity", "150")

	reqStock := httptest.NewRequest("POST", "/chat/action", strings.NewReader(stockForm.Encode()))
	reqStock.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	reqStock.Header.Set("HX-Request", "true")
	recStock := httptest.NewRecorder()
	router.ServeHTTP(recStock, reqStock)

	if recStock.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for locking stock, got %d", recStock.Code)
	}
	bodyStock := recStock.Body.String()
	if !strings.Contains(bodyStock, "LCK-MID-") {
		t.Errorf("expected new stock lock ID in response")
	}

	// 4. Trigger Block Kit action: Verify POP in conv_goldreef
	popForm := url.Values{}
	popForm.Set("thread_id", "conv_goldreef")
	popForm.Set("action", "verify_pop")

	reqPOP := httptest.NewRequest("POST", "/chat/action", strings.NewReader(popForm.Encode()))
	reqPOP.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	reqPOP.Header.Set("HX-Request", "true")
	recPOP := httptest.NewRecorder()
	router.ServeHTTP(recPOP, reqPOP)

	if recPOP.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for verifying POP, got %d", recPOP.Code)
	}
	bodyPOP := recPOP.Body.String()
	if !strings.Contains(bodyPOP, "Paid &amp; Dispatched") && !strings.Contains(bodyPOP, "Paid & Dispatched") {
		t.Errorf("expected deal status to be updated to Paid & Dispatched")
	}
}

func TestRMAWorkflow(t *testing.T) {
	router := setupTestRouter()

	// 1. Create new RMA request via POST /rma/new
	form := url.Values{}
	form.Set("orderNumber", "ORD-2026-9911")
	form.Set("customerName", "Sandton Convention Centre")
	form.Set("itemTitle", "Solid Beechwood Coat Hangers")
	form.Set("sku", "MIT-3361")
	form.Set("quantity", "10")
	form.Set("reason", "Damaged during freight transport")
	form.Set("refundAmount", "450.00")

	reqNew := httptest.NewRequest("POST", "/rma/new", strings.NewReader(form.Encode()))
	reqNew.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	reqNew.Header.Set("HX-Request", "true")
	recNew := httptest.NewRecorder()
	router.ServeHTTP(recNew, reqNew)

	if recNew.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on create RMA, got %d", recNew.Code)
	}
	bodyNew := recNew.Body.String()
	if !strings.Contains(bodyNew, "Sandton Convention Centre") {
		t.Errorf("expected new RMA row to contain customer name")
	}
	if !strings.Contains(bodyNew, "RMA-2026-") {
		t.Errorf("expected RMA number prefix in generated row")
	}
	if !strings.Contains(bodyNew, "Authorized") {
		t.Errorf("expected initial status to be Authorized")
	}
	if !strings.Contains(bodyNew, "450.00") {
		t.Errorf("expected refund amount in table")
	}

	// 2. Advance RMA status to "Goods Received"
	formUpdate1 := url.Values{}
	formUpdate1.Set("rmaId", "RMA-2026-0814")
	formUpdate1.Set("newStatus", "Goods Received")

	reqUp1 := httptest.NewRequest("POST", "/rma/update", strings.NewReader(formUpdate1.Encode()))
	reqUp1.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	reqUp1.Header.Set("HX-Request", "true")
	recUp1 := httptest.NewRecorder()
	router.ServeHTTP(recUp1, reqUp1)

	if recUp1.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on advance RMA to Goods Received, got %d", recUp1.Code)
	}
	bodyUp1 := recUp1.Body.String()
	if !strings.Contains(bodyUp1, "Goods Received") {
		t.Errorf("expected RMA table to reflect Goods Received status")
	}

	// 3. Finalize RMA with "Refund Issued"
	formUpdate2 := url.Values{}
	formUpdate2.Set("rmaId", "RMA-2026-0814")
	formUpdate2.Set("newStatus", "Refund Issued")

	reqUp2 := httptest.NewRequest("POST", "/rma/update", strings.NewReader(formUpdate2.Encode()))
	reqUp2.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	reqUp2.Header.Set("HX-Request", "true")
	recUp2 := httptest.NewRecorder()
	router.ServeHTTP(recUp2, reqUp2)

	if recUp2.Code != http.StatusOK {
		t.Fatalf("expected 200 OK on advance RMA to Refund Issued, got %d", recUp2.Code)
	}
	bodyUp2 := recUp2.Body.String()
	if !strings.Contains(bodyUp2, "Refund Issued") {
		t.Errorf("expected RMA table to reflect Refund Issued status")
	}
}

func TestChannelsWebsiteAndEmailHub(t *testing.T) {
	router := setupTestRouter()
	req := httptest.NewRequest("GET", "/tab/channels", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for channels tab, got %d", rec.Code)
	}

	body := rec.Body.String()
	if !strings.Contains(body, "Website &amp; Corporate Email Integration Hub") && !strings.Contains(body, "Website & Corporate Email Integration Hub") {
		t.Errorf("expected channels tab to contain Website & Corporate Email Integration Hub")
	}
	if !strings.Contains(body, "find-us-on-shoppage.svg") {
		t.Errorf("expected channels tab to contain find-us-on-shoppage.svg badge")
	}
	if !strings.Contains(body, "order-on-shoppage.svg") {
		t.Errorf("expected channels tab to contain order-on-shoppage.svg badge")
	}
	if !strings.Contains(body, "verified-merchant.svg") {
		t.Errorf("expected channels tab to contain verified-merchant.svg badge")
	}
	if !strings.Contains(body, "shoppage-icon.svg") {
		t.Errorf("expected channels tab to contain shoppage-icon.svg badge")
	}
	if !strings.Contains(body, "Corporate Email Signature Snippet") {
		t.Errorf("expected channels tab to contain Corporate Email Signature Snippet")
	}
	if !strings.Contains(body, "Embed Live Catalog on Your Website") {
		t.Errorf("expected channels tab to contain Embed Live Catalog on Your Website")
	}
	if !strings.Contains(body, "<iframe src=") {
		t.Errorf("expected channels tab to contain iframe embed code snippet")
	}
}
