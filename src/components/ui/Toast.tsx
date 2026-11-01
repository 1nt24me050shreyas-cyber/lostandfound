import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, Info, X } from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ToastContext, type ToastInput } from "@/components/ui/toast-context";

type ToastMessage = { id: number } & ToastInput;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const toast = useCallback((message: ToastInput) => {
    const id = Date.now() + Math.random();
    setMessages((current) => [...current, { ...message, id }]);
  }, []);
  const context = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={context}>
      <ToastPrimitive.Provider duration={4500} swipeDirection="right">
        {children}
        {messages.map((message) => (
          <ToastPrimitive.Root
            className={`ui-toast ui-toast--${message.kind}`}
            data-theme={message.theme}
            key={message.id}
            onOpenChange={(open) => {
              if (!open)
                setMessages((current) => current.filter((entry) => entry.id !== message.id));
            }}
          >
            <span className="ui-toast-icon" aria-hidden="true">
              {message.kind === "success" ? <CheckCircle2 size={18} /> : <Info size={18} />}
            </span>
            <div className="ui-toast-copy">
              <ToastPrimitive.Title className="ui-toast-title">
                {message.title}
              </ToastPrimitive.Title>
              {message.description && (
                <ToastPrimitive.Description className="ui-toast-description">
                  {message.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close className="ui-icon-button" aria-label="Dismiss notification">
              <X size={15} />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="ui-toast-viewport" aria-label="Notifications" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function Toast({ title, description, kind = "info", theme }: Omit<ToastMessage, "id">) {
  return (
    <div
      className={`ui-toast ui-toast--${kind}`}
      data-theme={theme}
      role={kind === "danger" ? "alert" : "status"}
    >
      <span className="ui-toast-icon" aria-hidden="true">
        {kind === "success" ? <CheckCircle2 size={18} /> : <Info size={18} />}
      </span>
      <div className="ui-toast-copy">
        <strong className="ui-toast-title">{title}</strong>
        {description && <span className="ui-toast-description">{description}</span>}
      </div>
    </div>
  );
}
