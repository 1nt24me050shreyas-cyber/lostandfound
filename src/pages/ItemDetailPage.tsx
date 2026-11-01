import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Hash,
  ImageOff,
  MapPin,
  Share2,
  ShieldCheck,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useParams } from "react-router-dom";
import { z } from "zod";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ItemCard } from "@/components/ui/ItemCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { submitClaim } from "@/features/claims/claims.api";
import { getItem, getItems, reportItem } from "@/features/items/items.api";
import type { Claim } from "@/types";

const claimSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.string().trim().email("Enter a valid email address."),
  details: z
    .string()
    .trim()
    .min(20, "Add a detail that helps confirm this item is yours.")
    .max(500, "Keep your note under 500 characters."),
});
const reportSchema = z.object({
  reason: z.string().min(1, "Choose a reason."),
  details: z.string().trim().min(10, "Please add a little more detail.").max(400),
});

export function ItemDetailPage() {
  const { id = "" } = useParams();
  return <ItemDetailContent key={id} id={id} />;
}

function ItemDetailContent({ id }: { id: string }) {
  const location = useLocation();
  const [claimOpen, setClaimOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const galleryRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const {
    data: item,
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ["item", id], queryFn: () => getItem(id) });
  const relatedQuery = useQuery({
    queryKey: ["items", "related", item?.category],
    queryFn: () => getItems({ category: item?.category }),
    enabled: Boolean(item),
  });
  const mutation = useMutation({
    mutationFn: (values: Claim) => submitClaim(id, values),
    onSuccess: () => setClaimOpen(false),
  });
  const reportMutation = useMutation({
    mutationFn: (values: z.infer<typeof reportSchema>) => reportItem(id, values),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Claim>({
    resolver: zodResolver(claimSchema),
  });
  const reportForm = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
  });

  async function sendClaim(values: Claim) {
    await mutation.mutateAsync(values);
    reset();
    await queryClient.invalidateQueries({ queryKey: ["item", id] });
  }

  async function sendReport(values: z.infer<typeof reportSchema>) {
    await reportMutation.mutateAsync(values);
    reportForm.reset();
  }

  async function shareListing() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: item?.title, text: "A listing on Common Ground", url });
        setShareMessage("Listing shared.");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link copied.");
      } else {
        setShareMessage("Sharing isn’t available in this browser.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareMessage("We couldn’t share this link. You can copy it from your address bar.");
    }
  }

  function moveGallery(direction: -1 | 1) {
    const count = item ? new Set([item.image, ...(item.images ?? [])]).size : 0;
    if (!count) return;
    setActiveImage((current) => (current + direction + count) % count);
  }

  if (isLoading)
    return (
      <section className="page-wrap detail-state" aria-busy="true">
        <p className="loading-copy">Opening the listing…</p>
        <div className="detail-loading-skeleton" />
      </section>
    );
  if (isError || !item)
    return (
      <section className="page-wrap detail-state" role="alert">
        <p className="eyebrow">Not on the board</p>
        <h1>We couldn’t load that listing.</h1>
        <p>It may have been removed, or the connection may have dropped.</p>
        <button className="button button-outline" type="button" onClick={() => refetch()}>
          Try again
        </button>
        <Link className="text-link detail-back-all" to="/items">
          Browse all listings <ArrowRight size={14} />
        </Link>
      </section>
    );

  const routeState = location.state as { reported?: boolean; from?: unknown } | null;
  const requestedBackTo =
    typeof routeState?.from === "string" &&
    routeState.from.startsWith("/") &&
    !routeState.from.startsWith("//")
      ? routeState.from
      : "/items";
  const gallery = [...new Set([item.image, ...(item.images ?? [])])];
  const relatedItems = (relatedQuery.data ?? [])
    .filter(
      (related) =>
        related.id !== item.id && (related.status === "lost" || related.status === "found"),
    )
    .slice(0, 3);
  const isAvailable = item.status === "lost" || item.status === "found";

  return (
    <section className="detail-page page-wrap">
      <Breadcrumbs
        items={[{ label: "Browse listings", href: requestedBackTo }, { label: item.title }]}
      />
      <Link className="back-link detail-back-link" to={requestedBackTo}>
        <ArrowLeft size={15} /> Back to results
      </Link>
      {routeState?.reported && (
        <div className="success-banner" role="status">
          <CheckCircle2 size={18} /> Your listing is live on the community board.
        </div>
      )}

      <div className="detail-layout">
        <div>
          <div
            className="detail-gallery"
            ref={galleryRef}
            tabIndex={gallery.length > 1 ? 0 : -1}
            aria-label={
              gallery.length > 1
                ? "Item photo gallery. Use the left and right arrow keys to browse photos."
                : "Item photo"
            }
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveGallery(-1);
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                moveGallery(1);
              }
            }}
          >
            <div className="detail-photo">
              {imageFailed ? (
                <div
                  className="detail-image-fallback"
                  role="img"
                  aria-label={`Image unavailable for ${item.title}`}
                >
                  <ImageOff size={28} aria-hidden="true" />
                  <span>Image unavailable</span>
                </div>
              ) : (
                <img
                  src={gallery[activeImage]}
                  alt={`Photo of ${item.title}`}
                  onError={() => setImageFailed(true)}
                />
              )}
              <span className="photo-caption">Shared by {item.reporter}</span>
              {gallery.length > 1 && (
                <>
                  <button
                    className="gallery-arrow gallery-arrow-previous"
                    type="button"
                    aria-label="Previous photo"
                    onClick={() => moveGallery(-1)}
                  >
                    <ChevronLeft size={19} />
                  </button>
                  <button
                    className="gallery-arrow gallery-arrow-next"
                    type="button"
                    aria-label="Next photo"
                    onClick={() => moveGallery(1)}
                  >
                    <ChevronRight size={19} />
                  </button>
                </>
              )}
            </div>
            <div className="detail-thumbnails" aria-label="Choose a photo">
              {gallery.map((image, index) => (
                <button
                  className={index === activeImage ? "is-current" : ""}
                  type="button"
                  key={`${image}-${index}`}
                  aria-label={`Show photo ${index + 1}`}
                  aria-pressed={index === activeImage}
                  onClick={() => {
                    setActiveImage(index);
                    setImageFailed(false);
                  }}
                >
                  {imageFailed ? (
                    <ImageOff size={17} aria-hidden="true" />
                  ) : (
                    <img src={image} alt="" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="detail-copy">
          <div className="detail-badges">
            <StatusBadge status={item.status} />
            <span>{item.category}</span>
          </div>
          <h1>{item.title}</h1>
          <p className="detail-description">{item.description}</p>
          <dl className="detail-meta">
            <div>
              <MapPin size={17} aria-hidden="true" />
              <dt>Location</dt>
              <dd>{item.location}</dd>
            </div>
            <div>
              <CalendarDays size={17} aria-hidden="true" />
              <dt>{item.status === "lost" ? "Date lost" : "Date listed"}</dt>
              <dd>
                <time dateTime={item.date}>
                  {new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                {item.time && <span className="detail-meta-time"> · {item.time}</span>}
              </dd>
            </div>
            <div>
              <Hash size={16} aria-hidden="true" />
              <dt>Reference</dt>
              <dd>{item.id}</dd>
            </div>
          </dl>

          <div className="detail-actions-row">
            <button className="detail-utility-button" type="button" onClick={shareListing}>
              <Share2 size={15} aria-hidden="true" /> Share
            </button>
            <Dialog.Root
              open={reportOpen}
              onOpenChange={(open) => {
                setReportOpen(open);
                if (!open) reportMutation.reset();
              }}
            >
              <Dialog.Trigger asChild>
                <button className="detail-utility-button" type="button">
                  <Flag size={15} aria-hidden="true" /> Report listing
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="ui-dialog-overlay" />
                <Dialog.Content className="ui-dialog-content detail-report-dialog">
                  <div className="ui-dialog-heading">
                    <div>
                      <Dialog.Title className="ui-dialog-title">Report this listing</Dialog.Title>
                      <Dialog.Description className="ui-dialog-description">
                        Tell us what needs attention. Your report is kept private.
                      </Dialog.Description>
                    </div>
                    <Dialog.Close className="ui-icon-button" aria-label="Close report dialog">
                      <X size={17} />
                    </Dialog.Close>
                  </div>
                  {reportMutation.isSuccess ? (
                    <div className="detail-report-success" role="status">
                      <CheckCircle2 size={21} />
                      <p>{reportMutation.data.message}</p>
                    </div>
                  ) : (
                    <form
                      className="detail-report-form"
                      onSubmit={reportForm.handleSubmit(sendReport)}
                      noValidate
                    >
                      <label htmlFor="report-reason">Reason</label>
                      <select id="report-reason" {...reportForm.register("reason")}>
                        <option value="">Choose a reason</option>
                        <option value="incorrect">Incorrect or outdated information</option>
                        <option value="unsafe">Unsafe or inappropriate content</option>
                        <option value="duplicate">Duplicate listing</option>
                        <option value="other">Something else</option>
                      </select>
                      {reportForm.formState.errors.reason && (
                        <span className="field-error">
                          {reportForm.formState.errors.reason.message}
                        </span>
                      )}
                      <label htmlFor="report-details">What should we know?</label>
                      <textarea
                        id="report-details"
                        rows={4}
                        maxLength={400}
                        {...reportForm.register("details")}
                      />
                      {reportForm.formState.errors.details && (
                        <span className="field-error">
                          {reportForm.formState.errors.details.message}
                        </span>
                      )}
                      {reportMutation.isError && (
                        <p className="form-error" role="alert">
                          {reportMutation.error.message}
                        </p>
                      )}
                      <button
                        className="button button-dark"
                        type="submit"
                        disabled={reportMutation.isPending}
                      >
                        {reportMutation.isPending ? "Sending…" : "Send report"}
                      </button>
                    </form>
                  )}
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
          <p className="detail-share-status" role="status" aria-live="polite">
            {shareMessage}
          </p>

          <div className="detail-action">
            {mutation.isSuccess ? (
              <div className="claim-success" role="status">
                <CheckCircle2 size={19} aria-hidden="true" />
                <div>
                  <strong>Note sent safely.</strong>
                  <span>{item.reporter} can now get in touch with you.</span>
                </div>
              </div>
            ) : isAvailable ? (
              <>
                <button
                  className="button button-dark"
                  type="button"
                  onClick={() => setClaimOpen(!claimOpen)}
                  aria-expanded={claimOpen}
                >
                  {item.status === "found" ? "This is mine" : "I found this"}{" "}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
                <p>
                  <ShieldCheck size={14} aria-hidden="true" /> Your contact details are only shared
                  with the person who posted.
                </p>
              </>
            ) : (
              <p className="detail-closed-notice">
                This listing is {item.status === "claimed" ? "being claimed" : "marked returned"}.
              </p>
            )}
          </div>
          {claimOpen && isAvailable && !mutation.isSuccess && (
            <form
              className="claim-form"
              onSubmit={handleSubmit((values) => sendClaim(values))}
              noValidate
            >
              <h2>Send a private note</h2>
              <p>
                Share one detail that helps confirm the connection. Please don’t include sensitive
                information.
              </p>
              <div className="form-field">
                <label htmlFor="claim-name">Your name</label>
                <input
                  id="claim-name"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  {...register("name")}
                />
                {errors.name && <span className="field-error">{errors.name.message}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="claim-email">Email address</label>
                <input
                  id="claim-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                />
                {errors.email && <span className="field-error">{errors.email.message}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="claim-details">How do you recognize it?</label>
                <textarea
                  id="claim-details"
                  rows={3}
                  aria-invalid={Boolean(errors.details)}
                  {...register("details")}
                />
                {errors.details && <span className="field-error">{errors.details.message}</span>}
              </div>
              {mutation.isError && (
                <p className="form-error" role="alert">
                  {mutation.error.message}
                </p>
              )}
              <button className="button button-dark form-submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Sending…" : "Send private note"}{" "}
                <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            </form>
          )}
        </div>
      </div>

      {relatedQuery.isError && (
        <p className="inline-error detail-related-error" role="alert">
          We couldn’t load related listings.
          <button type="button" onClick={() => relatedQuery.refetch()}>
            Try again
          </button>
        </p>
      )}
      {!relatedQuery.isLoading && relatedItems.length > 0 && (
        <section className="detail-related" aria-labelledby="related-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">You may recognize another detail</p>
              <h2 id="related-heading">Related listings</h2>
            </div>
            <Link className="text-link" to="/items">
              Browse everything <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="item-grid">
            {relatedItems.map((related) => (
              <ItemCard item={related} key={related.id} backTo={requestedBackTo} />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
