import type { HTMLAttributes, ReactNode } from "react";

type PageContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  width?: "content" | "wide" | "narrow";
};

export function PageContainer({
  children,
  width = "content",
  className = "",
  ...props
}: PageContainerProps) {
  return (
    <div
      className={`page-container page-container--${width}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
