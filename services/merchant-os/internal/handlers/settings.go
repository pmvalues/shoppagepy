package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/shoppage/merchant-os/internal/models"
)

// maskAccount shows only the last four digits of a bank account.
func maskAccount(acc string) string {
	acc = strings.TrimSpace(acc)
	if len(acc) <= 4 {
		return acc
	}
	return strings.Repeat("•", len(acc)-4) + acc[len(acc)-4:]
}

// SaveSettings updates the business profile. Every changed field is logged.
func (h *Handler) SaveSettings(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	now := time.Now().UTC()
	h.state.mu.Lock()
	st := &h.state.Store
	var changed []string
	set := func(field, label string, dst *string) {
		v := strings.TrimSpace(r.FormValue(field))
		if v != "" && v != *dst {
			changed = append(changed, label)
			*dst = v
		}
	}
	set("name", "trading name", &st.Name)
	set("legalName", "legal name", &st.LegalName)
	set("cipc", "company registration", &st.CIPCRegistration)
	set("vat", "VAT number", &st.VATNumber)
	set("address", "address", &st.Address)
	set("phone", "phone", &st.Phone)
	set("whatsapp", "WhatsApp number", &st.WhatsApp)
	set("email", "email", &st.Email)
	if len(changed) > 0 {
		h.state.audit(h.actor(r), "Store profile updated", "StoreProfile", st.ID, "Changed "+strings.Join(changed, ", "), now)
	}
	h.state.mu.Unlock()
	if len(changed) > 0 {
		setToast(w, "Saved: "+strings.Join(changed, ", ")+".", "")
	} else {
		setToast(w, "No changes to save.", "")
	}
	h.renderTab(w, r, "settings")
}

// SaveBanking changes the payout account. The account number must be typed
// twice to guard against a mistyped digit sending buyers' money elsewhere.
func (h *Handler) SaveBanking(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	now := time.Now().UTC()
	acc := strings.ReplaceAll(strings.TrimSpace(r.FormValue("bankAccount")), " ", "")
	confirm := strings.ReplaceAll(strings.TrimSpace(r.FormValue("confirmAccount")), " ", "")
	bank := strings.TrimSpace(r.FormValue("bankName"))
	branch := strings.TrimSpace(r.FormValue("bankBranchCode"))
	if acc == "" || bank == "" || branch == "" {
		setToast(w, "Enter the bank, account number and branch code.", "")
		h.renderTab(w, r, "settings")
		return
	}
	if confirm != acc {
		setToast(w, "The two account numbers don't match. Nothing was changed.", "")
		h.renderTab(w, r, "settings")
		return
	}
	h.state.mu.Lock()
	st := &h.state.Store
	before := fmt.Sprintf("%s %s", st.BankName, maskAccount(st.BankAccount))
	st.BankName, st.BankAccount, st.BankBranchCode = bank, acc, branch
	h.state.audit(h.actor(r), "Payout bank account changed", "StoreProfile", st.ID,
		fmt.Sprintf("%s → %s %s", before, bank, maskAccount(acc)), now)
	h.state.mu.Unlock()
	setToast(w, "Payout account updated to "+bank+" "+maskAccount(acc)+".", "")
	h.renderTab(w, r, "settings")
}

// UpdatePlan switches the subscription plan to a known tier.
func (h *Handler) UpdatePlan(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	name := r.FormValue("plan")
	var plan *models.Plan
	for i := range models.Plans {
		if models.Plans[i].Name == name {
			plan = &models.Plans[i]
		}
	}
	if plan == nil {
		http.Error(w, "Unknown plan", http.StatusBadRequest)
		return
	}
	now := time.Now().UTC()
	h.state.mu.Lock()
	old := models.PlanFor(h.state.Store.CurrentPlan)
	h.state.Store.CurrentPlan = plan.Name
	h.state.audit(h.actor(r), "Plan changed", "StoreProfile", h.state.Store.ID, old.Label+" → "+plan.Label, now)
	h.state.mu.Unlock()
	setToast(w, "You're now on the "+plan.Label+" plan.", "")
	h.renderTab(w, r, "settings")
}
