package handlers

import (
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/shoppage/merchant-os/internal/auth"
	"github.com/shoppage/merchant-os/internal/config"
	"github.com/shoppage/merchant-os/internal/fixtures"
	"github.com/shoppage/merchant-os/internal/models"
	"github.com/shoppage/merchant-os/internal/templates"
)

// MerchantStoreState maintains in-memory store state for the merchant
type MerchantStoreState struct {
	mu              sync.RWMutex
	Store           models.StoreProfile
	Catalog         []models.CatalogSKU
	Leads           []models.RFQLead
	Orders          []models.ProformaOrder
	ReturnRequests  []models.ReturnRequest
	Warehouses      []models.WarehouseHub
	Customers       []models.CustomerAccount
	WholesaleTiers  []models.WholesaleTier
	Coupons         []models.CouponCode
	Channels        []models.ChannelSync
	CopilotMessages []models.CopilotMessage
	Analytics       models.AnalyticsSummary
	Transfers       []models.StockTransfer
	Manifests       []models.CarrierManifest
	FlowRules       []models.FlowRule
	MediaAssets     []models.MediaAsset
	AuditLogs       []models.AuditLogEntry
	RecentPOSTxns   []models.POSTransaction
	ItemLedger      []models.ItemLedgerEntry
	ChatThreads     []models.ChatThread
	ActiveThreadID  string
	// Demo marks the bundled sample business. Screens show a demo banner and
	// channel actions say they are simulated while it is set.
	Demo      bool
	Proposals []models.Proposal
	UndoLog   []models.UndoEntry
}

// NewDefaultState initializes the demonstration workspace using the bundled fixture
// profile (internal/fixtures/store.json). Demo operational data stays in code until
// the persistence milestone (blueprint E-4) replaces it with a database.
func NewDefaultState() *MerchantStoreState {
	return NewStateWithProfile(fixtures.DemoStoreProfile(config.Load()))
}

