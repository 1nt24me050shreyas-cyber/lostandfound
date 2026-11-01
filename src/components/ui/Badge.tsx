import type { ItemStatus } from "@/types";

const labels: Record<ItemStatus, string> = {
  lost: "Lost",
  found: "Found",
  claimed: "Claimed",
  returned: "Returned",
};

export function Badge({ status, children }: { status: ItemStatus; children?: string }) {
  return <span className={`ui-badge ui-badge--${status}`}>{children ?? labels[status]}</span>;
}
