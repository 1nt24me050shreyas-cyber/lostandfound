import { ArrowRight, Clock3, MapPin, Search, X } from "lucide-react";
import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const storageKey = "common-ground-recent-searches";
const recentSearchSchema = z.array(
  z.object({
    keyword: z.string(),
    category: z.string(),
    location: z.string(),
  }),
);
const searchSchema = z.object({
  keyword: z.string().trim().max(80),
  category: z.string(),
  location: z.string().trim().max(80),
});

export type ListingSearch = z.infer<typeof searchSchema>;

const categories = [
  "All categories",
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

function readRecentSearches(): ListingSearch[] {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    const result = recentSearchSchema.safeParse(parsed);
    return result.success ? result.data.slice(0, 5) : [];
  } catch (error) {
    console.warn("Recent searches could not be read from storage.", error);
    return [];
  }
}

function searchLabel(search: ListingSearch): string {
  return [
    search.keyword,
    search.category !== "All categories" ? search.category : "",
    search.location,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function ListingSearchBar() {
  const [values, setValues] = useState<ListingSearch>({
    keyword: "",
    category: "All categories",
    location: "",
  });
  const [recentSearches, setRecentSearches] = useState(readRecentSearches);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const inputId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  function updateValue(field: keyof ListingSearch, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function submitSearch(search: ListingSearch) {
    const parsed = searchSchema.safeParse(search);
    if (!parsed.success) return;

    const next = parsed.data;
    const hasFilters = next.keyword || next.location || next.category !== "All categories";

    if (hasFilters) {
      const updatedRecent = [
        next,
        ...recentSearches.filter((entry) => searchLabel(entry) !== searchLabel(next)),
      ].slice(0, 5);
      setRecentSearches(updatedRecent);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(updatedRecent));
      } catch (error) {
        console.warn("Recent searches could not be saved.", error);
      }
    }

    const params = new URLSearchParams();
    if (next.keyword) params.set("q", next.keyword);
    if (next.category !== "All categories") params.set("category", next.category);
    if (next.location) params.set("location", next.location);
    setSuggestionsOpen(false);
    setActiveIndex(-1);
    navigate(`/items${params.size ? `?${params.toString()}` : ""}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitSearch(values);
  }

  function handleKeywordKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setSuggestionsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === "ArrowDown" && recentSearches.length > 0) {
      event.preventDefault();
      setSuggestionsOpen(true);
      setActiveIndex((index) => (index + 1) % recentSearches.length);
      return;
    }

    if (event.key === "ArrowUp" && suggestionsOpen && recentSearches.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? recentSearches.length - 1 : index - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && suggestionsOpen) {
      event.preventDefault();
      submitSearch(recentSearches[activeIndex]);
    }
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    setActiveIndex(-1);
    try {
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("Recent searches could not be cleared from storage.", error);
    }
  }

  return (
    <div
      className="listing-search-wrap"
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setSuggestionsOpen(false);
      }}
    >
      <form className="listing-search" role="search" onSubmit={handleSubmit}>
        <div className="listing-search-keyword">
          <Search size={19} aria-hidden="true" />
          <label className="sr-only" htmlFor={inputId}>
            Keyword or item detail
          </label>
          <input
            id={inputId}
            type="search"
            autoComplete="off"
            maxLength={80}
            placeholder="What are you looking for?"
            value={values.keyword}
            role="combobox"
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-expanded={suggestionsOpen && recentSearches.length > 0}
            aria-controls={listId}
            aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
            onFocus={() => setSuggestionsOpen(true)}
            onChange={(event) => {
              updateValue("keyword", event.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeywordKeyDown}
          />
          {values.keyword && (
            <button
              className="listing-search-clear"
              type="button"
              aria-label="Clear keyword"
              onClick={() => updateValue("keyword", "")}
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="listing-search-secondary">
          <label className="listing-search-field">
            <span className="sr-only">Category</span>
            <select
              value={values.category}
              onChange={(event) => updateValue("category", event.target.value)}
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="listing-search-field listing-location-field">
            <MapPin size={15} aria-hidden="true" />
            <span className="sr-only">Location</span>
            <input
              type="search"
              maxLength={80}
              placeholder="Near a place or neighborhood"
              value={values.location}
              onChange={(event) => updateValue("location", event.target.value)}
            />
          </label>
          <button className="listing-search-submit" type="submit">
            Search <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </form>

      {suggestionsOpen && recentSearches.length > 0 && (
        <div className="recent-search-popover">
          <div className="recent-search-heading">
            <span>
              <Clock3 size={14} aria-hidden="true" /> Recent searches
            </span>
            <button type="button" onClick={clearRecentSearches}>
              Clear history
            </button>
          </div>
          <div id={listId} role="listbox" aria-label="Recent searches">
            {recentSearches.map((search, index) => (
              <button
                key={`${searchLabel(search)}-${index}`}
                type="button"
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? "is-active" : ""}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => submitSearch(search)}
              >
                <Clock3 size={14} aria-hidden="true" />
                <span>{searchLabel(search) || "All listings"}</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
