package templates

import (
	"context"
	"io"

	"github.com/shoppage/merchant-os/internal/models"
)

// RenderDashboard writes the full HTML dashboard using compiled templ
func RenderDashboard(w io.Writer, data models.DashboardViewData) error {
	return DashboardPage(data).Render(context.Background(), w)
}

// RenderTabPartial renders individual tab contents for HTMX swap using compiled templ
func RenderTabPartial(w io.Writer, tabName string, data models.DashboardViewData) error {
	return TabPartialComponent(tabName, data).Render(context.Background(), w)
}

// RenderStockButton returns the updated toggle button snippet using compiled templ
func RenderStockButton(w io.Writer, sku models.CatalogSKU) error {
	return StockButtonComponent(sku).Render(context.Background(), w)
}

// RenderProductDetailView renders the Pemofy-style product detail view partial
func RenderProductDetailView(w io.Writer, sku models.CatalogSKU) error {
	return ProductDetailView(sku).Render(context.Background(), w)
}

// RenderProductDetailPage renders the full product detail page
func RenderProductDetailPage(w io.Writer, store models.StoreProfile, sku models.CatalogSKU, nav models.NavContext) error {
	return ProductDetailPage(store, sku, nav).Render(context.Background(), w)
}

// RenderProductEditView renders the Pemofy-style 5-tab product editor view partial
func RenderProductEditView(w io.Writer, sku models.CatalogSKU, isNew bool) error {
	return ProductEditView(sku, isNew).Render(context.Background(), w)
}

// RenderProductEditPage renders the full product editor page
func RenderProductEditPage(w io.Writer, store models.StoreProfile, sku models.CatalogSKU, isNew bool, nav models.NavContext) error {
	return ProductEditPage(store, sku, isNew, nav).Render(context.Background(), w)
}

// RenderProductDetail renders the product detail view using compiled templ (legacy alias)
func RenderProductDetail(w io.Writer, sku models.CatalogSKU) error {
	return ProductDetailView(sku).Render(context.Background(), w)
}

// RenderProductEdit renders the 5-tab product editor view using compiled templ (legacy alias)
func RenderProductEdit(w io.Writer, sku models.CatalogSKU) error {
	return ProductEditView(sku, false).Render(context.Background(), w)
}

// RenderProformaInvoice renders the South African tax proforma invoice modal using compiled templ
func RenderProformaInvoice(w io.Writer, store models.StoreProfile, order models.ProformaOrder) error {
	return ProformaInvoiceModal(store, order).Render(context.Background(), w)
}