// NewStateWithProfile builds workspace state for a specific store profile.
func NewStateWithProfile(profile models.StoreProfile) *MerchantStoreState {
	now := time.Now().UTC()

	st := &MerchantStoreState{
		Store: profile,
		Catalog: []models.CatalogSKU{
			{
				ID:            "mit_3361",
				StoreID:       "loc_mitrend_midrand",
				SKU:           "MIT-3361",
				Title:         "Commercial Anti-Theft Wooden Male Hanger 44cm",
				Brand:         "Mitrend",
				Category:      "Hospitality Supplies",
				WholesaleZar:  22.88,
				RetailZar:     28.50,
				InStock:       true,
				StockQuantity: 450,
				LowStockAlert: 50,
				FeedStatus:    "Active",
				Spec: models.ProductDetailSpec{
					WeightKg:     0.32,
					Dimensions:   "440mm x 220mm x 14mm",
					HSCode:       "4421.10",
					Barcode:      "60098824001",
					SABSApproved: true,
					Material:     "Solid Lotus Hardwood with Chrome Ring Pin",
					LongDesc:     "Heavy-duty commercial anti-theft coat hanger designed specifically for hotel guest wardrobes, lodges, and commercial apparel displays. Fitted with a secure chrome pin that locks onto wardrobe security rings.",
					SEOScore:     94,
					SEOTags:      []string{"hotel hangers", "anti-theft coat hanger", "wooden male hanger", "hospitality supplies South Africa"},
					Activities: []models.ProductActivity{
						{Icon: "check", Description: "Wholesale price synchronized to GMC Feed", TimeAgo: "Today, 10:14"},
						{Icon: "stock", Description: "Restocked +200 units at Midrand Hub", TimeAgo: "Yesterday"},
						{Icon: "tag", Description: "SABS commercial hotel compliance verified", TimeAgo: "3 days ago"},
					},
					DirectStore:    true,
					WhatsAppSync:   true,
					ShoppagePublic: true,
				},
			},
			{
				ID:            "mit_2088",
				StoreID:       "loc_mitrend_midrand",
				SKU:           "MIT-2088",
				Title:         "Anti-Theft Security Replacement Ring 38mm Chrome",
				Brand:         "Mitrend",
				Category:      "Hospitality Supplies",
				WholesaleZar:  6.85,
				RetailZar:     9.50,
				InStock:       true,
				StockQuantity: 1200,
				LowStockAlert: 100,
				FeedStatus:    "Active",
				Spec: models.ProductDetailSpec{
					WeightKg:     0.05,
					Dimensions:   "38mm Internal Diameter x 3mm Steel",
					HSCode:       "7326.90",
					Barcode:      "60098824002",
					SABSApproved: true,
					Material:     "Hardened Carbon Steel Chrome Plated",
					LongDesc:     "Replacement wardrobe security ring compatible with all standard 32mm–35mm hotel closet hanging rails. Heavy gauge steel prevents opening without rail detachment.",
					SEOScore:     91,
					SEOTags:      []string{"security ring", "hanger ring", "closet rail accessories", "hotel hardware"},
					Activities: []models.ProductActivity{
						{Icon: "stock", Description: "Stock count confirmed: 1,200 units", TimeAgo: "Today, 09:00"},
					},
					DirectStore:    true,
					WhatsAppSync:   true,
					ShoppagePublic: true,
				},
			},
			{
				ID:            "mit_8609",
				StoreID:       "loc_mitrend_midrand",
				SKU:           "MIT-8609",
				Title:         "101mm Silicone Clip-On-Lid Food Safe SABS",
				Brand:         "Mitrend",
				Category:      "Packaging & Catering",
				WholesaleZar:  1.50,
				RetailZar:     2.20,
				InStock:       true,
				StockQuantity: 3000,
				LowStockAlert: 500,
				FeedStatus:    "Active",
				Spec: models.ProductDetailSpec{
					WeightKg:     0.02,
					Dimensions:   "101mm Outer Diameter",
					HSCode:       "3923.50",
					Barcode:      "60098824003",
					SABSApproved: true,
					Material:     "100% Food-Grade Silicone BPA Free",
					LongDesc:     "Airtight silicone clip-on lid for takeaway food tubs, deli containers, and commercial kitchen meal-prep tubs. Reusable, dishwasher safe, freezer grade.",
					SEOScore:     89,
					SEOTags:      []string{"silicone lid", "food packaging", "takeaway container lid", "catering supplies"},
					Activities: []models.ProductActivity{
						{Icon: "stock", Description: "Carton bulk packaging audit passed", TimeAgo: "4 days ago"},
					},
					DirectStore:    true,
					WhatsAppSync:   true,
					ShoppagePublic: true,
				},
			},
			{
				ID:            "mit_8610",
				StoreID:       "loc_mitrend_midrand",
				SKU:           "MIT-8610",
				Title:         "Measuring Teaspoon 1ml Clear Dosage Spoon",
				Brand:         "Mitrend",
				Category:      "Packaging & Catering",
				WholesaleZar:  0.50,
				RetailZar:     0.85,
				InStock:       false,
				StockQuantity: 0,
				LowStockAlert: 200,
				FeedStatus:    "Active",
				Spec: models.ProductDetailSpec{
					WeightKg:     0.005,
					Dimensions:   "90mm Length x 1ml Bowl",
					HSCode:       "3924.10",
					Barcode:      "60098824004",
					SABSApproved: true,
					Material:     "Virgin Polypropylene Medical Grade",
					LongDesc:     "Calibrated 1ml accurate dosage spoon for pharmaceutical, nutraceutical, and food powder portioning.",
					SEOScore:     88,
					SEOTags:      []string{"dosage spoon", "1ml spoon", "measuring spoon", "pharmaceutical packaging"},
					Activities: []models.ProductActivity{
						{Icon: "alert", Description: "Stockout alert flagged for restock", TimeAgo: "1 day ago"},
					},
					DirectStore:    true,
					WhatsAppSync:   true,
					ShoppagePublic: true,
				},
			},
		},
		Leads: []models.RFQLead{
			{
				ID:             "lead_1",
				StoreID:        "loc_mitrend_midrand",
				BuyerName:      "Protea Hotel Balalaika",
				BuyerCompany:   "Marriott International",
				BuyerPhone:     "27824419988",
				BuyerCity:      "Sandton, Johannesburg",
				ItemRequested:  "Commercial Anti-Theft Wooden Male Hanger 44cm",
				Quantity:       200,
				EstimatedTotal: 4576.00,
				Status:         "new",
				ReceivedAt:     now.Add(-15 * time.Minute),
			},
			{
				ID:             "lead_2",
				StoreID:        "loc_mitrend_midrand",
				BuyerName:      "Gauteng Catering Solutions",
				BuyerCompany:   "Gauteng Catering (Pty) Ltd",
				BuyerPhone:     "27835520011",
				BuyerCity:      "Midrand",
				ItemRequested:  "101mm Silicone Clip-On-Lid",
				Quantity:       500,
				EstimatedTotal: 750.00,
				Status:         "quoted",
				ReceivedAt:     now.Add(-2 * time.Hour),
			},
		},
		Orders: []models.ProformaOrder{
			{
				ID:            "ord_101",
				OrderNumber:   "#ORD-9824",
				Customer:      "David van der Merwe",
				Company:       "Protea Hotel Balalaika Sandton",
				Phone:         "+27824419988",
				Email:         "dvdmerwe@balalaika.co.za",
				Address:       "Maud & Rivonia Rd, Sandton, 2196",
				VatNumber:     "4980129482",
				SubtotalZar:   4918.50,
				VatZar:        737.78,
				GrandTotal:    5656.28,
				PaymentMethod: "Bank EFT",
				BankingRef:    "ORD-9824",
				Status:        "issued",
				Date:          now.Add(-24 * time.Hour),
				DueDate:       now.Add(48 * time.Hour),
				LineItems: []models.ProformaLineItem{
					{
						SKU:          "MIT-3361",
						Title:        "Commercial Anti-Theft Wooden Male Hanger 44cm",
						Quantity:     200,
						UnitPriceZar: 22.88,
						TotalZar:     4576.00,
					},
					{
						SKU:          "MIT-2088",
						Title:        "Anti-Theft Security Replacement Ring 38mm Chrome",
						Quantity:     50,
						UnitPriceZar: 6.85,
						TotalZar:     342.50,
					},
				},
			},
		},
		ReturnRequests: []models.ReturnRequest{
			{
				ID:           "rma_0814",
				RMANumber:    "RMA-2026-0814",
				OrderNumber:  "#ORD-9824",
				CustomerName: "Protea Hotel Balalaika Sandton",
				ItemTitle:    "Commercial Anti-Theft Wooden Male Hanger 44cm",
				SKU:          "MIT-3361",
				Quantity:     25,
				Reason:       "Transit Packaging Damage",
				Status:       "Authorized",
				WaybillNo:    "TCG-RET-883492",
				RefundAmount: 572.00,
				CreatedAt:    now.Add(-48 * time.Hour),
			},
			{
				ID:           "rma_0799",
				RMANumber:    "RMA-2026-0799",
				OrderNumber:  "#ORD-9820",
				CustomerName: "Cape Coast Lodge Group",
				ItemTitle:    "Anti-Theft Security Replacement Ring 38mm Chrome",
				SKU:          "MIT-2088",
				Quantity:     100,
				Reason:       "Ordered Incompatible Diameter (Need 32mm)",
				Status:       "Refund Issued",
				WaybillNo:    "PUDO-RET-449102",
				RefundAmount: 685.00,
				CreatedAt:    now.Add(-120 * time.Hour),
			},
		},
		Warehouses: []models.WarehouseHub{
			{
				ID:              "wh_jhb",
				Name:            "Midrand Central Hub",
				Location:        "ERF710 Midrand Commercial Park",
				Province:        "Gauteng",
				Manager:         "Sipho Dlamini",
				SKUsStocked:     4,
				CapacityUsedPct: 68,
				Status:          "Operational",
			},
			{
				ID:              "wh_cpt",
				Name:            "Cape Town Depot",
				Location:        "Airport Industrial Park, Unit 4",
				Province:        "Western Cape",
				Manager:         "Annelize de Kock",
				SKUsStocked:     3,
				CapacityUsedPct: 42,
				Status:          "Operational",
			},
			{
				ID:              "wh_dbn",
				Name:            "Durban Port Transit",
				Location:        "Bayhead Harbor Logistics Area",
				Province:        "KwaZulu-Natal",
				Manager:         "Farai Moyo",
				SKUsStocked:     2,
				CapacityUsedPct: 85,
				Status:          "Near Capacity",
			},
		},
		Customers: []models.CustomerAccount{
			{
				ID:               "cust_1",
				Company:          "Protea Hotel Balalaika Sandton",
				ContactName:      "David van der Merwe",
				Phone:            "+27824419988",
				Email:            "dvdmerwe@balalaika.co.za",
				City:             "Sandton, Johannesburg",
				Tier:             "Platinum Trade",
				TotalSpendZar:    148920.00,
				CreditLimit:      100000.00,
				BalanceZar:       5656.28,
				CIPCRegistration: "2014/192840/07",
				VATNumber:        "4980129482",
				LastOrderDate:    now.Add(-24 * time.Hour),
				OrderCount:       18,
			},
			{
				ID:               "cust_2",
				Company:          "Sandton Convention Centre",
				ContactName:      "Thulani Khumalo",
				Phone:            "+27832290011",
				Email:            "operations@scc.co.za",
				City:             "Sandton, Johannesburg",
				Tier:             "Gold Wholesale",
				TotalSpendZar:    84200.00,
				CreditLimit:      75000.00,
				BalanceZar:       0.00,
				CIPCRegistration: "2016/381920/07",
				VATNumber:        "4820194819",
				LastOrderDate:    now.Add(-5 * 24 * time.Hour),
				OrderCount:       11,
			},
			{
				ID:               "cust_3",
				Company:          "Gauteng Catering Solutions",
				ContactName:      "Brenda Fourie",
				Phone:            "+27835520011",
				Email:            "brenda@gautengcatering.co.za",
				City:             "Midrand",
				Tier:             "Standard Commercial",
				TotalSpendZar:    28400.00,
				CreditLimit:      25000.00,
				BalanceZar:       1840.00,
				CIPCRegistration: "2020/554812/07",
				VATNumber:        "4710293810",
				LastOrderDate:    now.Add(-12 * 24 * time.Hour),
				OrderCount:       6,
			},
		},
		WholesaleTiers: []models.WholesaleTier{
			{
				ID:          "tier_base",
				TierName:    "Tier 1: Carton Minimum",
				MinUnits:    5,
				MaxUnits:    19,
				DiscountPct: 10.0,
				Description: "Standard wholesale trade pricing for small venue orders.",
			},
			{
				ID:          "tier_mid",
				TierName:    "Tier 2: Commercial Bulk",
				MinUnits:    20,
				MaxUnits:    49,
				DiscountPct: 18.0,
				Description: "Preferred pricing for hotel refurbishments & commercial caterers.",
			},
			{
				ID:          "tier_dist",
				TierName:    "Tier 3: Master Distributor",
				MinUnits:    50,
				MaxUnits:    0,
				DiscountPct: 25.0,
				Description: "Pallet orders with direct factory dispatch from Midrand Hub.",
			},
		},
		Coupons: []models.CouponCode{
			{
				ID:          "coup_1",
				Code:        "HOSPITALITY15",
				DiscountPct: 15.0,
				Description: "15% discount for first-time hospitality trade accounts",
				UsageCount:  28,
				Active:      true,
				ExpiryDate:  now.Add(60 * 24 * time.Hour),
			},
			{
				ID:          "coup_2",
				Code:        "BULK2026",
				DiscountPct: 20.0,
				Description: "Special 20% allowance for orders over R25,000",
				UsageCount:  12,
				Active:      true,
				ExpiryDate:  now.Add(90 * 24 * time.Hour),
			},
			{
				ID:          "coup_3",
				Code:        "WINTER24",
				DiscountPct: 10.0,
				Description: "Winter catering tub clearance promo",
				UsageCount:  45,
				Active:      false,
				ExpiryDate:  now.Add(-10 * 24 * time.Hour),
			},
		},
		Channels: []models.ChannelSync{
			{
				ID:          "ch_storefront",
				Name:        "Direct Web Storefront",
				Type:        "Online Storefront",
				Status:      "Active",
				Endpoint:    "https://mitrend.shoppage.co.za",
				ItemsSynced: 4,
				LastSyncAt:  now.Add(-10 * time.Minute),
			},
			{
				ID:          "ch_whatsapp",
				Name:        "WhatsApp Commerce Desk",
				Type:        "WhatsApp API",
				Status:      "Active",
				Endpoint:    "wa.me/27105007670",
				ItemsSynced: 4,
				LastSyncAt:  now.Add(-5 * time.Minute),
			},
			{
				ID:          "ch_shoppage",
				Name:        "Shoppage Discovery Grid",
				Type:        "National Index",
				Status:      "Active",
				Endpoint:    "shoppage.co.za/m/mitrend",
				ItemsSynced: 4,
				LastSyncAt:  now.Add(-1 * time.Hour),
			},
			{
				ID:          "ch_gmc",
				Name:        "Google Merchant Center",
				Type:        "XML Product Feed",
				Status:      "Active",
				Endpoint:    "/feeds/google-merchant-center.xml",
				ItemsSynced: 4,
				LastSyncAt:  now.Add(-2 * time.Hour),
			},
		},
		CopilotMessages: []models.CopilotMessage{
			{
				ID:          "msg_1",
				Role:        "assistant",
				Content:     "Hello Sipho! I reviewed your catalog velocity. You have processed R48,250 of your R50,000 free GMV allowance this month (96.5%). Proforma #ORD-9824 for Protea Hotel Balalaika (R5,656.28) is awaiting bank EFT verification.",
				ActionLabel: "View Proforma #ORD-9824",
				ActionURL:   "/orders/ord_101/invoice",
				Timestamp:   now.Add(-30 * time.Minute),
			},
			{
				ID:        "msg_2",
				Role:      "assistant",
				Content:   "Alert: Your stock for 'Measuring Teaspoon 1ml Clear Dosage Spoon' (MIT-8610) is depleted (0 units). Reorder buffer is set at 200 units. Would you like me to draft an internal restock purchase order?",
				Timestamp: now.Add(-15 * time.Minute),
			},
		},
		Analytics: models.AnalyticsSummary{
			MonthGMVZar:             1248500.00,
			MoMGrowthPct:            14.2,
			AverageOrderValueZar:    4680.00,
			ProformaConversionPct:   68.4,
			QuotedPipelineZar:       342000.00,
			ChannelShareWhatsApp:    42,
			ChannelShareWeb:         38,
			ChannelShareB2B:         20,
			FreeThresholdUsedZar:    48250.00,
			FreeThresholdCapZar:     50000.00,
			FreeThresholdSavingsZar: 1206.25,
		},
		Transfers: []models.StockTransfer{
			{
				ID:           "tr_8821",
				TransferRef:  "TR-8821",
				SourceHub:    "Midrand Central Hub",
				DestHub:      "Cape Town Depot",
				SKU:          "MIT-3361",
				ItemTitle:    "Commercial Anti-Theft Wooden Male Hanger 44cm",
				Quantity:     150,
				Status:       "In-Transit",
				Carrier:      "Road Freight Express",
				DispatchedAt: now.Add(-6 * time.Hour),
				ExpectedAt:   now.Add(18 * time.Hour),
			},
			{
				ID:           "tr_8819",
				TransferRef:  "TR-8819",
				SourceHub:    "Midrand Central Hub",
				DestHub:      "Durban Port Transit",
				SKU:          "MIT-8609",
				ItemTitle:    "101mm Silicone Clip-On-Lid Food Safe SABS",
				Quantity:     500,
				Status:       "Received",
				Carrier:      "Internal Depot Shuttle",
				DispatchedAt: now.Add(-48 * time.Hour),
				ExpectedAt:   now.Add(-24 * time.Hour),
			},
		},
		Manifests: []models.CarrierManifest{
			{
				ID:            "man_01",
				ManifestRef:   "MAN-2026-0920-01",
				CarrierName:   "The Courier Guy",
				WaybillCount:  8,
				TotalWeightKg: 142.5,
				Status:        "Handed Over",
				DriverName:    "Kagiso Mokoena",
				VehicleReg:    "JM 92 YB GP",
				Date:          now.Add(-3 * time.Hour),
			},
			{
				ID:            "man_02",
				ManifestRef:   "MAN-2026-0920-02",
				CarrierName:   "Pargo Mall Lockers",
				WaybillCount:  4,
				TotalWeightKg: 28.0,
				Status:        "Manifested",
				DriverName:    "Lwazi Nkosi",
				VehicleReg:    "ND 881-209",
				Date:          now.Add(-1 * time.Hour),
			},
		},
		FlowRules: []models.FlowRule{
			{
				ID:              "flow_1",
				Name:            "Auto-Dispatch WhatsApp Proforma on RFQ Accept",
				Trigger:         "RFQ Converted to Order",
				Condition:       "Grand Total > R2,000",
				Action:          "Send WhatsApp Proforma + PDF Proforma Link",
				Active:          true,
				ExecutionsCount: 38,
				LastTriggeredAt: now.Add(-2 * time.Hour),
			},
			{
				ID:              "flow_2",
				Name:            "Depot Low Stock Replenishment Alert",
				Trigger:         "Stock Level <= Threshold",
				Condition:       "Any Hub Location",
				Action:          "Draft Inter-Hub Transfer & Alert Warehouse Manager",
				Active:          true,
				ExecutionsCount: 14,
				LastTriggeredAt: now.Add(-5 * time.Hour),
			},
			{
				ID:              "flow_3",
				Name:            "Capitec Pay Instant Receipt & Waybill Creation",
				Trigger:         "Instant EFT / Capitec Pay Verified",
				Condition:       "Payment Status = Paid",
				Action:          "Generate Packing Slip + Book Courier Guy Collection",
				Active:          true,
				ExecutionsCount: 52,
				LastTriggeredAt: now.Add(-45 * time.Minute),
			},
		},
		MediaAssets: []models.MediaAsset{
			{
				ID:         "med_1",
				Name:       "SABS 1422 Commercial Hotel Furniture Certificate.pdf",
				Category:   "SABS Certificate",
				SizeKb:     340,
				MimeType:   "application/pdf",
				URL:        "/media/sabs_1422.pdf",
				UploadedAt: now.Add(-30 * 24 * time.Hour),
			},
			{
				ID:         "med_2",
				Name:       "MIT-3361 High-Res Studio Packshot.jpg",
				Category:   "Product Photography",
				SizeKb:     1420,
				MimeType:   "image/jpeg",
				URL:        "/media/mit3361_hero.jpg",
				UploadedAt: now.Add(-14 * 24 * time.Hour),
			},
			{
				ID:         "med_3",
				Name:       "Food Contact Grade Silicone Declaration.pdf",
				Category:   "Spec Sheet",
				SizeKb:     512,
				MimeType:   "application/pdf",
				URL:        "/media/silicone_fda.pdf",
				UploadedAt: now.Add(-10 * 24 * time.Hour),
			},
		},
		AuditLogs: []models.AuditLogEntry{
			{
				ID:        "log_1",
				Actor:     "Sipho Dlamini (Admin)",
				Action:    "Stock Transfer Dispatched",
				Entity:    "StockTransfer",
				EntityID:  "TR-8821",
				Details:   "150 units MIT-3361 dispatched via Road Freight Express to Cape Town Depot",
				Timestamp: now.Add(-6 * time.Hour),
			},
			{
				ID:        "log_2",
				Actor:     "Volume tier rule",
				Action:    "Auto-Tier Applied",
				Entity:    "ProformaOrder",
				EntityID:  "ORD-9824",
				Details:   "18% Commercial Bulk discount applied for Protea Hotel Balalaika (200 units)",
				Timestamp: now.Add(-12 * time.Hour),
			},
			{
				ID:        "log_3",
				Actor:     "Annelize de Kock",
				Action:    "Inventory Count Verified",
				Entity:    "WarehouseHub",
				EntityID:  "wh_cpt",
				Details:   "Physical cycle count completed for Cape Town Depot",
				Timestamp: now.Add(-24 * time.Hour),
			},
		},
		RecentPOSTxns: []models.POSTransaction{
			{
				ID:            "pos_1",
				ReceiptNumber: "POS-2026-0042",
				Customer:      "Walk-in Trade (Sandton Lodge)",
				TotalZar:      1144.00,
				PaymentMethod: "Capitec Pay QR",
				Timestamp:     now.Add(-45 * time.Minute),
				Items: []models.POSItem{
					{
						SKU:      "MIT-3361",
						Title:    "Commercial Anti-Theft Wooden Male Hanger 44cm",
						PriceZar: 22.88,
						Quantity: 50,
						TotalZar: 1144.00,
					},
				},
			},
			{
				ID:            "pos_2",
				ReceiptNumber: "POS-2026-0041",
				Customer:      "Walk-in Trade (Midrand Deli)",
				TotalZar:      150.00,
				PaymentMethod: "Speedpoint Card Terminal",
				Timestamp:     now.Add(-3 * time.Hour),
				Items: []models.POSItem{
					{
						SKU:      "MIT-8609",
						Title:    "101mm Silicone Clip-On-Lid Food Safe SABS",
						PriceZar: 1.50,
						Quantity: 100,
						TotalZar: 150.00,
					},
				},
			},
		},
		ItemLedger: []models.ItemLedgerEntry{
			{
				ID:           "ile_1",
				EntryNumber:  4021,
				PostingDate:  now.Add(-2 * time.Hour),
				EntryType:    "Negative Adjmt.",
				DocumentNo:   "ADJ-2026-09",
				SKU:          "MIT-8610",
				Description:  "Measuring Teaspoon 1ml Clear Dosage Spoon",
				Location:     "MIDRAND-01",
				Quantity:     -15,
				RemainingQty: 0,
				CostAmount:   -9.75,
			},
			{
				ID:           "ile_2",
				EntryNumber:  4020,
				PostingDate:  now.Add(-5 * time.Hour),
				EntryType:    "Sale Shipment",
				DocumentNo:   "ORD-9823",
				SKU:          "MIT-3361",
				Description:  "Commercial Anti-Theft Wooden Male Hanger 44cm",
				Location:     "MIDRAND-01",
				Quantity:     -200,
				RemainingQty: 450,
				CostAmount:   -4576.00,
			},
			{
				ID:           "ile_3",
				EntryNumber:  4019,
				PostingDate:  now.Add(-14 * time.Hour),
				EntryType:    "Assembly Consumption",
				DocumentNo:   "ASM-1082",
				SKU:          "MIT-2088",
				Description:  "Anti-Theft Security Replacement Ring 38mm Chrome",
				Location:     "MIDRAND-01",
				Quantity:     -100,
				RemainingQty: 1200,
				CostAmount:   -685.00,
			},
			{
				ID:           "ile_4",
				EntryNumber:  4018,
				PostingDate:  now.Add(-24 * time.Hour),
				EntryType:    "Purchase Receipt",
				DocumentNo:   "PO-7712",
				SKU:          "MIT-8609",
				Description:  "101mm Silicone Clip-On-Lid Food Safe SABS",
				Location:     "MIDRAND-01",
				Quantity:     1000,
				RemainingQty: 3000,
				CostAmount:   1500.00,
			},
			{
				ID:           "ile_5",
				EntryNumber:  4017,
				PostingDate:  now.Add(-36 * time.Hour),
				EntryType:    "Positive Adjmt.",
				DocumentNo:   "CYCLE-09",
				SKU:          "MIT-3361",
				Description:  "Commercial Anti-Theft Wooden Male Hanger 44cm",
				Location:     "CPT-DOCK",
				Quantity:     50,
				RemainingQty: 50,
				CostAmount:   1144.00,
			},
		},
		ChatThreads: []models.ChatThread{
			{
				ID:            "conv_protea",
				BuyerID:       "buyer_protea_01",
				BuyerName:     "Sipho Dlamini",
				BuyerCompany:  "Protea Hotel Balalaika Sandton",
				BuyerCity:     "Sandton, JHB",
				Channel:       "Shoppage DM",
				UnreadCount:   1,
				LastMessage:   "Can we get 200 wooden hangers delivered to Sandton before Thursday?",
				LastTime:      "10:24",
				AvatarInit:    "SD",
				Online:        true,
				DealContext:   "RFQ #1042 — 200x Anti-Theft Wooden Hangers (MIT-3361)",
				DealAmount:    4735.70,
				DealStatus:    "Proforma Issued",
				AssignedAgent: "Sipho Dlamini (Midrand Sales Desk)",
				Messages: []models.ChatMessage{
					{
						ID:         "msg_p1",
						SenderID:   "buyer_protea_01",
						SenderName: "Sipho Dlamini",
						SenderRole: "buyer",
						Text:       "Good morning! We are currently refurbishing 40 executive guest suites at Protea Balalaika.",
						Timestamp:  now.Add(-45 * time.Minute),
						IsMerchant: false,
					},
					{
						ID:             "msg_p_whisper1",
						SenderID:       "staff_nomsa",
						SenderName:     "Nomsa Sithole (Midrand Inventory)",
						SenderRole:     "merchant",
						Text:           "Physical stock count verified at Bay 4: 450 units on hand. 200 units ready to lock without affecting standard trade floor orders.",
						Timestamp:      now.Add(-40 * time.Minute),
						IsMerchant:     true,
						IsInternalNote: true,
						CardType:       "note",
					},
					{
						ID:         "msg_p2",
						SenderID:   "loc_mitrend_midrand",
						SenderName: profile.Name,
						SenderRole: "merchant",
						Text:       "Sawubona Sipho! Congratulations on the project. We have 450 units of the MIT-3361 commercial anti-theft hangers in stock at our Midrand central warehouse.",
						Timestamp:  now.Add(-30 * time.Minute),
						IsMerchant: true,
					},
					{
						ID:         "msg_p3",
						SenderID:   "buyer_protea_01",
						SenderName: "Sipho Dlamini",
						SenderRole: "buyer",
						Text:       "Can we get 200 wooden hangers delivered to Sandton before Thursday?",
						Timestamp:  now.Add(-15 * time.Minute),
						IsMerchant: false,
					},
					{
						ID:         "msg_p_stock",
						SenderID:   "system_warehouse",
						SenderName: "Midrand Hub Warehouse",
						SenderRole: "system",
						Text:       "Stock Lock active: 200 units reserved in Bay 4 for Protea Hotel Balalaika.",
						Timestamp:  now.Add(-10 * time.Minute),
						IsMerchant: true,
						CardType:   "stock_lock",
						StockLock: &models.StockLockInfo{
							SKU:          "MIT-3361",
							ProductTitle: "Commercial Anti-Theft Wooden Male Hanger 44cm",
							Quantity:     200,
							Warehouse:    "Midrand Central Hub, Bay 4",
							LockID:       "LCK-MID-0814",
							ExpiresAt:    now.Add(2 * time.Hour),
							Status:       "Active (2 Hours Remaining)",
						},
					},
					{
						ID:         "msg_p4",
						SenderID:   "loc_mitrend_midrand",
						SenderName: profile.Name,
						SenderRole: "merchant",
						Text:       "Yes absolutely! I have generated a formal wholesale quotation for 200 units with our 10% commercial volume tier applied.",
						Timestamp:  now.Add(-5 * time.Minute),
						IsMerchant: true,
						HasQuote:   true,
						CardType:   "quote",
						Quote: &models.StructuredQuote{
							ID:           "quo_8814",
							QuoteNumber:  "QUO-2026-0814",
							SKU:          "MIT-3361",
							ProductTitle: "Commercial Anti-Theft Wooden Male Hanger 44cm",
							Quantity:     200,
							UnitPriceZar: 20.59,
							SubtotalZar:  4118.00,
							VATZar:       617.70,
							TotalZar:     4735.70,
							Status:       "Sent",
							ValidUntil:   now.Add(7 * 24 * time.Hour),
						},
					},
				},
			},
			{
				ID:            "conv_goldreef",
				BuyerID:       "buyer_goldreef_02",
				BuyerName:     "Lindiwe Zulu",
				BuyerCompany:  "Gold Reef City Casino & Hotel",
				BuyerCity:     "Ormonde, JHB",
				Channel:       "Shoppage DM",
				UnreadCount:   0,
				LastMessage:   "Proforma approved, Standard Bank EFT payment dispatched.",
				LastTime:      "Yesterday",
				AvatarInit:    "LZ",
				Online:        false,
				DealContext:   "RFQ #1039 — 300x Chrome Replacement Security Rings (MIT-2088)",
				DealAmount:    6870.00,
				DealStatus:    "Stock Reserved",
				AssignedAgent: "Nomsa Sithole (Crown Mines)",
				Messages: []models.ChatMessage{
					{
						ID:         "msg_g1",
						SenderID:   "buyer_goldreef_02",
						SenderName: "Lindiwe Zulu",
						SenderRole: "buyer",
						Text:       "Hi Mitrend, we urgently need 300 chrome replacement security rings (MIT-2088) for the main hotel tower.",
						Timestamp:  now.Add(-26 * time.Hour),
						IsMerchant: false,
					},
					{
						ID:         "msg_g2",
						SenderID:   "loc_mitrend_midrand",
						SenderName: profile.Name,
						SenderRole: "merchant",
						Text:       "Hi Lindiwe, 300 units are picked and reserved. Ready for same-day dispatch via The Courier Guy.",
						Timestamp:  now.Add(-25 * time.Hour),
						IsMerchant: true,
					},
					{
						ID:         "msg_g3",
						SenderID:   "buyer_goldreef_02",
						SenderName: "Lindiwe Zulu",
						SenderRole: "buyer",
						Text:       "Proforma approved, Standard Bank EFT payment dispatched.",
						Timestamp:  now.Add(-20 * time.Hour),
						IsMerchant: false,
					},
					{
						ID:         "msg_g_pop",
						SenderID:   "buyer_goldreef_02",
						SenderName: "Lindiwe Zulu",
						SenderRole: "buyer",
						Text:       "Bank POP remittance slip attached for Proforma #INV-2088.",
						Timestamp:  now.Add(-18 * time.Hour),
						IsMerchant: false,
						CardType:   "pop_verification",
						PaymentProof: &models.PaymentProofInfo{
							BankName:        "Standard Bank South Africa",
							AccountHolder:   "Gold Reef City Casino (Tsogo Sun Group)",
							AmountZar:       6870.00,
							ReferenceNumber: "INV-2088-GRC",
							Verified:        true,
							VerifiedBy:      "Finance (Nomsa Sithole)",
							ProofFileName:   "StandardBank_EFT_INV-2088-GRC.pdf",
						},
					},
				},
			},
			{
				ID:            "conv_buildmax",
				BuyerID:       "buyer_buildmax_03",
				BuyerName:     "Johan van der Merwe",
				BuyerCompany:  "Buildmax Commercial Supplies",
				BuyerCity:     "Centurion, PTA",
				Channel:       "WhatsApp Business API",
				UnreadCount:   0,
				LastMessage:   "Do the silicone lids carry SABS food-safe compliance certificates?",
				LastTime:      "2 days ago",
				AvatarInit:    "JV",
				Online:        true,
				DealContext:   "Inquiry #1045 — 500x SABS Food-Safe Silicone Lids (MIT-8609)",
				DealAmount:    12450.00,
				DealStatus:    "Negotiating",
				AssignedAgent: "Sipho Dlamini (Technical Sales)",
				Messages: []models.ChatMessage{
					{
						ID:         "msg_b1",
						SenderID:   "buyer_buildmax_03",
						SenderName: "Johan van der Merwe",
						SenderRole: "buyer",
						Text:       "Do the silicone lids carry SABS food-safe compliance certificates?",
						Timestamp:  now.Add(-48 * time.Hour),
						IsMerchant: false,
					},
					{
						ID:         "msg_b2",
						SenderID:   "loc_mitrend_midrand",
						SenderName: profile.Name,
						SenderRole: "merchant",
						Text:       "Yes Johan, all MIT-8609 lids are tested to SABS SANS 460 standards. Test report is available in our compliance vault.",
						Timestamp:  now.Add(-47 * time.Hour),
						IsMerchant: true,
					},
				},
			},
		},
		ActiveThreadID: "conv_protea",
	}
	seedDemo(st, now)
	return st
}

