import { createContext } from "react";
import type { User } from "@/types";

export type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateUser: (user: User) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
