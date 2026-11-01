import { apiRequest } from "@/lib/api-client";
import type { Item, NewItem } from "@/types";

export type HomeStats = {
  returnedThisMonth: number;
  activeListings: number;
  neighborsContributing: number;
};

export type ItemFilters = {
  q?: string;
  category?: string;
  status?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type ItemReport = {
  reason: string;
  details: string;
};

export function getItems(filters: ItemFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return apiRequest<Item[]>(`/items${query ? `?${query}` : ""}`);
}

export function reportItem(itemId: string, report: ItemReport) {
  return apiRequest<{ message: string }>(`/items/${encodeURIComponent(itemId)}/reports`, {
    method: "POST",
    body: JSON.stringify(report),
  });
}

export function getHomeStats() {
  return apiRequest<HomeStats>("/stats/summary");
}

export function getItem(id: string) {
  return apiRequest<Item>(`/items/${encodeURIComponent(id)}`);
}

export function createItem(payload: NewItem) {
  return apiRequest<Item>("/items", { method: "POST", body: JSON.stringify(payload) });
}

export function updateItem(
  itemId: string,
  updates: Partial<Pick<Item, "title" | "description" | "location" | "status">>,
) {
  return apiRequest<Item>(`/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export function deleteItem(itemId: string) {
  return apiRequest<{ message: string }>(`/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}
