import { CalendarDays } from "lucide-react";
import { forwardRef, type InputHTMLAttributes } from "react";

export type DatePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  error?: string;
};

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ error, className = "", id, "aria-describedby": describedBy, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;
    return (
      <div className="ui-date-wrap">
        <CalendarDays size={16} aria-hidden="true" />
        <input
          ref={ref}
          id={id}
          type="date"
          className={`ui-control ui-date-picker${error ? " is-invalid" : ""}${className ? ` ${className}` : ""}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={[describedBy, errorId].filter(Boolean).join(" ") || undefined}
          {...props}
        />
        {error && (
          <span className="ui-field-error" id={errorId} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  },
);

DatePicker.displayName = "DatePicker";