// Handler coordinates merchant requests
type Handler struct {
	state *MerchantStoreState
	cfg   config.Config
}

// NewHandler creates a new Handler instance using environment configuration.
func NewHandler(state *MerchantStoreState) *Handler {
	return &Handler{state: state, cfg: config.Load()}
}

// NewHandlerWithConfig creates a Handler with an explicit configuration.
func NewHandlerWithConfig(state *MerchantStoreState, cfg config.Config) *Handler {
	return &Handler{state: state, cfg: cfg}
}

// computeNavContext derives every badge/count shown in the workspace shell from
// live state. Callers must hold at least the read lock; this function never locks.
func computeNavContext(cfg config.Config, state *MerchantStoreState) models.NavContext {
	nav := models.NavContext{PublicBaseURL: cfg.PublicBaseURL, DemoData: state.Demo}
	for _, o := range state.Orders {
		switch strings.ToLower(o.Status) {
		case "dispatched", "delivered", "collected", "cancelled", "refunded":
			// closed orders do not need attention
		default:
			nav.OpenOrders++
		}
	}
	for _, item := range state.Catalog {
		if item.LowStockAlert > 0 && item.StockQuantity <= item.LowStockAlert {
			nav.LowStock++
		}
	}
	for _, thread := range state.ChatThreads {
		nav.UnreadThreads += thread.UnreadCount
	}
	for _, lead := range state.Leads {
		if lead.Status == "new" || lead.Status == "quoted" {
			nav.OpenQuotes++
		}
		if lead.Status == "new" {
			nav.NewQuotes++
		}
	}
	for _, r := range computeReadiness(state) {
		if r.ReadyCount() < len(models.ListingChannels) {
			nav.ListingIssues++
		}
	}
	return nav
}

