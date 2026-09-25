package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/shoppage/merchant-os/internal/models"
)

// dispatchedToday returns the orders dispatched since midnight (SAST) and
// their packed weight from product records.
func dispatchedToday(s *MerchantStoreState, now time.Time) (int, float64) {
	start := dayStart(now)
	n, kg := 0, 0.0
	for _, o := range s.Orders {
		if !strings.EqualFold(o.Status, "dispatched") || o.Date.Before(start.AddDate(0, 0, -30)) {
			continue
		}
		n++
		for _, ln := range o.LineItems {
			if i := catalogIndexBySKU(s.Catalog, ln.SKU); i >= 0 {
				kg += float64(ln.Quantity) * s.Catalog[i].Spec.WeightKg
			}
		}
	}
	return n, kg
}

// GenerateManifest records a courier handover sheet from what the merchant
// entered. Parcel count and weight default to the dispatched orders.
func (h *Handler) GenerateManifest(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	now := time.Now().UTC()
	carrier := strings.TrimSpace(r.FormValue("carrier"))
	if carrier == "" {
		setToast(w, "Choose the courier collecting the parcels.", "")
		h.renderTab(w, r, "manifests")
		return
	}
	h.state.mu.Lock()
	parcels, _ := strconv.Atoi(r.FormValue("waybillCount"))
	kg, _ := strconv.ParseFloat(r.FormValue("totalWeightKg"), 64)
	if parcels <= 0 || kg <= 0 {
		n, w := dispatchedToday(h.state, now)
		if parcels <= 0 {
			parcels = n
		}
		if kg <= 0 {
			kg = round2(w)
		}
	}
	ref := fmt.Sprintf("MAN-%s-%02d", now.In(sast).Format("20060102"), len(h.state.Manifests)+1)
	h.state.Manifests = append([]models.CarrierManifest{{
		ID: fmt.Sprintf("man_%d", now.UnixNano()), ManifestRef: ref, CarrierName: carrier,
		WaybillCount: parcels, TotalWeightKg: kg, Status: "Manifested",
		DriverName: strings.TrimSpace(r.FormValue("driverName")), VehicleReg: strings.TrimSpace(r.FormValue("vehicleReg")), Date: now,
	}}, h.state.Manifests...)
	h.state.audit(h.actor(r), "Courier manifest created", "CarrierManifest", ref, fmt.Sprintf("%s: %d parcels, %.1f kg", carrier, parcels, kg), now)
	h.state.mu.Unlock()
	setToast(w, ref+" created. Print it for the driver to sign.", "")
	h.renderTab(w, r, "manifests")
}
