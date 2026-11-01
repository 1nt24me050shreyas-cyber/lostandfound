import { useId, type ReactNode } from "react";

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  const titleId = useId();

  return (
    <section className="ui-empty-state" aria-labelledby={titleId}>
      {icon && (
        <span className="ui-empty-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <h2 className="ui-empty-title" id={titleId}>
        {title}
      </h2>
      {description && <p className="ui-empty-description">{description}</p>}
      {action}
    </section>
  );
}
