package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/shoppage/consumer-web/internal/models"
	"github.com/shoppage/consumer-web/internal/store"
)

type AssistantService struct {
	store      *store.Store
	httpClient *http.Client
}

func NewAssistantService(s *store.Store) *AssistantService {
	return &AssistantService{
		store: s,
		httpClient: &http.Client{
			Timeout: 25 * time.Second,
		},
	}
}

type AssistantResponse struct {
	Reply     string              `json:"reply"`
	Products  []models.SearchItem `json:"products,omitempty"`
	Malls     []models.Mall       `json:"malls,omitempty"`
	Action    string              `json:"action,omitempty"`
	LatencyMs float64             `json:"latencyMs"`
}

func CalculateBackupRuntime(batteryKwh float64, loadWatts float64, dod float64) (float64, float64, string) {
	if dod <= 0 {
		dod = 0.9
	}
	if loadWatts < 50 {
		loadWatts = 50
	}
	usableKwh := batteryKwh * dod
	runtimeHours := (usableKwh * 1000.0) / loadWatts
	hours := math.Floor(runtimeHours)
	minutes := math.Round((runtimeHours - hours) * 60)
	formatted := fmt.Sprintf("%dh %dm", int(hours), int(minutes))
	return math.Round(usableKwh*100) / 100, math.Round(runtimeHours*10) / 10, formatted
}

