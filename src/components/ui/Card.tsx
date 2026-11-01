import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: "article" | "section" | "div";
};

export function Card({ as: Element = "div", className = "", children, ...props }: CardProps) {
  return (
    <Element className={`ui-card${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </Element>
  );
}
