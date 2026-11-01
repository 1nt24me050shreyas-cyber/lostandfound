import { apiRequest } from "@/lib/api-client";
import type {
  Claim,
  ClaimStatus,
  HandoverDetails,
  Item,
  Message,
  MessageThread,
  Notification,
} from "@/types";

export type ClaimDetails = {
  claim: Claim;
  item: Item;
  ownerName: string;
  handover?: HandoverDetails;
  threadId?: string;
};

export type ThreadDetails = {
  thread: MessageThread;
  messages: Message[];
};

export function submitClaim(itemId: string, claim: Claim) {
  return apiRequest<{ message: string; claimId: string; threadId: string }>(
    `/items/${encodeURIComponent(itemId)}/claims`,
    {
      method: "POST",
      body: JSON.stringify(claim),
    },
  );
}

export function getClaim(claimId: string) {
  return apiRequest<ClaimDetails>(`/claims/${encodeURIComponent(claimId)}`);
}

export function updateClaimStatus(claimId: string, status: ClaimStatus) {
  return apiRequest<ClaimDetails>(`/claims/${encodeURIComponent(claimId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function saveHandoverDetails(claimId: string, details: HandoverDetails) {
  return apiRequest<HandoverDetails>(`/claims/${encodeURIComponent(claimId)}/handover`, {
    method: "PUT",
    body: JSON.stringify(details),
  });
}

export function getMessageThreads() {
  return apiRequest<MessageThread[]>("/messages/threads");
}

export function getThread(threadId: string) {
  return apiRequest<ThreadDetails>(`/messages/threads/${encodeURIComponent(threadId)}`);
}

export function sendThreadMessage(threadId: string, body: string) {
  return apiRequest<Message>(`/messages/threads/${encodeURIComponent(threadId)}`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function markThreadRead(threadId: string) {
  return apiRequest<{ message: string }>(`/messages/threads/${encodeURIComponent(threadId)}/read`, {
    method: "PATCH",
  });
}

export function getNotifications() {
  return apiRequest<Notification[]>("/notifications");
}

export function markNotificationRead(notificationId: string) {
  return apiRequest<Notification>(`/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead() {
  return apiRequest<{ message: string }>("/notifications/read-all", { method: "PATCH" });
}
