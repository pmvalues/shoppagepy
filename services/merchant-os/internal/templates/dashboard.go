package templates

import (
	"context"
	"io"

	"github.com/a-h/templ"
	"github.com/shoppage/merchant-os/internal/models"
)

// RenderDashboard writes the full workspace page for a tab.
func RenderDashboard(w io.Writer, data models.DashboardViewData) error {
	return DashboardPage(data).Render(context.Background(), w)
}

// RenderTabPartial renders a tab for an HTMX swap, plus out-of-band updates
// for the shell (title, tab strip, sidebar, bottom bar).
func RenderTabPartial(w io.Writer, tabName string, data models.DashboardViewData) error {
	if err := TabPartialComponent(tabName, data).Render(context.Background(), w); err != nil {
		return err
	}
	return ShellOOB(data.Store, tabName, data.Nav).Render(context.Background(), w)
}

// RenderStockButton returns the updated availability toggle.
func RenderStockButton(w io.Writer, sku models.CatalogSKU) error {
	return StockButtonComponent(sku).Render(context.Background(), w)
}

// RenderProductDetailViewData renders the product page body with computed readiness.
func RenderProductDetailViewData(w io.Writer, data models.DashboardViewData, sku models.CatalogSKU) error {
	if err := ProductDetailView(sku, data.Readiness[sku.ID], data.Warehouses).Render(context.Background(), w); err != nil {
		return err
	}
	return ShellOOB(data.Store, "catalog", data.Nav).Render(context.Background(), w)
}

// RenderProductDetailPageData renders the full product page.
func RenderProductDetailPageData(w io.Writer, data models.DashboardViewData, sku models.CatalogSKU) error {
	return Layout(data.Store, "catalog", data.Nav).Render(templ.WithChildren(context.Background(), ProductDetailView(sku, data.Readiness[sku.ID], data.Warehouses)), w)
}

// RenderProductEditViewData renders the product editor body for HTMX swaps.
func RenderProductEditViewData(w io.Writer, data models.DashboardViewData, sku models.CatalogSKU, isNew bool) error {
	if err := ProductEditView(data, sku, isNew).Render(context.Background(), w); err != nil {
		return err
	}
	return ShellOOB(data.Store, "catalog", data.Nav).Render(context.Background(), w)
}

// RenderProductEditPageData renders the full product editor page.
func RenderProductEditPageData(w io.Writer, data models.DashboardViewData, sku models.CatalogSKU, isNew bool) error {
	return ProductEditPage(data, sku, isNew).Render(context.Background(), w)
}

// RenderProformaInvoice renders the tax invoice modal.
func RenderProformaInvoice(w io.Writer, store models.StoreProfile, order models.ProformaOrder) error {
	return ProformaInvoiceModal(store, order).Render(context.Background(), w)
}

// RenderNotFound renders the workspace 404 page (or just its body for HTMX).
func RenderNotFound(w io.Writer, data models.DashboardViewData, title, message, href, action string, partial bool) error {
	body := NotFoundView(title, message, href, action)
	if partial {
		return body.Render(context.Background(), w)
	}
	return Layout(data.Store, data.ActiveTab, data.Nav).Render(templ.WithChildren(context.Background(), body), w)
}
