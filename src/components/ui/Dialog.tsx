import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Dialog({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
  theme,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  theme?: "light" | "dark";
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="ui-dialog-overlay" />
        <DialogPrimitive.Content className="ui-dialog-content" data-theme={theme}>
          <div className="ui-dialog-heading">
            <div>
              <DialogPrimitive.Title className="ui-dialog-title">{title}</DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="ui-dialog-description">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close className="ui-icon-button" aria-label="Close dialog">
              <X size={17} />
            </DialogPrimitive.Close>
          </div>
          <div className="ui-dialog-body">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
