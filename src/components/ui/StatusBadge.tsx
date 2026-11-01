import type { ItemStatus } from "@/types";

export function StatusBadge({ status }: { status: ItemStatus }) {
  const labels: Record<ItemStatus, string> = {
    lost: "Lost item",
    found: "Found item",
    claimed: "Claim in progress",
    returned: "Returned",
  };

  return <span className={`status-pill status-${status}`}>{labels[status]}</span>;
}
