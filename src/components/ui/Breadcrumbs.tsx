import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { Link } from "react-router-dom";

export type BreadcrumbItem = { label: string; href?: string };

export function Breadcrumbs({
  items,
  label = "Breadcrumb",
}: {
  items: BreadcrumbItem[];
  label?: string;
}) {
  return (
    <nav aria-label={label} className="ui-breadcrumbs">
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 && (
                <li className="ui-breadcrumb-separator" aria-hidden="true">
                  <ChevronRight size={13} />
                </li>
              )}
              <li>
                {current || !item.href ? (
                  <span aria-current={current ? "page" : undefined}>{item.label}</span>
                ) : (
                  <Link to={item.href}>{item.label}</Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
