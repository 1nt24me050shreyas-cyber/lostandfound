import { Search } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export function SiteSearch({ onNavigate }: { onNavigate?: () => void }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const inputId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const search = query.trim();
    navigate(`/items${search ? `?q=${encodeURIComponent(search)}` : ""}`);
    onNavigate?.();
  }

  return (
    <form className="site-search" role="search" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={inputId}>
        Search lost and found listings
      </label>
      <Search size={16} aria-hidden="true" />
      <input
        id={inputId}
        name="q"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search items"
      />
      <button type="submit" aria-label="Search listings">
        <span>Search</span>
      </button>
    </form>
  );
}
