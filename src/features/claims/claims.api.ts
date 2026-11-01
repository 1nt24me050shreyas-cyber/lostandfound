import { apiRequest } from "@/lib/api-client";
import type { Claim } from "@/types";

export function submitClaim(itemId: string, claim: Claim) {
  return apiRequest<{ message: string; claimId: string }>(
    `/items/${encodeURIComponent(itemId)}/claims`,
    {
      method: "POST",
      body: JSON.stringify(claim),
    },
  );
}

export function getItemMessages(itemId: string) {
  return apiRequest<import("@/types").Message[]>(`/items/${encodeURIComponent(itemId)}/messages`);
}
