import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/app/auth-context";
import { clearAuthTokens, getAccessToken, setAuthTokens } from "@/features/auth/auth-session";
import {
  getCurrentUser,
  signIn as signInRequest,
  signUp as signUpRequest,
} from "@/features/auth/auth.api";
import type { User } from "@/types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleExpiredSession = () => {
      clearAuthTokens();
      queryClient.clear();
      setUser(null);
    };
    window.addEventListener("common-ground:session-expired", handleExpiredSession);
    return () => window.removeEventListener("common-ground:session-expired", handleExpiredSession);
  }, [queryClient]);

  useEffect(() => {
    let active = true;
    if (!getAccessToken()) {
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((error: unknown) => {
        clearAuthTokens();
        if (error instanceof Error && "status" in error && error.status !== 401) {
          console.error("The current user could not be loaded.", error);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await signInRequest({ email, password });
      setAuthTokens(response);
      queryClient.clear();
      setUser(response.user);
    },
    [queryClient],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await signUpRequest({ name, email, password });
      setAuthTokens(response);
      queryClient.clear();
      setUser(response.user);
    },
    [queryClient],
  );

  const signOut = useCallback(() => {
    clearAuthTokens();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const updateUser = useCallback((updatedUser: User) => setUser(updatedUser), []);
  const value = useMemo(
    () => ({ user, isLoading, signIn, signUp, signOut, updateUser }),
    [user, isLoading, signIn, signUp, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
