import type {
  AddressSuggestion,
  AgentOutput,
  Alert,
  ChatResponse,
  ChatTurn,
  CreateListingPayload,
  GuardrailConfig,
  ListingSummary,
  OverridePayload,
  UpdateListingPayload,
} from "./types";

const API_BASE = "http://localhost:8000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.detail ?? "";
    } catch {
      // ignore
    }
    throw new Error(detail || `Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchListing(id: string): Promise<AgentOutput> {
  const res = await fetch(`${API_BASE}/api/listing/${id}`);
  return handleResponse<AgentOutput>(res);
}

export async function refreshListing(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/listing/${id}/refresh`, {
    method: "POST",
  });
  await handleResponse<{ status: string }>(res);
}

export async function submitOverride(
  id: string,
  payload: OverridePayload
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/listing/${id}/override`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await handleResponse<{ status: string }>(res);
}

export async function fetchAlerts(id: string): Promise<Alert[]> {
  const res = await fetch(`${API_BASE}/api/listing/${id}/alerts`);
  return handleResponse<Alert[]>(res);
}

export async function fetchGuardrails(): Promise<GuardrailConfig> {
  const res = await fetch(`${API_BASE}/api/guardrails`);
  return handleResponse<GuardrailConfig>(res);
}

export async function listListings(): Promise<ListingSummary[]> {
  const res = await fetch(`${API_BASE}/api/listings`);
  return handleResponse<ListingSummary[]>(res);
}

export async function createListing(payload: CreateListingPayload): Promise<AgentOutput> {
  const res = await fetch(`${API_BASE}/api/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<AgentOutput>(res);
}

export async function deleteListing(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/listings/${id}`, {
    method: "DELETE",
  });
  await handleResponse<{ status: string }>(res);
}

export async function suggestAddresses(query: string): Promise<AddressSuggestion[]> {
  const res = await fetch(`${API_BASE}/api/geocode/suggest?q=${encodeURIComponent(query)}`);
  return handleResponse<AddressSuggestion[]>(res);
}

export async function updateListing(id: string, payload: UpdateListingPayload): Promise<AgentOutput> {
  const res = await fetch(`${API_BASE}/api/listing/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<AgentOutput>(res);
}

export async function fetchChatHistory(id: string): Promise<ChatTurn[]> {
  const res = await fetch(`${API_BASE}/api/listing/${id}/chat`);
  return handleResponse<ChatTurn[]>(res);
}

export async function sendChatMessage(id: string, message: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/listing/${id}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return handleResponse<ChatResponse>(res);
}
