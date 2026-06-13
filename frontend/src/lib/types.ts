export interface ListingData {
  listing_id: string;
  address: string;
  lat: number | null;
  lon: number | null;
  county_name: string;
  current_price: number;
  original_price: number;
  days_on_market: number;
  price_cuts: number;
  price_cut_history: number[];
  neighborhood_median: number;
  mortgage_rate: number;
  local_vacancy_rate: number;
  median_rent: number;
  median_household_income: number;
  school_rating: number;
  walk_score: number;
}

export interface MarketAssessment {
  demand_trend: string;
  price_band_fit: string;
  key_risk: string;
  opportunity: string;
}

export interface PricePoint {
  week: number;
  price: number;
}

export interface Scenario {
  id: "aggressive" | "moderate" | "patient";
  label: string;
  recommended_price: number;
  price_path: PricePoint[];
  estimated_days_to_sale: number;
  equity_retained_pct: number;
  incentives: string[];
  rationale: string;
  fairness_passed: boolean;
  flag_reason: string | null;
}

export interface Alert {
  severity: "info" | "warning" | "critical";
  message: string;
}

export interface Recommendation {
  recommended_scenario_id: string;
  confidence_score: number;
  one_line_summary: string;
  why_explanation: string;
  alerts: Alert[];
}

export interface Override {
  floor_price: number;
  locked_scenario_id: string;
  advisor_note: string;
}

export interface AgentOutput {
  listing: ListingData;
  assessment: MarketAssessment;
  scenarios: Scenario[];
  recommendation: Recommendation;
  last_updated: string;
  override?: Override | null;
}

export interface GuardrailConfig {
  floor_ratio: number;
  max_discount_pct: number;
}

export interface OverridePayload {
  floor_price: number;
  locked_scenario_id: string;
  advisor_note: string;
}

export interface ListingSummary {
  listing_id: string;
  address: string;
  lat: number | null;
  lon: number | null;
  current_price: number;
  neighborhood_median: number;
  days_on_market: number;
  recommended_scenario_id: string;
  one_line_summary: string;
  last_updated: string;
}

export interface AddressSuggestion {
  display_name: string;
  lat: number;
  lon: number;
}

export interface CreateListingPayload {
  address: string;
  current_price: number;
  original_price?: number;
  days_on_market?: number;
}

export interface UpdateListingPayload {
  price_cut_history?: number[];
  days_on_market?: number;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  history: ChatTurn[];
}
