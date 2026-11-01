import { apiRequest } from "@/lib/api-client";
import type {
  AuthResponse,
  NotificationPreferences,
  SignInCredentials,
  SignUpCredentials,
  UserAccountData,
  UserClaim,
} from "@/features/auth/auth.types";
import type { Item, Message, User } from "@/types";

export function getCurrentUser() {
  return apiRequest<User>("/users/me");
}

export function signIn(credentials: SignInCredentials) {
  return apiRequest<AuthResponse>("/auth/sign-in", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function signUp(credentials: SignUpCredentials) {
  return apiRequest<AuthResponse>("/auth/sign-up", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function requestPasswordReset(email: string) {
  return apiRequest<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function getMyReports() {
  return apiRequest<Item[]>("/users/me/reports");
}

export function getMyClaims() {
  return apiRequest<UserClaim[]>("/users/me/claims");
}

export function getMyMessages() {
  return apiRequest<Message[]>("/users/me/messages");
}

export function getAccountData() {
  return apiRequest<UserAccountData>("/users/me/account");
}

export function updateProfile(profile: Pick<User, "name" | "email">) {
  return apiRequest<User>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
}

export function updateNotificationPreferences(preferences: NotificationPreferences) {
  return apiRequest<NotificationPreferences>("/users/me/preferences", {
    method: "PATCH",
    body: JSON.stringify(preferences),
  });
}

export function deleteAccount() {
  return apiRequest<{ message: string }>("/users/me", { method: "DELETE" });
}
