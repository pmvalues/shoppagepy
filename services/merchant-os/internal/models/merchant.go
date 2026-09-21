package models

import "time"

// StoreProfile represents a verified South African merchant
type StoreProfile struct {
	ID                 string    `json:"id"`
	Name               string    `json:"name"`
	LegalName          string    `json:"legalName"`
	Category           string    `json:"category"`
	Address            string    `json:"address"`
	City               string    `json:"city"`
	Province           string    `json:"province"`
	Phone              string    `json:"phone"`
	WhatsApp           string    `json:"whatsapp"`
	Email              string    `json:"email"`
	Website            string    `json:"website"`
	CIPCRegistration   string    `json:"cipcRegistration"`
	VATNumber          string    `json:"vatNumber"`
	BankName           string    `json:"bankName"`
	BankAccount        string    `json:"bankAccount"`
	BankBranchCode     string    `json:"bankBranchCode"`
	CurrentPlan        string    `json:"currentPlan"`        // "Launch Free (R0/mo)", "Grow (R199/mo)", "Pro (R599/mo)"
	SovereignPod       string    `json:"sovereignPod"`       // "pod-za-01, Johannesburg"
	VerificationStatus string    `json:"verificationStatus"` // "fully_verified", "phone_verified", "candidate"
	GrossRevenueZar    float64   `json:"grossRevenueZar"`
	QuotesSentCount    int       `json:"quotesSentCount"`
	MedianResponseMins int       `json:"medianResponseMins"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

// ProductActivity represents an event in a product's audit trail
type ProductActivity struct {
	Icon        string `json:"icon"`
	Description string `json:"description"`
	TimeAgo     string `json:"timeAgo"`
}

// ProductDetailSpec holds rich metadata, SABS info, and SEO scores for a SKU
type ProductDetailSpec struct {
	WeightKg       float64           `json:"weightKg"`
	Dimensions     string            `json:"dimensions"`
	HSCode         string            `json:"hsCode"`
	Barcode        string            `json:"barcode"`
	SABSApproved   bool              `json:"sabsApproved"`
	Material       string            `json:"material"`
	LongDesc       string            `json:"longDesc"`
	SEOScore       int               `json:"seoScore"` // e.g. 92
	SEOTags        []string          `json:"seoTags"`
	Activities     []ProductActivity `json:"activities"`
	DirectStore    bool              `json:"directStore"`
	WhatsAppSync   bool              `json:"whatsappSync"`
	ShoppagePublic bool              `json:"shoppagePublic"`
}

// CatalogSKU represents a product managed by the merchant
type CatalogSKU struct {
	ID            string            `json:"id"`
	StoreID       string            `json:"storeId"`
	SKU           string            `json:"sku"`
	Title         string            `json:"title"`
	Brand         string            `json:"brand"`
	Category      string            `json:"category"`
	WholesaleZar  float64           `json:"wholesaleZar"`
	RetailZar     float64           `json:"retailZar"`
	InStock       bool              `json:"inStock"`
	StockQuantity int               `json:"stockQuantity"`
	LowStockAlert int               `json:"lowStockAlert"`
	FeedStatus    string            `json:"feedStatus"` // "Active", "Pending", "Paused"
	Spec          ProductDetailSpec `json:"spec"`
}

// RFQLead represents an active commercial lead / negotiation from a buyer
type RFQLead struct {
	ID             string    `json:"id"`
	StoreID        string    `json:"storeId"`
	BuyerName      string    `json:"buyerName"`
	BuyerCompany   string    `json:"buyerCompany"`
	BuyerPhone     string    `json:"buyerPhone"`
	BuyerCity      string    `json:"buyerCity"`
	ItemRequested  string    `json:"itemRequested"`
	Quantity       int       `json:"quantity"`
	EstimatedTotal float64   `json:"estimatedTotal"`
	Status         string    `json:"status"` // "new", "quoted", "accepted", "completed"
	ReceivedAt     time.Time `json:"receivedAt"`
}

// ProformaLineItem represents an individual line in a proforma tax invoice
type ProformaLineItem struct {
	SKU          string  `json:"sku"`
	Title        string  `json:"title"`
	Quantity     int     `json:"quantity"`
	UnitPriceZar float64 `json:"unitPriceZar"`
	TotalZar     float64 `json:"totalZar"`
}

// ProformaOrder represents a B2B proforma invoice generated for instant bank EFT
type ProformaOrder struct {
	ID            string             `json:"id"`
	OrderNumber   string             `json:"orderNumber"`
	Customer      string             `json:"customer"`
	Company       string             `json:"company"`
	Phone         string             `json:"phone"`
	Email         string             `json:"email"`
	Address       string             `json:"address"`
	VatNumber     string             `json:"vatNumber"`
	LineItems     []ProformaLineItem `json:"lineItems"`
	SubtotalZar   float64            `json:"subtotalZar"`
	VatZar        float64            `json:"vatZar"` // 15% South African VAT
	GrandTotal    float64            `json:"grandTotal"`
	PaymentMethod string             `json:"paymentMethod"` // "Bank EFT", "Capitec Pay", "Ozow", "PayFast"
	BankingRef    string             `json:"bankingRef"`
	Status        string             `json:"status"` // "issued", "confirmed", "paid", "dispatched"
	Date          time.Time          `json:"date"`
	DueDate       time.Time          `json:"dueDate"`
}

// WarehouseHub represents a logistics node / distribution centre in South Africa
type WarehouseHub struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Location        string `json:"location"`
	Province        string `json:"province"`
	Manager         string `json:"manager"`
	SKUsStocked     int    `json:"skusStocked"`
	CapacityUsedPct int    `json:"capacityUsedPct"`
	Status          string `json:"status"` // "Operational", "Near Capacity", "Maintenance"
}

// CustomerAccount represents a B2B or trade buyer in the CRM
type CustomerAccount struct {
	ID               string    `json:"id"`
	Company          string    `json:"company"`
	ContactName      string    `json:"contactName"`
	Phone            string    `json:"phone"`
	Email            string    `json:"email"`
	City             string    `json:"city"`
	Tier             string    `json:"tier"` // "Platinum Trade", "Gold Wholesale", "Standard Commercial"
	TotalSpendZar    float64   `json:"totalSpendZar"`
	CreditLimit      float64   `json:"creditLimit"`
	BalanceZar       float64   `json:"balanceZar"`
	CIPCRegistration string    `json:"cipcRegistration"`
	VATNumber        string    `json:"vatNumber"`
	LastOrderDate    time.Time `json:"lastOrderDate"`
	OrderCount       int       `json:"orderCount"`
}

// WholesaleTier represents volume discount pricing rules
type WholesaleTier struct {
	ID          string  `json:"id"`
	TierName    string  `json:"tierName"`
	MinUnits    int     `json:"minUnits"`
	MaxUnits    int     `json:"maxUnits"`
	DiscountPct float64 `json:"discountPct"`
	Description string  `json:"description"`
}

// CouponCode represents a promotional discount code
type CouponCode struct {
	ID          string    `json:"id"`
	Code        string    `json:"code"`
	DiscountPct float64   `json:"discountPct"`
	Description string    `json:"description"`
	UsageCount  int       `json:"usageCount"`
	Active      bool      `json:"active"`
	ExpiryDate  time.Time `json:"expiryDate"`
}

// ChannelSync represents an active commerce channel
type ChannelSync struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Type        string    `json:"type"` // "Storefront", "WhatsApp", "Shoppage Network", "Google Shopping"
	Status      string    `json:"status"` // "Active", "Syncing", "Paused"
	Endpoint    string    `json:"endpoint"`
	ItemsSynced int       `json:"itemsSynced"`
	LastSyncAt  time.Time `json:"lastSyncAt"`
}

// CopilotMessage represents a chat or recommendation message in Pemofy Copilot
type CopilotMessage struct {
	ID          string    `json:"id"`
	Role        string    `json:"role"` // "assistant", "user", "system"
	Content     string    `json:"content"`
	ActionLabel string    `json:"actionLabel,omitempty"`
	ActionURL   string    `json:"actionUrl,omitempty"`
	Timestamp   time.Time `json:"timestamp"`
}

// AnalyticsSummary represents the performance and GMV metrics
type AnalyticsSummary struct {
	MonthGMVZar             float64 `json:"monthGmvZar"`
	MoMGrowthPct            float64 `json:"momGrowthPct"`
	AverageOrderValueZar    float64 `json:"averageOrderValueZar"`
	ProformaConversionPct   float64 `json:"proformaConversionPct"`
	QuotedPipelineZar       float64 `json:"quotedPipelineZar"`
	ChannelShareWhatsApp    int     `json:"channelShareWhatsapp"`
	ChannelShareWeb         int     `json:"channelShareWeb"`
	ChannelShareB2B         int     `json:"channelShareB2b"`
	FreeThresholdUsedZar    float64 `json:"freeThresholdUsedZar"`
	FreeThresholdCapZar     float64 `json:"freeThresholdCapZar"`
	FreeThresholdSavingsZar float64 `json:"freeThresholdSavingsZar"`
}

// StockTransfer represents an inter-hub inventory transfer
type StockTransfer struct {
	ID            string    `json:"id"`
	TransferRef   string    `json:"transferRef"`
	SourceHub     string    `json:"sourceHub"`
	DestHub       string    `json:"destHub"`
	SKU           string    `json:"sku"`
	ItemTitle     string    `json:"itemTitle"`
	Quantity      int       `json:"quantity"`
	Status        string    `json:"status"` // "Preparing", "In-Transit", "Received"
	Carrier       string    `json:"carrier"` // "Road Freight Express", "Internal Depot Shuttle"
	DispatchedAt  time.Time `json:"dispatchedAt"`
	ExpectedAt    time.Time `json:"expectedAt"`
}

// CarrierManifest represents a shipping dispatch manifest for SA couriers
type CarrierManifest struct {
	ID            string    `json:"id"`
	ManifestRef   string    `json:"manifestRef"`
	CarrierName   string    `json:"carrierName"` // "The Courier Guy", "Pargo Mall Lockers", "Customer Collection"
	WaybillCount  int       `json:"waybillCount"`
	TotalWeightKg float64   `json:"totalWeightKg"`
	Status        string    `json:"status"` // "Manifested", "Handed Over", "Delivered"
	DriverName    string    `json:"driverName"`
	VehicleReg    string    `json:"vehicleReg"`
	Date          time.Time `json:"date"`
}

// FlowRule represents an event-driven automation rule from Pemofy
type FlowRule struct {
	ID               string    `json:"id"`
	Name             string    `json:"name"`
	Trigger          string    `json:"trigger"`
	Condition        string    `json:"condition"`
	Action           string    `json:"action"`
	Active           bool      `json:"active"`
	ExecutionsCount  int       `json:"executionsCount"`
	LastTriggeredAt  time.Time `json:"lastTriggeredAt"`
}

// MediaAsset represents a digital asset or compliance document
type MediaAsset struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	Category   string    `json:"category"` // "Product Photography", "SABS Certificate", "Spec Sheet"
	SizeKb     int       `json:"sizeKb"`
	MimeType   string    `json:"mimeType"`
	URL        string    `json:"url"`
	UploadedAt time.Time `json:"uploadedAt"`
}

// AuditLogEntry represents a security or operational event log
type AuditLogEntry struct {
	ID        string    `json:"id"`
	Actor     string    `json:"actor"` // e.g. "Sipho Dlamini (Admin)"
	Action    string    `json:"action"` // e.g. "Price Updated", "Stock Intake", "Proforma Issued"
	Entity    string    `json:"entity"`
	EntityID  string    `json:"entityId"`
	Details   string    `json:"details"`
	Timestamp time.Time `json:"timestamp"`
}

// POSItem represents a SKU line item in the POS register
type POSItem struct {
	SKU      string  `json:"sku"`
	Title    string  `json:"title"`
	PriceZar float64 `json:"priceZar"`
	Quantity int     `json:"quantity"`
	TotalZar float64 `json:"totalZar"`
}

// POSTransaction represents a completed counter sale
type POSTransaction struct {
	ID            string    `json:"id"`
	ReceiptNumber string    `json:"receiptNumber"`
	Customer      string    `json:"customer"`
	Items         []POSItem `json:"items"`
	TotalZar      float64   `json:"totalZar"`
	PaymentMethod string    `json:"paymentMethod"` // "Capitec Pay QR", "Card Terminal", "Cash", "Instant EFT"
	Timestamp     time.Time `json:"timestamp"`
}

// ItemLedgerEntry represents double-entry stock transactions from Pemofy Role Center
type ItemLedgerEntry struct {
	ID           string    `json:"id"`
	EntryNumber  int       `json:"entryNumber"`
	PostingDate  time.Time `json:"postingDate"`
	EntryType    string    `json:"entryType"` // "Assembly Consumption", "Positive Adjmt.", "Negative Adjmt.", "Purchase Receipt", "Sale Shipment"
	DocumentNo   string    `json:"documentNo"`
	SKU          string    `json:"sku"`
	Description  string    `json:"description"`
	Location     string    `json:"location"` // "MAIN-JHB", "MIDRAND-01", "CPT-DOCK"
	Quantity     int       `json:"quantity"`
	RemainingQty int       `json:"remainingQty"`
	CostAmount   float64   `json:"costAmount"`
}

// StructuredQuote represents a live commerce quote card inside a direct message thread
type StructuredQuote struct {
	ID           string    `json:"id"`
	QuoteNumber  string    `json:"quoteNumber"` // e.g. "QUO-2026-0814"
	SKU          string    `json:"sku"`
	ProductTitle string    `json:"productTitle"`
	Quantity     int       `json:"quantity"`
	UnitPriceZar float64   `json:"unitPriceZar"`
	SubtotalZar  float64   `json:"subtotalZar"`
	VATZar       float64   `json:"vatZar"` // 15% SARS VAT
	TotalZar     float64   `json:"totalZar"`
	Status       string    `json:"status"` // "Draft", "Sent", "Approved", "Paid"
	ValidUntil   time.Time `json:"validUntil"`
}

// StockLockInfo represents a real-time warehouse inventory reservation
type StockLockInfo struct {
	SKU          string    `json:"sku"`
	ProductTitle string    `json:"productTitle"`
	Quantity     int       `json:"quantity"`
	Warehouse    string    `json:"warehouse"` // e.g. "Midrand Central Hub, Bay 4"
	LockID       string    `json:"lockId"`    // e.g. "LCK-MID-2026-09"
	ExpiresAt    time.Time `json:"expiresAt"`
	Status       string    `json:"status"` // "Active", "Released", "Converted to Order"
}

// PaymentProofInfo represents an electronic funds transfer (EFT) proof of payment
type PaymentProofInfo struct {
	BankName        string  `json:"bankName"` // "Standard Bank", "Capitec", "FNB", "Nedbank", "Absa"
	AccountHolder   string  `json:"accountHolder"`
	AmountZar       float64 `json:"amountZar"`
	ReferenceNumber string  `json:"referenceNumber"`
	Verified        bool    `json:"verified"`
	VerifiedBy      string  `json:"verifiedBy"`
	ProofFileName   string  `json:"proofFileName"`
}

// ChatMessage represents a single message in a direct message thread
type ChatMessage struct {
	ID             string            `json:"id"`
	SenderID       string            `json:"senderId"`
	SenderName     string            `json:"senderName"`
	SenderRole     string            `json:"senderRole"` // "buyer", "merchant", "agent", "system"
	Text           string            `json:"text"`
	Timestamp      time.Time         `json:"timestamp"`
	IsMerchant     bool              `json:"isMerchant"`
	IsInternalNote bool              `json:"isInternalNote"` // Slack-style internal team whisper (merchant-only)
	CardType       string            `json:"cardType,omitempty"` // "quote", "stock_lock", "pop_verification", "note"
	HasQuote       bool              `json:"hasQuote"`
	Quote          *StructuredQuote  `json:"quote,omitempty"`
	StockLock      *StockLockInfo    `json:"stockLock,omitempty"`
	PaymentProof   *PaymentProofInfo `json:"paymentProof,omitempty"`
	Reactions      []string          `json:"reactions,omitempty"`
}

// ChatThread represents an active direct message conversation between a buyer and the merchant
type ChatThread struct {
	ID            string        `json:"id"`
	BuyerID       string        `json:"buyerId"`
	BuyerName     string        `json:"buyerName"`
	BuyerCompany  string        `json:"buyerCompany"`
	BuyerCity     string        `json:"buyerCity"`
	Channel       string        `json:"channel"` // "Shoppage DM", "WhatsApp Business API"
	UnreadCount   int           `json:"unreadCount"`
	LastMessage   string        `json:"lastMessage"`
	LastTime      string        `json:"lastTime"`
	AvatarInit    string        `json:"avatarInit"`
	Online        bool          `json:"online"`
	DealContext   string        `json:"dealContext"`   // e.g. "RFQ #1042 — 200x Anti-Theft Wooden Hangers"
	DealAmount    float64       `json:"dealAmount"`    // 4735.70
	DealStatus    string        `json:"dealStatus"`    // "Negotiating", "Proforma Issued", "Stock Reserved", "Paid & Dispatched"
	AssignedAgent string        `json:"assignedAgent"` // "Sipho Dlamini (Midrand Hub)"
	Messages      []ChatMessage `json:"messages"`
}

// DashboardViewData encapsulates the full page state for Go HTML rendering across all modules
type DashboardViewData struct {
	Store           StoreProfile
	ActiveTab       string
	Catalog         []CatalogSKU
	Leads           []RFQLead
	Orders          []ProformaOrder
	Warehouses      []WarehouseHub
	Customers       []CustomerAccount
	WholesaleTiers  []WholesaleTier
	Coupons         []CouponCode
	Channels        []ChannelSync
	CopilotMessages []CopilotMessage
	Analytics       AnalyticsSummary
	Transfers       []StockTransfer
	Manifests       []CarrierManifest
	FlowRules       []FlowRule
	MediaAssets     []MediaAsset
	AuditLogs       []AuditLogEntry
	RecentPOSTxns   []POSTransaction
	ItemLedger      []ItemLedgerEntry
	ChatThreads     []ChatThread
	ActiveThreadID  string
	ActiveSKU       *CatalogSKU    // Optional: for Product Detail & Edit modal
	ActiveInvoice   *ProformaOrder // Optional: for Proforma Invoice modal
}

// GetActiveThread returns the active ChatThread or first thread
func (d DashboardViewData) GetActiveThread() *ChatThread {
	for i := range d.ChatThreads {
		if d.ChatThreads[i].ID == d.ActiveThreadID {
			return &d.ChatThreads[i]
		}
	}
	if len(d.ChatThreads) > 0 {
		return &d.ChatThreads[0]
	}
	return nil
}