// getViewData prepares a complete copy of view data under read lock.
func (h *Handler) getViewData(activeTab string) models.DashboardViewData {
	return h.getViewDataFor(activeTab, nil)
}

// getViewDataFor is getViewData plus the request's list filters and user.
func (h *Handler) getViewDataFor(activeTab string, r *http.Request) models.DashboardViewData {
	now := time.Now().UTC()
	h.state.mu.Lock()
	h.state.Proposals = buildProposals(h.state, now)
	h.state.mu.Unlock()

	h.state.mu.RLock()
	defer h.state.mu.RUnlock()

	readiness := computeReadiness(h.state)
	nav := computeNavContext(h.cfg, h.state)
	query := map[string]string{}
	if r != nil {
		for k, v := range r.URL.Query() {
			if len(v) > 0 {
				query[k] = v[0]
			}
		}
		nav.UserEmail = auth.SessionEmail(r)
	}

	return models.DashboardViewData{
		Store:           h.state.Store,
		ActiveTab:       activeTab,
		Catalog:         h.state.Catalog,
		Leads:           h.state.Leads,
		Orders:          sortedOrders(h.state.Orders),
		ReturnRequests:  h.state.ReturnRequests,
		Warehouses:      h.state.Warehouses,
		Customers:       h.state.Customers,
		WholesaleTiers:  h.state.WholesaleTiers,
		Coupons:         h.state.Coupons,
		Channels:        h.state.Channels,
		CopilotMessages: h.state.CopilotMessages,
		Analytics:       h.state.Analytics,
		Transfers:       h.state.Transfers,
		Manifests:       h.state.Manifests,
		FlowRules:       h.state.FlowRules,
		MediaAssets:     h.state.MediaAssets,
		AuditLogs:       h.state.AuditLogs,
		RecentPOSTxns:   h.state.RecentPOSTxns,
		ItemLedger:      h.state.ItemLedger,
		ChatThreads:     h.state.ChatThreads,
		ActiveThreadID:  h.state.ActiveThreadID,
		Nav:             nav,
		Metrics:         computeMetrics(h.state, readiness, now),
		Proposals:       append([]models.Proposal(nil), h.state.Proposals...),
		Readiness:       readiness,
		Query:           query,
	}
}

