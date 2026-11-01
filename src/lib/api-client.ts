import { env } from "@/lib/env";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/features/auth/auth-session";
import type { AuthResponse } from "@/features/auth/auth.types";

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown, cause?: unknown) {
    super(message, { cause });
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallback;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const send = async (token: string | null) => {
    try {
      return await fetch(`${env.apiBaseUrl}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init?.headers,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The server could not be reached.";
      throw new ApiError(message, 0, null, error);
    }
  };

  const sentAccessToken = getAccessToken();
  let response = await send(sentAccessToken);
  if (
    response.status === 401 &&
    getAccessToken() &&
    getRefreshToken() &&
    !path.startsWith("/auth/")
  ) {
    if (getAccessToken() && getAccessToken() !== sentAccessToken) {
      response = await send(getAccessToken());
    } else {
      const refreshed = await refreshSession();
      if (refreshed) response = await send(getAccessToken());
    }
  }

  return parseResponse<T>(response);
}

let refreshInFlight: Promise<boolean> | null = null;

function expireSession() {
  clearAuthTokens();
  window.dispatchEvent(new Event("common-ground:session-expired"));
}

async function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;

      try {
        const response = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) {
          expireSession();
          return false;
        }

        const tokens = (await response.json()) as Pick<
          AuthResponse,
          "accessToken" | "refreshToken"
        >;
        setAuthTokens(tokens);
        return true;
      } catch (error) {
        expireSession();
        const message =
          error instanceof Error ? error.message : "The session could not be refreshed.";
        throw new ApiError(message, 0, null, error);
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const responseText = await response.text();
  let payload: unknown = null;

  if (responseText) {
    try {
      payload = JSON.parse(responseText) as unknown;
    } catch {
      payload = responseText;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, `Request failed with status ${response.status}.`),
      response.status,
      payload,
    );
  }

  return payload as T;
}
