import { forwardRef, type TextareaHTMLAttributes } from "react";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = "", id, "aria-describedby": describedBy, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;
    return (
      <>
        <textarea
          ref={ref}
          id={id}
          className={`ui-control ui-textarea${error ? " is-invalid" : ""}${className ? ` ${className}` : ""}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={[describedBy, errorId].filter(Boolean).join(" ") || undefined}
          {...props}
        />
        {error && (
          <span className="ui-field-error" id={errorId} role="alert">
            {error}
          </span>
        )}
      </>
    );
  },
);

Textarea.displayName = "Textarea";