// sortedOrders returns orders newest first without mutating state.
func sortedOrders(in []models.ProformaOrder) []models.ProformaOrder {
	out := append([]models.ProformaOrder(nil), in...)
	sort.SliceStable(out, func(a, b int) bool { return out[a].Date.After(out[b].Date) })
	return out
}

// actor names the signed-in user for audit entries.
func (h *Handler) actor(r *http.Request) string {
	if e := auth.SessionEmail(r); e != "" {
		return e
	}
	return "Workspace user"
}

// ServeDashboard renders the full dashboard HTML, optionally for a specific tab
func (h *Handler) ServeDashboard(w http.ResponseWriter, r *http.Request) {
	tab := r.URL.Query().Get("tab")
	if tab == "" {
		tab = "overview"
	}
	data := h.getViewDataFor(tab, r)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.RenderDashboard(w, data)
}

// ServeLogin renders the standalone Merchant OS login page (public route).
func (h *Handler) ServeLogin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = io.WriteString(w, loginPageHTML)
}

// Login validates platform admin credentials and issues a signed session cookie.
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid form", http.StatusBadRequest)
		return
	}
	email := strings.TrimSpace(r.FormValue("email"))
	password := r.FormValue("password")
	if !auth.VerifyPassword(email, password) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = io.WriteString(w, loginPageHTMLWith("Invalid email or password."))
		return
	}
	// Development may have bootstrapped credentials in EnsureLocalAuth; re-check
	// via VerifyPassword first so a valid local login is never rejected on length.
	secret := os.Getenv("SHOPPAGE_AUTH_SECRET")
	if len(secret) < 32 {
		if !auth.IsProduction() {
			auth.EnsureLocalAuth()
			secret = os.Getenv("SHOPPAGE_AUTH_SECRET")
		}
	}
	if len(secret) < 32 {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusServiceUnavailable)
		_, _ = io.WriteString(w, loginPageHTMLWith("Server auth is not configured yet — set SHOPPAGE_AUTH_SECRET (32+ characters)."))
		return
	}
	token, err := auth.EncodeSession(strings.ToLower(email), []byte(secret))
	if err != nil {
		http.Error(w, "session error", http.StatusInternalServerError)
		return
	}
	// TLS terminates at Caddy in production, so r.TLS is nil there; the
	// cookie must still be Secure.
	auth.SetSessionCookie(w, token, r.TLS != nil || auth.IsProduction())
	// /desk resolves to the dashboard both standalone and behind the gateway,
	// where "/" is the consumer home page.
	http.Redirect(w, r, "/desk", http.StatusSeeOther)
}

// Logout clears the session cookie and returns the client to /login.
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	auth.ClearSessionCookie(w)
	http.Redirect(w, r, "/login", http.StatusSeeOther)
}

// loginPageHTML is the minimal standalone login shell (no nav, no session needed).
const loginPageHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Merchant OS — Sign in</title>
<style>
:root { color-scheme: light; }
* { box-sizing: border-box; }
body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: #0f172a; color:#e2e8f0; }
.card { width:min(380px, 92vw); background:#1e293b; border:1px solid #334155;
  border-radius:14px; padding:2rem; }
