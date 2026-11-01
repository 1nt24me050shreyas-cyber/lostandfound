import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, Check, HandHeart, Search, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { ListingSearchBar } from "@/components/layout/ListingSearchBar";
import { ItemCard } from "@/components/ui/ItemCard";
import { getHomeStats, getItems } from "@/features/items/items.api";

const steps = [
  {
    title: "Search the board",
    description: "Look through recent finds or narrow the list by item, category, and place.",
  },
  {
    title: "Share a useful detail",
    description: "If it is yours, tell the finder something about it that is not in the listing.",
  },
  {
    title: "Arrange a safe handoff",
    description: "Once the finder confirms, agree on a public place and time to meet.",
  },
];

export function HomePage() {
  const {
    data: items = [],
    isLoading: isItemsLoading,
    isError: isItemsError,
  } = useQuery({
    queryKey: ["items", "home", "found"],
    queryFn: () => getItems({ status: "found" }),
  });
  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
  } = useQuery({ queryKey: ["home-stats"], queryFn: getHomeStats });

  const recentItems = [...items].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <div className="home-page">
      <section className="home-search-section page-wrap" aria-labelledby="home-heading">
        <p className="eyebrow">
          <span className="eyebrow-dot" />
          Lost &amp; found, close to home
        </p>
        <h1 id="home-heading">
          A small detail can <em>bring it back.</em>
        </h1>
        <p className="home-lede">
          Search nearby lost and found listings, or let your neighbors know what you need.
        </p>
        <ListingSearchBar />
        <p className="home-search-hint">
          <Search size={14} aria-hidden="true" />
          Search by an item detail, a category, or the place you last saw it.
        </p>
      </section>

      <section className="report-paths page-wrap" aria-label="Report an item">
        <Link className="report-path report-path-lost" to="/report/lost">
          <span className="report-path-icon" aria-hidden="true">
            <Search size={18} />
          </span>
          <span className="report-path-copy">
            <span className="eyebrow">Looking for something?</span>
            <strong>I lost something</strong>
            <span>Post when and where you last had it. We’ll help people spot a match.</span>
          </span>
          <ArrowUpRight size={19} aria-hidden="true" />
        </Link>
        <Link className="report-path report-path-found" to="/report/found">
          <span className="report-path-icon" aria-hidden="true">
            <HandHeart size={19} />
          </span>
          <span className="report-path-copy">
            <span className="eyebrow">Picked something up?</span>
            <strong>I found something</strong>
            <span>Share a few details so its owner can recognize it and get in touch.</span>
          </span>
          <ArrowUpRight size={19} aria-hidden="true" />
        </Link>
      </section>

      <section className="recent-section page-wrap" aria-labelledby="recent-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A few recent finds</p>
            <h2 id="recent-heading">Recently found</h2>
          </div>
          <Link className="text-link section-link" to="/items?status=found">
            Browse all finds <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        {isItemsError && (
          <p className="inline-error" role="alert">
            We couldn’t load recent finds. Please refresh to try again.
          </p>
        )}
        {isItemsLoading ? (
          <div className="home-found-grid" aria-label="Loading recent finds" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => (
              <article className="home-item-skeleton" aria-hidden="true" key={index}>
                <div className="skeleton-block home-skeleton-image" />
                <div className="home-skeleton-copy">
                  <div className="skeleton-block home-skeleton-category" />
                  <div className="skeleton-block home-skeleton-title" />
                  <div className="skeleton-block home-skeleton-place" />
                </div>
              </article>
            ))}
          </div>
        ) : !isItemsError && recentItems.length > 0 ? (
          <div className="home-found-grid">
            {recentItems.map((item) => (
              <ItemCard item={item} key={item.id} />
            ))}
          </div>
        ) : null}
        {!isItemsLoading && !isItemsError && recentItems.length === 0 && (
          <p className="empty-copy">No found items are listed right now. Check back soon.</p>
        )}
      </section>

      <section className="how-section" aria-labelledby="how-heading">
        <div className="how-inner page-wrap">
          <div className="how-intro">
            <p className="eyebrow">
              <span className="eyebrow-dot" />A straightforward handoff
            </p>
            <h2 id="how-heading">
              How it <em>works</em>
            </h2>
            <p>Good details help the right person find their way back to what matters.</p>
            <Link className="text-link" to="/how-it-works">
              Read our community guidelines <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <ol className="how-steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className="how-step-number">0{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                {index === 2 && (
                  <ShieldCheck className="how-step-icon" size={19} aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="home-stats page-wrap" aria-label="Community activity">
        {isStatsError ? (
          <p className="stats-error" role="alert">
            Community numbers are unavailable right now.
          </p>
        ) : (
          <>
            <div className="stats-intro">
              <Check size={17} aria-hidden="true" />
              <p>
                Neighbors looking out
                <br />
                for one another.
              </p>
            </div>
            <div className="stat">
              <strong>{isStatsLoading ? "—" : (stats?.returnedThisMonth ?? 0)}</strong>
              <span>returned this month</span>
            </div>
            <div className="stat">
              <strong>{isStatsLoading ? "—" : (stats?.activeListings ?? 0)}</strong>
              <span>open listings</span>
            </div>
            <div className="stat">
              <strong>{isStatsLoading ? "—" : (stats?.neighborsContributing ?? 0)}</strong>
              <span>neighbors pitching in</span>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
