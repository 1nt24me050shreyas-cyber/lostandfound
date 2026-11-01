import type { HTMLAttributes } from "react";

export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`ui-skeleton${className ? ` ${className}` : ""}`}
      aria-hidden="true"
      {...props}
    />
  );
}