h1 { margin:0 0 .25rem; font-size:1.25rem; font-weight:600; color:#f8fafc; }
p.sub { margin:0 0 1.5rem; color:#94a3b8; font-size:.875rem; }
label { display:block; font-size:.8rem; font-weight:500; color:#94a3b8; margin-bottom:.35rem; }
input { width:100%; padding:.6rem .75rem; margin-bottom:1rem; border-radius:8px;
  border:1px solid #334155; background:#0f172a; color:#f1f5f9; font-size:.95rem; }
input:focus { outline:2px solid #3b82f6; outline-offset:1px; border-color:#3b82f6; }
button { width:100%; padding:.65rem; border:none; border-radius:8px; cursor:pointer;
  background:#3b82f6; color:#fff; font-size:.95rem; font-weight:600; }
button:hover { background:#2563eb; }
.err { background:#7f1d1d; border:1px solid #b91c1c; color:#fecaca;
  padding:.55rem .75rem; border-radius:8px; font-size:.85rem; margin-bottom:1rem; }
</style>
</head>
<body>
<div class="card">
  <h1>Merchant OS</h1>
  <p class="sub">Sign in to manage your storefront.</p>
  <form method="POST" action="/auth/login">
    <label for="email">Email</label>
    <input id="email" name="email" type="email" required autocomplete="username"/>
    <label for="password">Password</label>
    <input id="password" name="password" type="password" required autocomplete="current-password"/>
    <button type="submit">Sign in</button>
  </form>
</div>
</body>
</html>`

// loginPageHTMLWith embeds an optional error banner into the login shell.
func loginPageHTMLWith(msg string) string {
	const marker = `<p class="sub">Sign in to manage your storefront.</p>`
	errBox := `<div class="err">` + htmlEscape(msg) + `</div>`
	return strings.Replace(loginPageHTML, marker, errBox+marker, 1)
}

// htmlEscape guards against reflected markup in the login error banner.
func htmlEscape(s string) string {
	r := strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;", `"`, "&quot;", "'", "&#39;")
	return r.Replace(s)
}

// ServeFavicon serves the classic Shoppage logo favicon for browser address bar and tabs
func (h *Handler) ServeFavicon(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "image/svg+xml")
	w.Header().Set("Cache-Control", "public, max-age=86400")
	svg := `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="sp-brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="sp-bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#sp-brand-grad)"/>
  <path d="M8.5 12C8.5 10.8954 9.39543 10 10.5 10H21.5C22.6046 10 23.5 10.8954 23.5 12L24.5 24C24.5 25.1046 23.6046 26 22.5 26H9.5C8.39543 26 7.5 25.1046 7.5 24L8.5 12Z" fill="#FFFFFF"/>
  <path d="M12 10V7.5C12 5.567 13.567 4 15.5 4H16.5C18.433 4 20 5.567 20 7.5V10" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M17 12L12 18H16L15 24L20 17H16.2L17 12Z" fill="url(#sp-bolt-grad)"/>
</svg>`
	w.Write([]byte(svg))
}

// ServeTab renders tab partials for HTMX swaps, or full dashboard layout on direct browser refresh
func (h *Handler) ServeTab(w http.ResponseWriter, r *http.Request) {
	tab := chi.URLParam(r, "tab")
	if tab == "" {
		tab = "overview"
	}
	if !templates.KnownTab(tab) {
		h.ServeNotFound(w, r)
		return
	}

	data := h.getViewDataFor(tab, r)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// If request is from browser address bar or F5 refresh (non-HTMX), render the full dashboard layout shell
	if r.Header.Get("HX-Request") == "" {
		_ = templates.RenderDashboard(w, data)
		return
	}

	_ = templates.RenderTabPartial(w, tab, data)
}

// ServeInvoiceModal renders the South African tax proforma invoice modal
func (h *Handler) ServeInvoiceModal(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "id")

	h.state.mu.RLock()
	var target models.ProformaOrder
	found := false
	for _, ord := range h.state.Orders {
		if ord.ID == orderID {
			target = ord
			found = true
			break
		}
	}
	store := h.state.Store
	h.state.mu.RUnlock()

	if !found {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.RenderProformaInvoice(w, store, target)
}

// CreateCustomer adds a new trade account to the CRM
func (h *Handler) CreateCustomer(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	company := r.FormValue("company")
	contact := r.FormValue("contactName")
	phone := r.FormValue("phone")
	email := r.FormValue("email")
	city := r.FormValue("city")
	tier := r.FormValue("tier")
	cipc := r.FormValue("cipc")
	vatNumber := r.FormValue("vatNumber")
	creditLimit, _ := strconv.ParseFloat(r.FormValue("creditLimit"), 64)

	if strings.TrimSpace(company) == "" {
		setToast(w, "Enter the customer's company or name.", "")
		h.renderTab(w, r, "customers")
		return
	}
	now := time.Now().UTC()
	newCust := models.CustomerAccount{
		ID:               fmt.Sprintf("cust_%d", now.UnixNano()),
		Company:          strings.TrimSpace(company),
		ContactName:      strings.TrimSpace(contact),
		Phone:            strings.TrimSpace(phone),
		Email:            strings.TrimSpace(email),
		City:             strings.TrimSpace(city),
		Tier:             tier,
		CreditLimit:      creditLimit,
		CIPCRegistration: strings.TrimSpace(cipc),
		VATNumber:        strings.TrimSpace(vatNumber),
	}

	h.state.mu.Lock()
	h.state.Customers = append([]models.CustomerAccount{newCust}, h.state.Customers...)
	h.state.audit(h.actor(r), "Customer added", "CustomerAccount", newCust.ID, newCust.Company, now)
	h.state.mu.Unlock()

	setToast(w, newCust.Company+" added.", "")
	h.renderTab(w, r, "customers")
}

// ToggleCoupon pauses or activates a coupon
func (h *Handler) ToggleCoupon(w http.ResponseWriter, r *http.Request) {
	coupID := chi.URLParam(r, "id")

	h.state.mu.Lock()
	for i := range h.state.Coupons {
		if h.state.Coupons[i].ID == coupID {
			h.state.Coupons[i].Active = !h.state.Coupons[i].Active
			break
		}
	}
	h.state.mu.Unlock()

	data := h.getViewData("discounts")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.RenderTabPartial(w, "discounts", data)
}

// CreateCoupon adds a new promo code
func (h *Handler) CreateCoupon(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	code := r.FormValue("code")
	discountPct, _ := strconv.ParseFloat(r.FormValue("discountPct"), 64)
	desc := r.FormValue("description")

	newCoup := models.CouponCode{
		ID:          fmt.Sprintf("coup_%d", time.Now().UnixNano()%10000),
		Code:        code,
		DiscountPct: discountPct,
		Description: desc,
		UsageCount:  0,
		Active:      true,
		ExpiryDate:  time.Now().UTC().Add(90 * 24 * time.Hour),
	}

	h.state.mu.Lock()
	h.state.Coupons = append([]models.CouponCode{newCoup}, h.state.Coupons...)
	h.state.mu.Unlock()

	data := h.getViewData("discounts")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.RenderTabPartial(w, "discounts", data)
}

// ToggleFlowRule toggles an event-driven automation rule
func (h *Handler) ToggleFlowRule(w http.ResponseWriter, r *http.Request) {
	ruleID := chi.URLParam(r, "id")

	h.state.mu.Lock()
	for i := range h.state.FlowRules {
		if h.state.FlowRules[i].ID == ruleID {
			h.state.FlowRules[i].Active = !h.state.FlowRules[i].Active
			break
		}
	}
	h.state.mu.Unlock()

	data := h.getViewData("flow")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.RenderTabPartial(w, "flow", data)
}

// CreateFlowRule registers a new event-driven automation rule
func (h *Handler) CreateFlowRule(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	name := r.FormValue("name")
	trigger := r.FormValue("trigger")
	condition := r.FormValue("condition")
	action := r.FormValue("action")

	if name == "" {
		name = "Custom Flow Rule"
	}

	h.state.mu.Lock()
	newRule := models.FlowRule{
		ID:        fmt.Sprintf("flow_%d", time.Now().UnixNano()%10000),
		Name:      name,
		Trigger:   trigger,
		Condition: condition,
		Action:    action,
		Active:    true,
	}
	h.state.FlowRules = append([]models.FlowRule{newRule}, h.state.FlowRules...)

	log := models.AuditLogEntry{
		ID:        fmt.Sprintf("log_%d", time.Now().UnixNano()%10000),
		Actor:     h.actor(r),
		Action:    "Flow Rule Created",
		Entity:    "FlowRule",
		EntityID:  newRule.ID,
		Details:   fmt.Sprintf("Created automation '%s' (Trigger: %s -> Action: %s)", name, trigger, action),
		Timestamp: time.Now().UTC(),
	}
	h.state.AuditLogs = append([]models.AuditLogEntry{log}, h.state.AuditLogs...)
	h.state.mu.Unlock()

	data := h.getViewData("flow")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.RenderTabPartial(w, "flow", data)
}

// CreateMediaAsset handles a real file upload (multipart form) or the registration
// of an externally hosted asset by URL. Uploaded files are written to disk under
// cfg.DataDir/media/<storeID>/ and served back via ServeMediaFile. The previous
// implementation recorded a URL without ever receiving a file, which made every
// metric on this screen fabricated; sizes and counts are now computed from records.
func (h *Handler) CreateMediaAsset(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 20<<20) // 20 MB cap
	if err := r.ParseMultipartForm(20 << 20); err != nil {
		_ = r.ParseForm() // url-encoded fallback: registering an externally hosted asset
	}

	name := strings.TrimSpace(r.FormValue("name"))
	category := strings.TrimSpace(r.FormValue("category"))
	if category == "" {
		category = "Product Photography"
	}
	// Linking a file to a product records its SKU in the name, which is how
	// listings find their photo (see hasProductPhoto).
	linkSKU := strings.TrimSpace(r.FormValue("sku"))
	now := time.Now().UTC()

	var asset models.MediaAsset
	file, header, fileErr := r.FormFile("file")
	if fileErr == nil && file != nil && header.Filename != "" {
		defer file.Close()
		data, err := io.ReadAll(io.LimitReader(file, 20<<20))
		if err != nil || len(data) == 0 {
			http.Error(w, "Could not read the uploaded file", http.StatusBadRequest)
			return
		}
		ext, mime, ok := allowedMediaFile(header.Filename)
		if !ok {
			http.Error(w, "Unsupported file type. Allowed: PDF, JPG, PNG, WEBP", http.StatusUnsupportedMediaType)
			return
		}
		if name == "" {
			name = header.Filename
		}
		if linkSKU != "" && !strings.Contains(strings.ToUpper(name), strings.ToUpper(linkSKU)) {
			name = linkSKU + " " + name
		}
		assetID := fmt.Sprintf("med_%d", now.UnixNano()%100000000)
		relDir := filepath.Join("media", h.state.Store.ID)
		if err := os.MkdirAll(filepath.Join(h.cfg.DataDir, relDir), 0o755); err != nil {
			http.Error(w, "Storage is not available on this node", http.StatusInternalServerError)
			return
		}
		relPath := filepath.Join(relDir, assetID+ext)
		if err := os.WriteFile(filepath.Join(h.cfg.DataDir, relPath), data, 0o644); err != nil {
			http.Error(w, "Could not store the file", http.StatusInternalServerError)
			return
		}
		asset = models.MediaAsset{
			ID:         assetID,
			Name:       name,
			Category:   category,
			SizeKb:     (len(data) + 1023) / 1024,
			MimeType:   mime,
			URL:        "/media/files/" + assetID,
			LocalPath:  relPath,
			UploadedAt: now,
		}
	} else {
		url := strings.TrimSpace(r.FormValue("url"))
		if url == "" {
			http.Error(w, "Provide a file to upload, or a URL for an externally hosted asset", http.StatusBadRequest)
			return
		}
		if name == "" {
			name = filepath.Base(url)
		}
		sizeKb, _ := strconv.Atoi(r.FormValue("sizeKb"))
		asset = models.MediaAsset{
			ID:         fmt.Sprintf("med_%d", now.UnixNano()%100000000),
			Name:       name,
			Category:   category,
			SizeKb:     sizeKb,
			MimeType:   r.FormValue("mimeType"),
			URL:        url,
			UploadedAt: now,
		}
	}

	h.state.mu.Lock()
	h.state.MediaAssets = append([]models.MediaAsset{asset}, h.state.MediaAssets...)
	h.state.AuditLogs = append([]models.AuditLogEntry{{
		ID:        fmt.Sprintf("log_%d", now.UnixNano()%100000),
		Actor:     h.state.Store.Name,
		Action:    "Media Asset Registered",
		Entity:    "MediaAsset",
		EntityID:  asset.ID,
		Details:   fmt.Sprintf("Registered '%s' (%s, %d KB)", asset.Name, asset.Category, asset.SizeKb),
		Timestamp: now,
	}}, h.state.AuditLogs...)
	h.state.mu.Unlock()

	data := h.getViewData("media")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.RenderTabPartial(w, "media", data)
}

// ServeMediaFile streams a previously uploaded asset from local disk. Only assets
// registered in state are served, and only by ID, so no path can be requested
// directly.
func (h *Handler) ServeMediaFile(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	h.state.mu.RLock()
	var asset *models.MediaAsset
	for i := range h.state.MediaAssets {
		if h.state.MediaAssets[i].ID == id {
			a := h.state.MediaAssets[i]
			asset = &a
			break
		}
	}
	h.state.mu.RUnlock()

	if asset == nil || asset.LocalPath == "" {
		http.NotFound(w, r)
		return
	}
	abs := filepath.Join(h.cfg.DataDir, filepath.FromSlash(asset.LocalPath))
	if fi, err := os.Stat(abs); err != nil || fi.IsDir() {
		http.NotFound(w, r)
		return
	}
	if asset.MimeType != "" {
		w.Header().Set("Content-Type", asset.MimeType)
	}
	w.Header().Set("Cache-Control", "private, max-age=3600")
	http.ServeFile(w, r, abs)
}

// allowedMediaFile validates an uploaded file name against the supported formats
// and returns the normalised extension and MIME type.
func allowedMediaFile(filename string) (ext, mime string, ok bool) {
	switch strings.ToLower(filepath.Ext(filename)) {
	case ".pdf":
		return ".pdf", "application/pdf", true
	case ".jpg", ".jpeg":
		return ".jpg", "image/jpeg", true
	case ".png":
		return ".png", "image/png", true
	case ".webp":
		return ".webp", "image/webp", true
	}
	return "", "", false
}

// SaveEditorSettings saves the public store page content and search snippet.
func (h *Handler) SaveEditorSettings(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	now := time.Now().UTC()
	str := func(k string) string { return strings.TrimSpace(r.FormValue(k)) }
	h.state.mu.Lock()
	sf := &h.state.Store.Storefront
	sf.Headline, sf.About, sf.Ribbon = str("heroHeadline"), str("about"), str("ribbonText")
	sf.RibbonOn = r.FormValue("ribbonActive") != ""
	sf.WhatsAppButton = r.FormValue("whatsappFloat") != ""
	sf.SEOTitle, sf.SEODescription, sf.TradingHours = str("seoTitle"), str("seoDescription"), str("tradingHours")
	h.state.audit(h.actor(r), "Store page updated", "StorefrontSettings", h.state.Store.ID, "Headline, description and search snippet saved", now)
	h.state.mu.Unlock()
	setToast(w, "Store page saved.", "")
	h.renderTab(w, r, "editor")
}

// ExportInventoryCSV streams a live CSV audit report of catalog stock
func (h *Handler) ExportInventoryCSV(w http.ResponseWriter, r *http.Request) {
	h.state.mu.RLock()
	defer h.state.mu.RUnlock()

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=\"inventory-audit.csv\"")

	writer := csv.NewWriter(w)
	_ = writer.Write([]string{"SKU", "Title", "Category", "StockOnHand", "WholesaleZar", "RetailZar", "LowStockAlert", "Status", "Barcode"})
	for _, item := range h.state.Catalog {
		status := "In Stock"
		if !item.InStock {
			status = "Out of Stock"
		}
		_ = writer.Write([]string{
			item.SKU,
			item.Title,
			item.Category,
			strconv.Itoa(item.StockQuantity),
			fmt.Sprintf("%.2f", item.WholesaleZar),
			fmt.Sprintf("%.2f", item.RetailZar),
			strconv.Itoa(item.LowStockAlert),
			status,
			item.Spec.Barcode,
		})
	}
	writer.Flush()
}

// ExportCatalogCSV streams full catalog export
func (h *Handler) ExportCatalogCSV(w http.ResponseWriter, r *http.Request) {
	h.state.mu.RLock()
	defer h.state.mu.RUnlock()

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=\"catalog-skus.csv\"")

	writer := csv.NewWriter(w)
	_ = writer.Write([]string{"SKU", "Title", "Brand", "Category", "WholesaleZar", "RetailZar", "StockQuantity", "Barcode", "HSCode", "FeedStatus"})
	for _, item := range h.state.Catalog {
		_ = writer.Write([]string{
			item.SKU,
			item.Title,
			item.Brand,
			item.Category,
			fmt.Sprintf("%.2f", item.WholesaleZar),
			fmt.Sprintf("%.2f", item.RetailZar),
			strconv.Itoa(item.StockQuantity),
			item.Spec.Barcode,
			item.Spec.HSCode,
			item.FeedStatus,
		})
	}
	writer.Flush()
}

// ExportCustomersCSV streams verified B2B customer accounts
func (h *Handler) ExportCustomersCSV(w http.ResponseWriter, r *http.Request) {
	h.state.mu.RLock()
	defer h.state.mu.RUnlock()

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=\"b2b-customers-crm.csv\"")

	writer := csv.NewWriter(w)
	_ = writer.Write([]string{"Company", "ContactName", "Phone", "Email", "City", "Tier", "CIPCRegistration", "VATNumber", "TotalSpendZar", "CreditLimit", "BalanceZar", "OrderCount"})
	for _, cust := range h.state.Customers {
		_ = writer.Write([]string{
			cust.Company,
			cust.ContactName,
			cust.Phone,
			cust.Email,
			cust.City,
			cust.Tier,
			cust.CIPCRegistration,
			cust.VATNumber,
			fmt.Sprintf("%.2f", cust.TotalSpendZar),
			fmt.Sprintf("%.2f", cust.CreditLimit),
			fmt.Sprintf("%.2f", cust.BalanceZar),
			strconv.Itoa(cust.OrderCount),
		})
	}
	writer.Flush()
}

// ExportAuditLogsCSV streams immutable audit trail logs
func (h *Handler) ExportAuditLogsCSV(w http.ResponseWriter, r *http.Request) {
	h.state.mu.RLock()
	defer h.state.mu.RUnlock()

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=\"audit-trail.csv\"")

	writer := csv.NewWriter(w)
	_ = writer.Write([]string{"Timestamp", "Actor", "Action", "TargetEntity", "EntityID", "Details"})
	for _, log := range h.state.AuditLogs {
		_ = writer.Write([]string{
			log.Timestamp.Format(time.RFC3339),
			log.Actor,
			log.Action,
			log.Entity,
			log.EntityID,
			log.Details,
		})
	}
	writer.Flush()
}

