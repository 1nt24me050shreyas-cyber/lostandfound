import { apiRequest } from "@/lib/api-client";
import type { Category, Claim, Item, User } from "@/types";

export type AdminReport = {
  id: string;
  item: Item;
  reason: string;
  details: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected" | "duplicate";
  reviewReason?: string;
};

export type AdminClaim = {
  claim: Claim;
  item: Item;
};

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  reason?: string;
  createdAt: string;
};

export type AdminOverview = {
  counts: Record<string, number>;
  reportsNeedingReview: number;
  claimsNeedingReview: number;
  recentActivity: AuditEntry[];
};

export type AdminData = {
  overview: AdminOverview;
  reports: AdminReport[];
  claims: AdminClaim[];
  users: User[];
  categories: Category[];
  audit: AuditEntry[];
};

export type ReportAction = "approved" | "rejected" | "duplicate";

export function getCategories() {
  return apiRequest<Category[]>("/categories");
}

export function getAdminData() {
  return apiRequest<AdminData>("/admin/overview");
}

export function updateAdminReports(ids: string[], status: ReportAction, reason: string) {
  return apiRequest<AdminReport[]>("/admin/reports/bulk", {
    method: "PATCH",
    body: JSON.stringify({ ids, status, reason }),
  });
}

export function reviewAdminClaim(claimId: string, status: "approved" | "rejected", reason: string) {
  return apiRequest<AdminClaim>(`/admin/claims/${encodeURIComponent(claimId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });
}

export function updateAdminUser(userId: string, role: User["role"]) {
  return apiRequest<User>(`/admin/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function addAdminCategory(name: string) {
  return apiRequest<Category>("/admin/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function deleteAdminCategory(name: string) {
  return apiRequest<{ message: string }>(`/admin/categories/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}