func (a *AssistantService) Ask(ctx context.Context, message string) (*AssistantResponse, error) {
	start := time.Now()
	clean := strings.TrimSpace(message)
	if clean == "" {
		return &AssistantResponse{
			Reply:     "Hello! I am your Shoppage AI Commerce Assistant for South Africa. How can I help you find products, calculate solar backup runtime, or locate stores today?",
			LatencyMs: float64(time.Since(start).Microseconds()) / 1000.0,
		}, nil
	}

	apiKey := strings.TrimSpace(os.Getenv("GEMINI_API_KEY"))
	model := strings.TrimSpace(os.Getenv("GEMINI_MODEL"))
	if model == "" {
		model = "gemini-2.5-flash"
	}

	// Offline / fallback if no API key configured
	if apiKey == "" {
		return a.offlineFallback(clean, start)
	}

	// Call Gemini with tools
	reqPayload := map[string]any{
		"system_instruction": map[string]any{
			"parts": []map[string]any{
				{
					"text": "You are Shoppage's shopping assistant for South Africa. Answer ONLY from the tool results or factual South African commerce context. Prices are in ZAR (R). Mention merchant names, store locations, and warranty details where available. Keep replies concise, helpful, and use bold for product names and prices.",
				},
			},
		},
		"contents": []map[string]any{
			{
				"role": "user",
				"parts": []map[string]any{
					{"text": clean},
				},
			},
		},
		"tools": []map[string]any{
			{
				"function_declarations": []map[string]any{
					{
						"name":        "searchCatalog",
						"description": "Search the live South African product catalogue for inverters, batteries, catering equipment, packaging, or electronics.",
						"parameters": map[string]any{
							"type": "object",
							"properties": map[string]any{
								"query": map[string]any{"type": "string", "description": "Search keywords, e.g. '5kW hybrid inverter' or 'wooden hanger'"},
							},
							"required": []string{"query"},
						},
					},
					{
						"name":        "calculateSolarBackup",
						"description": "Calculate backup runtime in hours and minutes during load shedding given battery capacity (kWh) and average household/office load in Watts.",
						"parameters": map[string]any{
							"type": "object",
							"properties": map[string]any{
								"batteryKwh": map[string]any{"type": "number", "description": "Battery capacity in kWh, e.g. 5.12"},
								"loadWatts":  map[string]any{"type": "number", "description": "Continuous load in Watts, e.g. 500"},
							},
							"required": []string{"batteryKwh", "loadWatts"},
						},
					},
					{
						"name":        "findMalls",
						"description": "Search shopping malls and commercial hubs in South Africa by province or mall name.",
						"parameters": map[string]any{
							"type": "object",
							"properties": map[string]any{
								"province": map[string]any{"type": "string", "description": "Province, e.g. 'Gauteng', 'Western Cape'"},
								"query":    map[string]any{"type": "string", "description": "Mall name keyword, e.g. 'Mall of Africa'"},
							},
						},
					},
				},
			},
		},
	}

	bodyBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return a.offlineFallback(clean, start)
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", model)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return a.offlineFallback(clean, start)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", apiKey)

	resp, err := a.httpClient.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return a.offlineFallback(clean, start)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return a.offlineFallback(clean, start)
	}

	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text         string `json:"text"`
					FunctionCall *struct {
						Name string         `json:"name"`
						Args map[string]any `json:"args"`
					} `json:"functionCall"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(respBody, &geminiResp); err != nil || len(geminiResp.Candidates) == 0 {
		return a.offlineFallback(clean, start)
	}

	parts := geminiResp.Candidates[0].Content.Parts
	var textReply string
	var products []models.SearchItem
	var malls []models.Mall

	for _, p := range parts {
		if p.Text != "" {
			textReply += p.Text + " "
		}
		if p.FunctionCall != nil {
			switch p.FunctionCall.Name {
			case "searchCatalog":
				q, _ := p.FunctionCall.Args["query"].(string)
				matched := a.store.SearchProducts(q, "", "", false)
				if len(matched) > 4 {
					matched = matched[:4]
				}
				products = append(products, matched...)
				if textReply == "" {
					textReply = fmt.Sprintf("I found %d matching items for '%s':", len(matched), q)
				}
			case "calculateSolarBackup":
				bKwh, _ := p.FunctionCall.Args["batteryKwh"].(float64)
				lWatts, _ := p.FunctionCall.Args["loadWatts"].(float64)
				usable, _, formatted := CalculateBackupRuntime(bKwh, lWatts, 0.9)
				calcText := fmt.Sprintf("With a **%.2f kWh** battery at a **%.0fW** load (90%% DoD), your expected backup runtime is **%s** (%.2f kWh usable capacity).", bKwh, lWatts, formatted, usable)
				textReply = calcText + " " + textReply
			case "findMalls":
				prov, _ := p.FunctionCall.Args["province"].(string)
				mQuery, _ := p.FunctionCall.Args["query"].(string)
				matchedMalls := a.store.GetAllMalls(prov, mQuery)
				if len(matchedMalls) > 4 {
					matchedMalls = matchedMalls[:4]
				}
				malls = append(malls, matchedMalls...)
			}
		}
	}

	textReply = strings.TrimSpace(textReply)
	if textReply == "" && len(products) == 0 {
		return a.offlineFallback(clean, start)
	}

	return &AssistantResponse{
		Reply:     textReply,
		Products:  products,
		Malls:     malls,
		LatencyMs: float64(time.Since(start).Microseconds()) / 1000.0,
	}, nil
}

func (a *AssistantService) offlineFallback(query string, start time.Time) (*AssistantResponse, error) {
	lower := strings.ToLower(query)

	// Check if inquiry is about solar / load shedding
	if strings.Contains(lower, "solar") || strings.Contains(lower, "inverter") || strings.Contains(lower, "battery") || strings.Contains(lower, "backup") || strings.Contains(lower, "load shedding") {
		products := a.store.SearchProducts("solar", "Solar & Energy", "", false)
		if len(products) > 4 {
			products = products[:4]
		}
		_, _, formatted := CalculateBackupRuntime(5.12, 450, 0.9)
		reply := fmt.Sprintf("For Stage 6 load shedding resilience, a standard **5.12 kWh LiFePO4 battery** with a **450W household baseline load** provides **%s** of continuous power. Here are top verified solar equipment offers in Gauteng and Western Cape:", formatted)
		return &AssistantResponse{
			Reply:     reply,
			Products:  products,
			LatencyMs: float64(time.Since(start).Microseconds()) / 1000.0,
		}, nil
	}

	// Check if inquiry is about malls
	if strings.Contains(lower, "mall") || strings.Contains(lower, "centre") || strings.Contains(lower, "shopping") {
		malls := a.store.GetAllMalls("", query)
		if len(malls) > 4 {
			malls = malls[:4]
		}
		return &AssistantResponse{
			Reply:     fmt.Sprintf("Here are commercial shopping hubs matching '%s':", query),
			Malls:     malls,
			LatencyMs: float64(time.Since(start).Microseconds()) / 1000.0,
		}, nil
	}

	// Standard product search
	matched := a.store.SearchProducts(query, "", "", false)
	if len(matched) > 4 {
		matched = matched[:4]
	}
	var reply string
	if len(matched) > 0 {
		reply = fmt.Sprintf("I located **%d verified products** for '%s' across local merchants:", len(matched), query)
	} else {
		reply = fmt.Sprintf("I could not find exact stock matches for '%s'. Try searching for broader terms like 'inverter', 'hanger', or 'solar'.", query)
	}

	return &AssistantResponse{
		Reply:     reply,
		Products:  matched,
		LatencyMs: float64(time.Since(start).Microseconds()) / 1000.0,
	}, nil
}
