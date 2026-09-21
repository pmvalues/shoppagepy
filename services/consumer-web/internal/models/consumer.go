package models

// SearchItem represents an individual item returned in search grids and discovery feeds.
type SearchItem struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Brand       string  `json:"brand"`
	Model       string  `json:"model"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
	PriceZar    float64 `json:"priceZar"`
	OffersCount int     `json:"offersCount"`
	City        string  `json:"city"`
	Province    string  `json:"province"`
	InStock     bool    `json:"inStock"`
	Verified    bool    `json:"verified"`
	ImageURL    string  `json:"imageUrl"`
	Score       float64 `json:"score,omitempty"`
	DistanceKm  float64 `json:"distanceKm,omitempty"`
	Rating      float64 `json:"rating,omitempty"`
}

// MerchantOffer represents an offer from a specific seller for a product.
type MerchantOffer struct {
	MerchantID   string  `json:"merchantId"`
	MerchantName string  `json:"merchantName"`
	City         string  `json:"city"`
	Province     string  `json:"province"`
	PriceZar     float64 `json:"priceZar"`
	InStock      bool    `json:"inStock"`
	LeadTimeDays int     `json:"leadTimeDays"`
	Verified     bool    `json:"verified"`
	WhatsApp     string  `json:"whatsapp"`
	Rating       float64 `json:"rating"`
}

// ProductDetail represents the canonical product view and BuyBox comparison.
type ProductDetail struct {
	CanonicalID       string            `json:"canonicalId"`
	Title             string            `json:"title"`
	Brand             string            `json:"brand"`
	Model             string            `json:"model"`
	Category          string            `json:"category"`
	Description       string            `json:"description"`
	ImageURL          string            `json:"imageUrl"`
	Gallery           []string          `json:"gallery"`
	Specs             map[string]string `json:"specs"`
	EstimatedPriceZar float64           `json:"estimatedPriceZar"`
	LowestOfferPrice  float64           `json:"lowestOfferPrice"`
	Offers            []MerchantOffer   `json:"offers"`
}

// Mall represents a South African commercial shopping centre or wholesale hub.
type Mall struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Slug          string   `json:"slug"`
	Province      string   `json:"province"`
	Metro         string   `json:"metro"`
	Suburb        string   `json:"suburb"`
	MarketType    string   `json:"marketType"`
	StreetAddress string   `json:"streetAddress"`
	StoreCount    int      `json:"storeCount"`
	AnchorTenants []string `json:"anchorTenants"`
	Latitude      float64  `json:"latitude"`
	Longitude     float64  `json:"longitude"`
}

// RetailerDeal represents a circular special or promotion from major retailers
type RetailerDeal struct {
	ID             string  `json:"id"`
	Title          string  `json:"title"`
	Brand          string  `json:"brand"`
	MerchantName   string  `json:"merchantName"`
	RetailerDomain string  `json:"retailerDomain"`
	Category       string  `json:"category"`
	CategoryLabel  string  `json:"categoryLabel"`
	DirectURL      string  `json:"directUrl"`
	PriceZar       float64 `json:"priceZar"`
	OldPriceZar    float64 `json:"oldPriceZar"`
	DiscountPct    int     `json:"discountPct"`
	Badge          string  `json:"badge"`
	Availability   string  `json:"availability"`
	LocationHint   string  `json:"locationHint"`
	ImageURL       string  `json:"imageUrl"`
	ValidUntil     string  `json:"validUntil"`
}

// MerchantStorefront represents a public merchant profile page.
type MerchantStorefront struct {
	ID           string       `json:"id"`
	Name         string       `json:"name"`
	Category     string       `json:"category"`
	Suburb       string       `json:"suburb"`
	City         string       `json:"city"`
	Province     string       `json:"province"`
	Address      string       `json:"address"`
	Phone        string       `json:"phone"`
	WhatsApp     string       `json:"whatsapp"`
	Rating       float64      `json:"rating"`
	ReviewsCount int          `json:"reviewsCount"`
	CIPCNumber   string       `json:"cipcNumber"`
	Verified     bool         `json:"verified"`
	Catalog      []SearchItem `json:"catalog"`
}

// CartItem represents an item in an RFQ or proforma cart.
type CartItem struct {
	ProductID    string  `json:"productId"`
	Title        string  `json:"title"`
	Quantity     int     `json:"quantity"`
	UnitPriceZar float64 `json:"unitPriceZar"`
	TotalPrice   float64 `json:"totalPrice"`
}

// ProformaInvoice represents an instant B2B quotation.
type ProformaInvoice struct {
	QuoteRef     string     `json:"quoteRef"`
	DateStr      string     `json:"dateStr"`
	BuyerName    string     `json:"buyerName"`
	BuyerPhone   string     `json:"buyerPhone"`
	BuyerEmail   string     `json:"buyerEmail"`
	MerchantName string     `json:"merchantName"`
	MerchantCIPC string     `json:"merchantCipc"`
	Items        []CartItem `json:"items"`
	SubtotalZar  float64    `json:"subtotalZar"`
	VatZar       float64    `json:"vatZar"`
	TotalZar     float64    `json:"totalZar"`
}

// PostProduct represents an embedded product preview in a feed post.
type PostProduct struct {
	Name  string `json:"name"`
	Price string `json:"price"`
	Old   string `json:"old,omitempty"`
	Off   string `json:"off,omitempty"`
	Note  string `json:"note,omitempty"`
	Href  string `json:"href,omitempty"`
}

// PollOption represents one selectable option in a trade poll.
type PollOption struct {
	Label string `json:"l"`
	Votes int    `json:"v"`
}

// PostPoll represents an interactive community poll attached to a post.
type PostPoll struct {
	Options []PollOption `json:"options"`
	Voted   *int         `json:"voted"`
}

// PostStats represents engagement counts on a feed item.
type PostStats struct {
	Replies int    `json:"replies"`
	Reposts int    `json:"reposts"`
	Likes   int    `json:"likes"`
	Views   string `json:"views"`
}

// PostBadge represents a status pill on a post (e.g. PRICE DROP, VERIFIED STOCK).
type PostBadge struct {
	Label string `json:"label"`
	Type  string `json:"type"`
}

// PostItem represents a post in the social commerce discovery timeline.
type PostItem struct {
	ID       string       `json:"id"`
	Name     string       `json:"name"`
	Handle   string       `json:"handle"`
	Avatar   string       `json:"av"`
	Initials string       `json:"ini"`
	Verified bool         `json:"verified"`
	Time     string       `json:"time"`
	Badge    *PostBadge   `json:"badge,omitempty"`
	Category string       `json:"cat,omitempty"`
	Tabs     []string     `json:"tabs"`
	Text     string       `json:"text"`
	Product  *PostProduct `json:"product,omitempty"`
	Image    string       `json:"image,omitempty"`
	Poll     *PostPoll    `json:"poll,omitempty"`
	Stats    PostStats    `json:"stats"`
	WhatsApp string       `json:"whatsapp,omitempty"`
}

// ShortItem represents a vertical video reel / trade demonstration.
type ShortItem struct {
	ID               string  `json:"id"`
	Title            string  `json:"title"`
	Views            string  `json:"views"`
	Duration         string  `json:"dur"`
	Image            string  `json:"img"`
	VideoURL         string  `json:"videoUrl"`
	Category         string  `json:"category"`
	MerchantName     string  `json:"merchantName"`
	MerchantWhatsApp string  `json:"merchantWhatsApp"`
	PriceZar         float64 `json:"priceZar"`
	Likes            int     `json:"likes"`
	Summary          string  `json:"summary"`
}

// TradeTrend represents a hot commercial topic or hashtag.
type TradeTrend struct {
	Tag      string `json:"tag"`
	Count    string `json:"count"`
	Category string `json:"category"`
}

// CommunityGuild represents a featured trade hub or contractor community.
type CommunityGuild struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Location    string `json:"location"`
	Members     string `json:"members"`
	DailyPosts  string `json:"dailyPosts"`
	Tag         string `json:"tag"`
	Initials    string `json:"initials"`
	AvatarClass string `json:"avatarClass"`
	Query       string `json:"query"`
}