// CreateWholesaleTier adds a new tier pricing rule to the pricing matrix
func (h *Handler) CreateWholesaleTier(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	name := r.FormValue("tierName")
	minUnits, _ := strconv.Atoi(r.FormValue("minUnits"))
	maxUnits, _ := strconv.Atoi(r.FormValue("maxUnits"))
	discountPct, _ := strconv.ParseFloat(r.FormValue("discountPct"), 64)
	desc := r.FormValue("description")

	if name == "" {
		name = "Volume Trade Tier"
	}
	if minUnits <= 0 {
		minUnits = 50
	}

	h.state.mu.Lock()
	newTier := models.WholesaleTier{
		ID:          fmt.Sprintf("tier_%d", time.Now().UnixNano()%10000),
		TierName:    name,
		MinUnits:    minUnits,
		MaxUnits:    maxUnits,
		DiscountPct: discountPct,
		Description: desc,
	}
	h.state.WholesaleTiers = append(h.state.WholesaleTiers, newTier)

	log := models.AuditLogEntry{
		ID:        fmt.Sprintf("log_%d", time.Now().UnixNano()%10000),
		Actor:     h.actor(r),
		Action:    "Wholesale Tier Added",
		Entity:    "WholesaleTier",
		EntityID:  newTier.ID,
		Details:   fmt.Sprintf("Created '%s' (Min %d units, -%.1f%% discount)", name, minUnits, discountPct),
		Timestamp: time.Now().UTC(),
	}
	h.state.AuditLogs = append([]models.AuditLogEntry{log}, h.state.AuditLogs...)
	h.state.mu.Unlock()

	data := h.getViewData("discounts")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.RenderTabPartial(w, "discounts", data)
}

// ServeChatTab renders the Direct Messages workstation tab
func (h *Handler) ServeChatTab(w http.ResponseWriter, r *http.Request) {
	data := h.getViewData("chat")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if r.Header.Get("HX-Request") == "" {
		_ = templates.RenderDashboard(w, data)
		return
	}
	_ = templates.RenderTabPartial(w, "chat", data)
}

// SelectChatThread sets the active direct message conversation thread
func (h *Handler) SelectChatThread(w http.ResponseWriter, r *http.Request) {
	threadID := chi.URLParam(r, "id")
	if threadID != "" {
		h.state.mu.Lock()
		h.state.ActiveThreadID = threadID
		for i := range h.state.ChatThreads {
			if h.state.ChatThreads[i].ID == threadID {
				h.state.ChatThreads[i].UnreadCount = 0
				break
			}
		}
		h.state.mu.Unlock()
	}

	data := h.getViewData("chat")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if r.Header.Get("HX-Request") == "" {
		_ = templates.RenderDashboard(w, data)
		return
	}
	_ = templates.RenderTabPartial(w, "chat", data)
}

