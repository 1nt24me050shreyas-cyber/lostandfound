import { createContext } from "react";

export type ToastKind = "success" | "info" | "danger";
export type ToastInput = {
  title: string;
  description?: string;
  kind: ToastKind;
  theme?: "light" | "dark";
};
export type ToastContextValue = { toast: (message: ToastInput) => void };

export const ToastContext = createContext<ToastContextValue | null>(null);
