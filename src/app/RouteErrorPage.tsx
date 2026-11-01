import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

export function RouteErrorPage() {
  const error = useRouteError();
  const isMissingRoute = isRouteErrorResponse(error) && error.status === 404;

  if (!isRouteErrorResponse(error)) {
    console.error("Route rendering failed.", error);
  }

  return (
    <PageContainer className="route-error-page" role="alert">
      <p className="eyebrow">
        <span className="eyebrow-dot" />
        {isMissingRoute ? "404 · Not on the board" : "A brief interruption"}
      </p>
      <h1>{isMissingRoute ? "We couldn’t find that page." : "We hit a small snag."}</h1>
      <p>
        {isMissingRoute
          ? "It may have moved, or the address might be a little off. The listings are still here when you’re ready."
          : "This part of the noticeboard didn’t load as expected. Try once more, or head back to the listings."}
      </p>
      <div className="not-found-actions">
        {isMissingRoute ? (
          <Link className="button button-dark" to="/items">
            Browse current listings
          </Link>
        ) : (
          <button
            className="button button-dark"
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again <RefreshCw size={14} />
          </button>
        )}
        <Link className="text-link" to="/">
          <ArrowLeft size={14} /> Return to the noticeboard
        </Link>
      </div>
      {isRouteErrorResponse(error) && error.status >= 500 && (
        <p className="error-reference">Reference: {error.status}</p>
      )}
    </PageContainer>
  );
}
