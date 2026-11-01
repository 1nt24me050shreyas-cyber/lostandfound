import { forwardRef, type InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", id, "aria-describedby": describedBy, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;
    return (
      <>
        <input
          ref={ref}
          id={id}
          className={`ui-control ui-input${error ? " is-invalid" : ""}${className ? ` ${className}` : ""}`}
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

Input.displayName = "Input";
