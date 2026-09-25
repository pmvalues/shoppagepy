package templates

import "github.com/shoppage/merchant-os/internal/models"

// NavTab is one page inside a workspace section, reached from the tab strip
// under the page title.
type NavTab struct {
	Key   string // tab key served at /tab/{key}
	Label string
}

// Workspace is one of the seven top-level sidebar sections
// (docs/MERCHANT_CENTRE_SPEC.md §3). Every screen belongs to exactly one.
type Workspace struct {
	Key   string
	Label string
	Icon  string
	Tabs  []NavTab
}

// Workspaces is the sidebar, in order. Settings and the audit log live in the
// account menu and sidebar footer, not as a section.
var Workspaces = []Workspace{
	{Key: "home", Label: "Home", Icon: "overview", Tabs: []NavTab{{"overview", "Overview"}, {"copilot", "Assistant"}}},
	{Key: "sell", Label: "Sell", Icon: "orders", Tabs: []NavTab{{"orders", "Orders & returns"}, {"chat", "Inbox"}, {"rfqs", "Quotes"}, {"pos", "Counter sale"}}},
	{Key: "products", Label: "Products", Icon: "catalog", Tabs: []NavTab{{"catalog", "All products"}, {"media", "Photos & documents"}}},
	{Key: "stock", Label: "Stock", Icon: "inventory", Tabs: []NavTab{{"inventory", "Stock levels"}, {"scan", "Counts"}, {"transfers", "Transfers"}}},
	{Key: "fulfil", Label: "Fulfilment", Icon: "manifests", Tabs: []NavTab{{"pick-pack", "Pick & pack"}, {"manifests", "Courier manifests"}}},
	{Key: "customers", Label: "Customers", Icon: "customers", Tabs: []NavTab{{"customers", "Customers"}}},
	{Key: "grow", Label: "Marketing", Icon: "analytics", Tabs: []NavTab{{"feeds", "Where you sell"}, {"channels", "Channels & WhatsApp"}, {"editor", "Storefront & SEO"}, {"discounts", "Promotions"}, {"analytics", "Analytics"}, {"flow", "Automations"}}},
}

// settingsWorkspace holds the pages reached from the account menu.
var settingsWorkspace = Workspace{Key: "settings", Label: "Settings", Icon: "settings",
	Tabs: []NavTab{{"settings", "Store & billing"}, {"audit-logs", "Activity log"}}}

// WorkspaceFor returns the section a tab belongs to (Home for unknown tabs).
func WorkspaceFor(tab string) Workspace {
	if tab == "" {
		tab = "overview"
	}
	for _, w := range append(Workspaces, settingsWorkspace) {
		for _, t := range w.Tabs {
			if t.Key == tab {
				return w
			}
		}
	}
	return Workspaces[0]
}

// TabLabel returns the display label of a tab key.
func TabLabel(tab string) string {
	w := WorkspaceFor(tab)
	for _, t := range w.Tabs {
		if t.Key == tab {
			return t.Label
		}
	}
	return w.Tabs[0].Label
}

// PageTitle is the heading shown in the top bar for a tab.
func PageTitle(tab string) string {
	w := WorkspaceFor(tab)
	if len(w.Tabs) == 1 || (tab == w.Tabs[0].Key && w.Key != "grow" && w.Key != "sell") {
		return w.Label
	}
	return TabLabel(tab)
}

// WorkspaceBadge is the live count shown on a sidebar section; zero hides it.
func WorkspaceBadge(key string, nav models.NavContext) int {
	switch key {
	case "sell":
		return nav.OpenOrders + nav.UnreadThreads + nav.NewQuotes
	case "stock":
		return nav.LowStock
	case "grow":
		return nav.ListingIssues
	}
	return 0
}

// TabBadge is the live count shown on a tab in the strip; zero hides it.
func TabBadge(tab string, nav models.NavContext) int {
	switch tab {
	case "orders":
		return nav.OpenOrders
	case "chat":
		return nav.UnreadThreads
	case "rfqs":
		return nav.NewQuotes
	case "inventory":
		return nav.LowStock
	case "feeds":
		return nav.ListingIssues
	}
	return 0
}

// TabHref is the address of a tab.
func TabHref(tab string) string {
	if tab == "overview" {
		return "/desk"
	}
	return "/tab/" + tab
}

// Initials returns up to two initials for an avatar.
func Initials(name string) string {
	var out []rune
	prevSpace := true
	for _, r := range name {
		if r == ' ' || r == '-' || r == '(' {
			prevSpace = true
			continue
		}
		if prevSpace && ((r >= 'A' && r <= 'Z') || (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9')) {
			out = append(out, r)
			if len(out) == 2 {
				break
			}
		}
		prevSpace = false
	}
	if len(out) == 0 {
		return "S"
	}
	s := string(out)
	if len(s) > 0 && s[0] >= 'a' && s[0] <= 'z' {
		s = string(s[0]-32) + s[1:]
	}
	return s
}

// KnownTab reports whether a tab key exists.
func KnownTab(tab string) bool {
	for _, w := range append(Workspaces, settingsWorkspace) {
		for _, t := range w.Tabs {
			if t.Key == tab {
				return true
			}
		}
	}
	return false
}
