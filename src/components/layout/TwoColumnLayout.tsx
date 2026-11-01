import type { ReactNode } from "react";

export function TwoColumnLayout({
  children,
  sidebar,
  sidebarLabel = "Additional information",
  className = "",
}: {
  children: ReactNode;
  sidebar: ReactNode;
  sidebarLabel?: string;
  className?: string;
}) {
  return (
    <div className={`two-column-layout${className ? ` ${className}` : ""}`}>
      <div className="two-column-main">{children}</div>
      <aside className="two-column-sidebar" aria-label={sidebarLabel}>
        {sidebar}
      </aside>
    </div>
  );
}
