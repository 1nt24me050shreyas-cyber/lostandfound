import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const safePageCount = Math.max(1, pageCount);
  const start = Math.max(1, Math.min(page - 2, safePageCount - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, safePageCount) },
    (_, index) => start + index,
  );

  return (
    <nav className="ui-pagination" aria-label="Pagination">
      <button
        className="ui-page-button"
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={16} />
      </button>
      {visiblePages.map((number) => (
        <button
          className={`ui-page-button${number === page ? " is-current" : ""}`}
          type="button"
          key={number}
          aria-current={number === page ? "page" : undefined}
          aria-label={`Page ${number}`}
          onClick={() => onPageChange(number)}
        >
          {number}
        </button>
      ))}
      <button
        className="ui-page-button"
        type="button"
        aria-label="Next page"
        disabled={page >= safePageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
