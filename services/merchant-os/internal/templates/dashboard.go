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

// RenderProductDetail renders the product detail modal using compiled templ
func RenderProductDetail(w io.Writer, sku models.CatalogSKU) error {
	return ProductDetailModal(sku).Render(context.Background(), w)
}

// RenderProductEdit renders the 5-tab product editor modal using compiled templ
func RenderProductEdit(w io.Writer, sku models.CatalogSKU) error {
	return ProductEditModal(sku).Render(context.Background(), w)
}

// RenderProformaInvoice renders the South African tax proforma invoice modal using compiled templ
func RenderProformaInvoice(w io.Writer, store models.StoreProfile, order models.ProformaOrder) error {
	return ProformaInvoiceModal(store, order).Render(context.Background(), w)
}