// SendChatMessage dispatches an outbound merchant message to the buyer or logs an internal staff whisper
func (h *Handler) SendChatMessage(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	threadID := r.FormValue("thread_id")
	messageText := strings.TrimSpace(r.FormValue("message"))
	isInternal := r.FormValue("is_internal") == "true" || r.FormValue("is_internal") == "1"

	if threadID == "" {
		threadID = h.state.ActiveThreadID
	}

	if messageText != "" {
		h.state.mu.Lock()
		now := time.Now().UTC()
		senderName := h.state.Store.Name
		senderRole := "merchant"
		auditAction := "Buyer Direct Message Sent"
		if isInternal {
			senderName = h.actor(r)
			senderRole = "merchant"
			auditAction = "Internal Staff Note Logged"
		}

		msg := models.ChatMessage{
			ID:             fmt.Sprintf("msg_%d", now.UnixNano()%100000),
			SenderID:       h.state.Store.ID,
			SenderName:     senderName,
			SenderRole:     senderRole,
			Text:           messageText,
			Timestamp:      now,
			IsMerchant:     true,
			IsInternalNote: isInternal,
			CardType:       "note",
		}

		for i := range h.state.ChatThreads {
			if h.state.ChatThreads[i].ID == threadID {
				h.state.ChatThreads[i].Messages = append(h.state.ChatThreads[i].Messages, msg)
				if !isInternal {
					h.state.ChatThreads[i].LastMessage = messageText
				} else {
					h.state.ChatThreads[i].LastMessage = "🔒 Internal note: " + messageText
				}
				h.state.ChatThreads[i].LastTime = now.Format("15:04")
				break
			}
		}

		log := models.AuditLogEntry{
			ID:        fmt.Sprintf("log_%d", now.UnixNano()%10000),
			Actor:     h.actor(r),
			Action:    auditAction,
			Entity:    "ChatThread",
			EntityID:  threadID,
			Details:   fmt.Sprintf("Text: '%s' (Internal: %t)", messageText, isInternal),
			Timestamp: now,
		}
		h.state.AuditLogs = append([]models.AuditLogEntry{log}, h.state.AuditLogs...)
		h.state.mu.Unlock()
		if !isInternal {
			// Let the Inbox relay the reply to the buyer over the chat gateway.
			hxTrigger(w, map[string]any{"shoppage:chat-sent": map[string]string{"message": messageText}})
		}
	}
	h.renderTab(w, r, "chat")
}

// SendStructuredQuote injects a formal commerce quote card into the chat thread
func (h *Handler) SendStructuredQuote(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	threadID := r.FormValue("thread_id")
	if threadID == "" {
		threadID = h.state.ActiveThreadID
	}

	sku := r.FormValue("sku")
	qty, _ := strconv.Atoi(r.FormValue("quantity"))
	if qty <= 0 {
		qty = 50
	}
	discountPct, _ := strconv.ParseFloat(r.FormValue("discount_tier"), 64)
	if discountPct <= 0 {
		discountPct, _ = tierDiscount(h.state.WholesaleTiers, qty)
	}

	h.state.mu.Lock()
	var product models.CatalogSKU
	found := false
	for _, p := range h.state.Catalog {
		if p.SKU == sku {
			product = p
			found = true
			break
		}
	}
	if !found && len(h.state.Catalog) > 0 {
		product = h.state.Catalog[0]
	}

	now := time.Now().UTC()
	effectiveUnit := round2(product.WholesaleZar * (1 - (discountPct / 100)))
	subtotal := round2(effectiveUnit * float64(qty))
	vat := round2(subtotal * 0.15)
	grandTotal := round2(subtotal + vat)

	quoteNo := fmt.Sprintf("QUO-%s-%04d", now.In(sast).Format("2006"), now.UnixNano()%10000)

	quote := &models.StructuredQuote{
		ID:           fmt.Sprintf("quo_%d", now.UnixNano()%100000),
		QuoteNumber:  quoteNo,
		SKU:          product.SKU,
		ProductTitle: product.Title,
		Quantity:     qty,
		UnitPriceZar: effectiveUnit,
		SubtotalZar:  subtotal,
		VATZar:       vat,
		TotalZar:     grandTotal,
		Status:       "Sent",
		ValidUntil:   now.Add(7 * 24 * time.Hour),
	}

	msg := models.ChatMessage{
		ID:         fmt.Sprintf("msg_%d", now.UnixNano()%100000),
		SenderID:   h.state.Store.ID,
		SenderName: h.state.Store.Name,
		SenderRole: "merchant",
		Text:       fmt.Sprintf("Here's quote %s for %d × %s. It's valid for 7 days and includes 15%% VAT.", quoteNo, qty, product.Title),
		Timestamp:  now,
		IsMerchant: true,
		HasQuote:   true,
		CardType:   "quote",
		Quote:      quote,
	}

	for i := range h.state.ChatThreads {
		if h.state.ChatThreads[i].ID == threadID {
			h.state.ChatThreads[i].Messages = append(h.state.ChatThreads[i].Messages, msg)
			h.state.ChatThreads[i].LastMessage = fmt.Sprintf("Quote %s (R %.2f ZAR)", quoteNo, grandTotal)
			h.state.ChatThreads[i].LastTime = now.Format("15:04")
			h.state.ChatThreads[i].DealStatus = "Proforma Issued"
			h.state.ChatThreads[i].DealAmount = grandTotal
			break
		}
	}

	log := models.AuditLogEntry{
		ID:        fmt.Sprintf("log_%d", now.UnixNano()%10000),
		Actor:     h.actor(r),
		Action:    "Commerce Quote Generated",
		Entity:    "StructuredQuote",
		EntityID:  quoteNo,
		Details:   fmt.Sprintf("Generated formal quotation for %d units of %s (Total R %.2f ZAR) in thread %s", qty, product.SKU, grandTotal, threadID),
		Timestamp: now,
	}
	h.state.AuditLogs = append([]models.AuditLogEntry{log}, h.state.AuditLogs...)
	h.state.mu.Unlock()

	data := h.getViewData("chat")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.RenderTabPartial(w, "chat", data)
}

// HandleChatAction processes Slack/Teams Block Kit actions: stock locks, POP verification, deal status updates
func (h *Handler) HandleChatAction(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	threadID := r.FormValue("thread_id")
	if threadID == "" {
		threadID = h.state.ActiveThreadID
	}
	action := r.FormValue("action")

	h.state.mu.Lock()
	now := time.Now().UTC()

	switch action {
	case "lock_stock":
		sku := r.FormValue("sku")
		if sku == "" {
			sku = "MIT-3361"
		}
		qty, _ := strconv.Atoi(r.FormValue("quantity"))
		if qty <= 0 {
			qty = 200
		}
		lockID := fmt.Sprintf("HOLD-%04d", now.Unix()%10000)
		title, where := sku, h.state.hubName(h.state.hubIDFor(r.FormValue("warehouse")))
		if i := catalogIndexBySKU(h.state.Catalog, sku); i >= 0 {
			title = h.state.Catalog[i].Title
			if h.state.Catalog[i].StockQuantity < qty {
				h.state.mu.Unlock()
				setToast(w, fmt.Sprintf("Only %d × %s in stock. Nothing was held.", h.state.Catalog[i].StockQuantity, sku), "")
				h.renderTab(w, r, "chat")
				return
			}
		}
		msg := models.ChatMessage{
			ID:         fmt.Sprintf("msg_%d", now.UnixNano()%100000),
			SenderID:   "system_warehouse",
			SenderName: "Stock hold",
			SenderRole: "system",
			Text:       fmt.Sprintf("%d × %s held for this buyer for 2 hours.", qty, sku),
			Timestamp:  now,
			IsMerchant: true,
			CardType:   "stock_lock",
			StockLock: &models.StockLockInfo{
				SKU:          sku,
				ProductTitle: title,
				Quantity:     qty,
				Warehouse:    where,
				LockID:       lockID,
				ExpiresAt:    now.Add(2 * time.Hour),
				Status:       "Active",
			},
		}
		for i := range h.state.ChatThreads {
			if h.state.ChatThreads[i].ID == threadID {
				h.state.ChatThreads[i].Messages = append(h.state.ChatThreads[i].Messages, msg)
				h.state.ChatThreads[i].DealStatus = "Stock Reserved"
				h.state.ChatThreads[i].LastMessage = fmt.Sprintf("Stock Lock %s active (%d units)", lockID, qty)
				h.state.ChatThreads[i].LastTime = now.Format("15:04")
				break
			}
		}
		log := models.AuditLogEntry{
			ID:        fmt.Sprintf("log_%d", now.UnixNano()%10000),
			Actor:     h.actor(r),
			Action:    "Warehouse Stock Locked",
			Entity:    "StockLock",
			EntityID:  lockID,
			Details:   fmt.Sprintf("Reserved %d units of %s in thread %s", qty, sku, threadID),
			Timestamp: now,
		}
		h.state.AuditLogs = append([]models.AuditLogEntry{log}, h.state.AuditLogs...)

	case "verify_pop":
		for i := range h.state.ChatThreads {
			if h.state.ChatThreads[i].ID == threadID {
				for j := range h.state.ChatThreads[i].Messages {
					if h.state.ChatThreads[i].Messages[j].PaymentProof != nil {
						h.state.ChatThreads[i].Messages[j].PaymentProof.Verified = true
						h.state.ChatThreads[i].Messages[j].PaymentProof.VerifiedBy = h.actor(r)
					}
				}
				h.state.ChatThreads[i].DealStatus = "Paid & Dispatched"
				h.state.ChatThreads[i].LastMessage = "POP Verified — Dispatched via The Courier Guy"
				h.state.ChatThreads[i].LastTime = now.Format("15:04")
				break
			}
		}

	case "set_deal_status":
		newStatus := r.FormValue("status")
		if newStatus != "" {
			for i := range h.state.ChatThreads {
				if h.state.ChatThreads[i].ID == threadID {
					h.state.ChatThreads[i].DealStatus = newStatus
					break
				}
			}
		}

	case "assign_agent":
		agent := r.FormValue("agent")
		if agent != "" {
			for i := range h.state.ChatThreads {
				if h.state.ChatThreads[i].ID == threadID {
					h.state.ChatThreads[i].AssignedAgent = agent
					break
				}
			}
		}
	}
	h.state.mu.Unlock()

	data := h.getViewData("chat")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = templates.RenderTabPartial(w, "chat", data)
}
