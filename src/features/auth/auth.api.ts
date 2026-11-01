import { apiRequest } from "@/lib/api-client";
import type { User } from "@/types";

export function getCurrentUser() {
  return apiRequest<User>("/users/me");
}
