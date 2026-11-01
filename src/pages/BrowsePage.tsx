import { useQuery } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { Grid2X2, List, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ItemCard } from "@/components/ui/ItemCard";
import { Pagination } from "@/components/ui/Pagination";
import { getItems } from "@/features/items/items.api";

const categories = [
  "All items",
  "Bags",
  "Clothing",
  "Documents",
  "Electronics",
  "Jewelry",
  "Keys",
  "Personal items",
  "Sports & outdoors",
  "Other",
];
const pageSize = 9;

function FilterFields({
  idPrefix,
  keyword,
  location,
  status,
  category,
  dateFrom,
  dateTo,
  onKeywordChange,
  onLocationChange,
  onFilterChange,
}: {
  idPrefix: string;
  keyword: string;
  location: string;
  status: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  onKeywordChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onFilterChange: (key: string, value: string) => void;
}) {
  return (
    <div className="browse-filter-fields">
      <label className="browse-filter-label" htmlFor={`${idPrefix}-keyword`}>
        Keyword
      </label>
      <div className="browse-filter-search">
        <Search size={16} aria-hidden="true" />
        <input
          id={`${idPrefix}-keyword`}
          type="search"
          value={keyword}
          maxLength={80}
          placeholder="Item or detail"
          onChange={(event) => onKeywordChange(event.target.value)}
        />
      </div>

      <label className="browse-filter-label" htmlFor={`${idPrefix}-status`}>
        Status
      </label>
      <select
        id={`${idPrefix}-status`}
        className="browse-filter-select"
        value={status}
        onChange={(event) => onFilterChange("status", event.target.value)}
      >
        <option value="all">All statuses</option>
        <option value="lost">Lost</option>
        <option value="found">Found</option>
        <option value="claimed">Claim in progress</option>
        <option value="returned">Returned</option>
      </select>

      <label className="browse-filter-label" htmlFor={`${idPrefix}-category`}>
        Category
      </label>
      <select
        id={`${idPrefix}-category`}
        className="browse-filter-select"
        value={category}
        onChange={(event) => onFilterChange("category", event.target.value)}
      >
        {categories.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <label className="browse-filter-label" htmlFor={`${idPrefix}-location`}>
        Location
      </label>
      <input
        id={`${idPrefix}-location`}
        className="browse-filter-input"
        type="search"
        value={location}
        maxLength={80}
        placeholder="Neighborhood or landmark"
        onChange={(event) => onLocationChange(event.target.value)}
      />

      <span className="browse-filter-label">Date range</span>
      <div className="browse-date-range">
        <label htmlFor={`${idPrefix}-date-from`}>
          <span className="sr-only">From date</span>
          <input
            id={`${idPrefix}-date-from`}
            className="browse-filter-input"
            type="date"
            max={dateTo || undefined}
            value={dateFrom}
            onChange={(event) => onFilterChange("dateFrom", event.target.value)}
          />
        </label>
        <span aria-hidden="true">to</span>
        <label htmlFor={`${idPrefix}-date-to`}>
          <span className="sr-only">To date</span>
          <input
            id={`${idPrefix}-date-to`}
            className="browse-filter-input"
            type="date"
            min={dateFrom || undefined}
            value={dateTo}
            onChange={(event) => onFilterChange("dateTo", event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

export function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const routeLocation = useLocation();
  const query = params.get("q") ?? "";
  const status = params.get("status") ?? "all";
  const category = params.get("category") ?? "All items";
  const locationFilter = params.get("location") ?? "";
  const dateFrom = params.get("dateFrom") ?? "";
  const dateTo = params.get("dateTo") ?? "";
  const sort = params.get("sort") === "closest" ? "closest" : "newest";
  const view = params.get("view") === "list" ? "list" : "grid";
  const requestedPage = Math.max(1, Number(params.get("page")) || 1);
  const [keyword, setKeyword] = useState(query);
  const [locationInput, setLocationInput] = useState(locationFilter);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => setKeyword(query), [query]);
  useEffect(() => setLocationInput(locationFilter), [locationFilter]);

  useEffect(() => {
    const trimmed = keyword.trim();
    if (trimmed === query) return;
    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      next.delete("page");
      setParams(next);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [keyword, params, query, setParams]);

  useEffect(() => {
    const trimmed = locationInput.trim();
    if (trimmed === locationFilter) return;
    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (trimmed) next.set("location", trimmed);
      else next.delete("location");
      next.delete("page");
      setParams(next);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [locationFilter, locationInput, params, setParams]);

  const filters = { q: query, category, status, location: locationFilter, dateFrom, dateTo };
  const {
    data: items = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["items", filters],
    queryFn: () => getItems(filters),
  });

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    if (sort === "closest") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      sorted.sort(
        (a, b) =>
          Math.abs(new Date(`${a.date}T00:00:00`).getTime() - today.getTime()) -
          Math.abs(new Date(`${b.date}T00:00:00`).getTime() - today.getTime()),
      );
    } else {
      sorted.sort((a, b) => b.date.localeCompare(a.date));
    }
    return sorted;
  }, [items, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const visibleItems = sortedItems.slice((page - 1) * pageSize, page * pageSize);
  const backTo = `${routeLocation.pathname}${routeLocation.search}`;
  const hasFilters =
    Boolean(query || locationFilter || dateFrom || dateTo) ||
    status !== "all" ||
    category !== "All items";

  function updateParams(updates: Record<string, string>, resetPage = true) {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all" || value === "All items") next.delete(key);
      else next.set(key, value);
    });
    if (resetPage) next.delete("page");
    setParams(next);
  }

  function updateFilter(key: string, value: string) {
    updateParams({ [key]: value });
  }

  function updatePage(nextPage: number) {
    updateParams({ page: String(nextPage) }, false);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (keyword.trim()) next.set("q", keyword.trim());
    else next.delete("q");
    if (locationInput.trim()) next.set("location", locationInput.trim());
    else next.delete("location");
    next.delete("page");
    setParams(next);
  }

  function clearFilters() {
    setKeyword("");
    setLocationInput("");
    setParams({});
  }

  const filterFields = (prefix: string) => (
    <FilterFields
      idPrefix={prefix}
      keyword={keyword}
      location={locationInput}
      status={status}
      category={category}
      dateFrom={dateFrom}
      dateTo={dateTo}
      onKeywordChange={setKeyword}
      onLocationChange={setLocationInput}
      onFilterChange={updateFilter}
    />
  );

  return (
    <section className="browse-page page-wrap">
      <div className="page-kicker">
        <span className="eyebrow-dot" />
        The community noticeboard
      </div>
      <div className="browse-title-row">
        <div>
          <p className="eyebrow">Look around</p>
          <h1>
            Items, found &amp; <em>still missed.</em>
          </h1>
        </div>
        <p className="browse-intro">
          Search nearby listings by a useful detail, category, date, or place.
        </p>
      </div>

      <form className="browse-search" role="search" onSubmit={submitSearch}>
        <Search size={19} aria-hidden="true" />
        <label className="sr-only" htmlFor="browse-search">
          Search listings
        </label>
        <input
          id="browse-search"
          value={keyword}
          maxLength={80}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Search items, places, or details"
        />
        <label className="sr-only" htmlFor="browse-location">
          Filter by location
        </label>
        <input
          id="browse-location"
          value={locationInput}
          maxLength={80}
          onChange={(event) => setLocationInput(event.target.value)}
          placeholder="Location"
        />
        <button className="button button-dark" type="submit">
          Search
        </button>
      </form>

      <div className="browse-results-layout">
        <aside className="browse-filter-sidebar" aria-label="Filter listings">
          <div className="browse-sidebar-heading">
            <SlidersHorizontal size={16} aria-hidden="true" />
            <h2>Filters</h2>
            {hasFilters && (
              <button type="button" className="clear-filters" onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>
          {filterFields("desktop")}
        </aside>

        <div className="browse-results">
          <div className="browse-toolbar">
            <div className="browse-result-count" aria-live="polite">
              <strong>{isLoading ? "—" : sortedItems.length}</strong>
              <span>{sortedItems.length === 1 ? "listing" : "listings"}</span>
              {isFetching && !isLoading && <span className="sr-only">Updating results</span>}
            </div>
            <div className="browse-view-controls">
              <label className="browse-sort-label" htmlFor="browse-sort">
                Sort
              </label>
              <select
                id="browse-sort"
                className="browse-filter-select"
                value={sort}
                onChange={(event) => updateParams({ sort: event.target.value })}
              >
                <option value="newest">Newest</option>
                <option value="closest">Date closest</option>
              </select>
              <div className="browse-view-toggle" role="group" aria-label="View mode">
                <button
                  type="button"
                  className={view === "grid" ? "is-selected" : ""}
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                  onClick={() => updateParams({ view: "grid" }, false)}
                >
                  <Grid2X2 size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={view === "list" ? "is-selected" : ""}
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  onClick={() => updateParams({ view: "list" }, false)}
                >
                  <List size={17} aria-hidden="true" />
                </button>
              </div>
              <Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
                <Dialog.Trigger asChild>
                  <button className="browse-mobile-filter-button" type="button">
                    <SlidersHorizontal size={16} aria-hidden="true" />
                    Filters{hasFilters ? " · active" : ""}
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="browse-sheet-overlay" />
                  <Dialog.Content className="browse-filter-sheet">
                    <div className="browse-sheet-heading">
                      <div>
                        <Dialog.Title>Filter listings</Dialog.Title>
                        <Dialog.Description>
                          Narrow the noticeboard to what you remember.
                        </Dialog.Description>
                      </div>
                      <Dialog.Close asChild>
                        <button
                          className="browse-sheet-close"
                          type="button"
                          aria-label="Close filters"
                        >
                          <X size={18} />
                        </button>
                      </Dialog.Close>
                    </div>
                    {filterFields("mobile")}
                    <div className="browse-sheet-actions">
                      <button
                        className="button button-outline"
                        type="button"
                        onClick={clearFilters}
                      >
                        Clear all
                      </button>
                      <Dialog.Close asChild>
                        <button className="button button-dark" type="button">
                          Show {isLoading ? "…" : sortedItems.length} results
                        </button>
                      </Dialog.Close>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>

          {isError ? (
            <div className="browse-feedback" role="alert">
              <h2>We couldn’t load the noticeboard.</h2>
              <p>Your filters are still here. Try again when the connection is ready.</p>
              <button className="button button-outline" type="button" onClick={() => refetch()}>
                Try again
              </button>
            </div>
          ) : isLoading ? (
            <div
              className={`item-grid browse-grid${view === "list" ? " is-list" : ""}`}
              aria-label="Loading listings"
              aria-busy="true"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <article className="browse-skeleton-card" aria-hidden="true" key={index}>
                  <div className="browse-skeleton-image" />
                  <div className="browse-skeleton-copy">
                    <span />
                    <span />
                    <span />
                  </div>
                </article>
              ))}
            </div>
          ) : visibleItems.length > 0 ? (
            <>
              <div className={`item-grid browse-grid${view === "list" ? " is-list" : ""}`}>
                {visibleItems.map((item) => (
                  <ItemCard item={item} key={item.id} backTo={backTo} />
                ))}
              </div>
              {pageCount > 1 && (
                <div className="browse-pagination-row">
                  <span>
                    Showing {(page - 1) * pageSize + 1}–
                    {Math.min(page * pageSize, sortedItems.length)} of {sortedItems.length}
                  </span>
                  <Pagination page={page} pageCount={pageCount} onPageChange={updatePage} />
                </div>
              )}
            </>
          ) : (
            <div className="browse-feedback browse-empty-state">
              <Search size={24} aria-hidden="true" />
              <h2>No listings match those filters.</h2>
              <p>Try a wider date range or remove a filter to see more of the board.</p>
              {hasFilters && (
                <button className="button button-outline" type="button" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
              {!hasFilters && (
                <Link className="button button-dark" to="/report/lost">
                  Post the first listing
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
