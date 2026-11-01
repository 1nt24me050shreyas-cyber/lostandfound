import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

export function NotFoundPage() {
  return (
    <PageContainer className="not-found-page">
      <p className="eyebrow">
        <span className="eyebrow-dot" />
        404 · Wrong turn
      </p>
      <h1>This page wandered off.</h1>
      <p>That address doesn’t lead to a listing or a page on our neighborhood board.</p>
      <div className="not-found-actions">
        <Link className="button button-dark" to="/items">
          Browse current listings <ArrowRight size={15} />
        </Link>
        <Link className="text-link" to="/">
          <ArrowLeft size={14} /> Back to Common Ground
        </Link>
      </div>
    </PageContainer>
  );
}
