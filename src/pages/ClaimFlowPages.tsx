import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  Clock3,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  getClaim,
  getMessageThreads,
  getThread,
  markThreadRead,
  saveHandoverDetails,
  sendThreadMessage,
  updateClaimStatus,
} from "@/features/claims/claims.api";
import type { ClaimStatus, HandoverDetails, Message, MessageThread } from "@/types";
import { useAuth } from "@/hooks/useAuth";

const statuses: Array<{ value: ClaimStatus; label: string }> = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "handed_over", label: "Handed over" },
];

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flow-error" role="alert">
      <p>We couldn’t load this information. Please check your connection and try again.</p>
      <Button variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function ClaimStatusPage() {
  const { claimId = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const claimQuery = useQuery({
    queryKey: ["claim", claimId],
    queryFn: () => getClaim(claimId),
    enabled: Boolean(claimId),
  });
  const statusMutation = useMutation({
    mutationFn: (status: ClaimStatus) => updateClaimStatus(claimId, status),
    onSuccess: async (data) => {
      queryClient.setQueryData(["claim", claimId], data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["account", "claims"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({ queryKey: ["items"] }),
      ]);
    },
  });

  if (claimQuery.isLoading)
    return (
      <div className="flow-page">
        <p className="account-loading">Loading claim…</p>
      </div>
    );
  if (claimQuery.isError || !claimQuery.data) {
    return (
      <div className="flow-page">
        <ErrorState onRetry={() => void claimQuery.refetch()} />
      </div>
    );
  }

  const { claim, item, ownerName, handover, threadId } = claimQuery.data;
  const currentStatus = claim.status ?? "submitted";
  const history = claim.statusHistory ?? [
    { status: currentStatus, timestamp: claim.createdAt ?? new Date().toISOString() },
  ];
  const visibleStatuses =
    currentStatus === "rejected"
      ? (["submitted", "under_review", "rejected"] as ClaimStatus[])
      : statuses.map(({ value }) => value);
  const isOwner = user?.id === claim.ownerId;
  const isClaimant =
    user?.id === claim.userId || user?.email.toLowerCase() === claim.email.toLowerCase();
  const canReview = isOwner && currentStatus === "submitted";
  const canDecide = isOwner && currentStatus === "under_review";
  const canComplete = isOwner && currentStatus === "approved" && Boolean(handover);
  const conversationName = isOwner ? claim.name : ownerName;
  const errorText = statusMutation.error instanceof Error ? statusMutation.error.message : "";

  return (
    <div className="flow-page">
      <Link className="flow-back-link" to="/account">
        <ArrowLeft size={15} /> Your account
      </Link>
      <header className="flow-page-heading">
        <p className="auth-eyebrow">CLAIM PROGRESS</p>
        <h1>{item.title}</h1>
        <p>
          Submitted {claim.createdAt ? formatTimestamp(claim.createdAt) : "recently"} · Finder:{" "}
          {ownerName}
        </p>
      </header>

      <div className="flow-content-grid">
        <section className="flow-card">
          <div className="flow-card-heading">
            <div>
              <h2>Status timeline</h2>
              <p>Updates are shared with everyone in this claim.</p>
            </div>
            <span className={`flow-status-pill flow-status-pill--${currentStatus}`}>
              {currentStatus.replace("_", " ")}
            </span>
          </div>
          <ol className="claim-timeline">
            {visibleStatuses.map((status, index) => {
              const entry = history.find((event) => event.status === status);
              const isRejected = status === "rejected";
              return (
                <li
                  className={`claim-timeline-step${entry ? " is-complete" : ""}${isRejected ? " is-rejected" : ""}`}
                  key={status}
                >
                  <span className="claim-timeline-marker" aria-hidden="true">
                    {entry ? <Check size={14} /> : <span>{index + 1}</span>}
                  </span>
                  <div>
                    <strong>
                      {statuses.find((itemStatus) => itemStatus.value === status)?.label ??
                        "Not approved"}
                    </strong>
                    {entry ? (
                      <>
                        <time dateTime={entry.timestamp}>{formatTimestamp(entry.timestamp)}</time>
                        {entry.note && <p>{entry.note}</p>}
                      </>
                    ) : (
                      <p>We’ll let you know when this step is complete.</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {errorText && (
            <p className="auth-form-error" role="alert">
              {errorText}
            </p>
          )}
          {canReview && (
            <Button
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate("under_review")}
            >
              Start review <ArrowRight size={15} />
            </Button>
          )}
          {canDecide && (
            <div className="flow-action-row">
              <Button
                variant="danger"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate("rejected")}
              >
                Reject claim
              </Button>
              <Button
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate("approved")}
              >
                Approve claim
              </Button>
            </div>
          )}
          {currentStatus === "rejected" && (
            <p className="flow-note">
              This claim was not approved. The listing is available to the community again.
            </p>
          )}
        </section>

        <aside className="flow-card flow-claim-summary">
          <h2>Proof of ownership</h2>
          <p className="flow-summary-label">Unique marks and details</p>
          <p>{claim.uniqueMarks || claim.details}</p>
          {claim.lostDate && (
            <>
              <p className="flow-summary-label">When it was lost</p>
              <p>{claim.lostDate}</p>
            </>
          )}
          {claim.lostLocation && (
            <>
              <p className="flow-summary-label">Where it was lost</p>
              <p>{claim.lostLocation}</p>
            </>
          )}
          {claim.photoUrl && (
            <img
              className="claim-proof-photo"
              src={claim.photoUrl}
              alt="Photo provided as proof of ownership"
              width={640}
              height={480}
              loading="lazy"
            />
          )}
          <div className="flow-privacy-note">
            <ShieldCheck size={16} /> Contact details stay private.
          </div>
        </aside>
      </div>

      <section className="flow-next-steps">
        {threadId && (isClaimant || isOwner) ? (
          <Link className="flow-next-card" to={`/messages/${threadId}`}>
            <MessageCircle size={20} />
            <span>
              <strong>Message {conversationName}</strong>
              <small>Keep your conversation private and on Common Ground.</small>
            </span>
            <ArrowRight size={16} />
          </Link>
        ) : (
          <div className="flow-next-card flow-next-card--muted">
            <MessageCircle size={20} />
            <span>
              <strong>Private conversation</strong>
              <small>Sign in with the email used for your claim to message the finder.</small>
            </span>
            <Link to="/sign-in" state={{ from: { pathname: `/claims/${claimId}` } }}>
              Sign in
            </Link>
          </div>
        )}
        {(currentStatus === "approved" || currentStatus === "handed_over") && (
          <Link className="flow-next-card" to={`/claims/${claimId}/handover`}>
            <MapPin size={20} />
            <span>
              <strong>Handover details</strong>
              <small>
                {handover ? "Pickup details are ready." : "Agree on a safe pickup place and time."}
              </small>
            </span>
            <ArrowRight size={16} />
          </Link>
        )}
        {canComplete && (
          <Button
            loading={statusMutation.isPending}
            onClick={() => statusMutation.mutate("handed_over")}
          >
            Mark as handed over <CheckCheck size={16} />
          </Button>
        )}
      </section>
    </div>
  );
}

const handoverSchema = z.object({
  pickupLocation: z.string().trim().min(4, "Add a public pickup place.").max(120),
  pickupTime: z.string().trim().min(4, "Add a pickup time or time window.").max(100),
  idRequired: z.boolean(),
});

export function HandoverPage() {
  const { claimId = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const claimQuery = useQuery({
    queryKey: ["claim", claimId],
    queryFn: () => getClaim(claimId),
    enabled: Boolean(claimId),
  });
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HandoverDetails>({
    resolver: zodResolver(handoverSchema),
    values: claimQuery.data?.handover ?? { pickupLocation: "", pickupTime: "", idRequired: true },
  });
  const handoverMutation = useMutation({
    mutationFn: (details: HandoverDetails) => saveHandoverDetails(claimId, details),
    onSuccess: async (handover) => {
      queryClient.setQueryData(["claim", claimId], (current: typeof claimQuery.data) =>
        current ? { ...current, handover } : current,
      );
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setFormError("");
    },
    onError: (error) => setFormError(error.message),
  });

  if (claimQuery.isLoading)
    return (
      <div className="flow-page">
        <p className="account-loading">Loading handover…</p>
      </div>
    );
  if (claimQuery.isError || !claimQuery.data) {
    return (
      <div className="flow-page">
        <ErrorState onRetry={() => void claimQuery.refetch()} />
      </div>
    );
  }
  const { claim, item, handover } = claimQuery.data;
  const isOwner = user?.id === claim.ownerId;
  const isClaimant =
    user?.id === claim.userId || user?.email.toLowerCase() === claim.email.toLowerCase();
  if (!isOwner && !isClaimant) {
    return (
      <div className="flow-page">
        <ErrorState onRetry={() => void claimQuery.refetch()} />
      </div>
    );
  }
  if (claim.status !== "approved" && claim.status !== "handed_over") {
    return (
      <div className="flow-page">
        <EmptyState
          title="Handover comes after approval"
          description="Once the finder approves your claim, you can agree on a safe pickup here."
          action={
            <Link className="ui-button ui-button--secondary" to={`/claims/${claimId}`}>
              Back to claim status
            </Link>
          }
        />
      </div>
    );
  }

  async function submit(values: HandoverDetails) {
    setFormError("");
    try {
      await handoverMutation.mutateAsync(values);
    } catch {
      return;
    }
  }

  return (
    <div className="flow-page">
      <Link className="flow-back-link" to={`/claims/${claimId}`}>
        <ArrowLeft size={15} /> Claim progress
      </Link>
      <header className="flow-page-heading">
        <p className="auth-eyebrow">SAFE PICKUP</p>
        <h1>Arrange the handover</h1>
        <p>
          {item.title} · Keep the exchange in a public place and your conversation on the platform.
        </p>
      </header>
      {handover && (!isOwner || claim.status === "handed_over") ? (
        <section className="flow-card handover-details">
          <h2>Pickup plan</h2>
          <p>
            <MapPin size={16} /> {handover.pickupLocation}
          </p>
          <p>
            <Clock3 size={16} /> {handover.pickupTime}
          </p>
          <p>
            <ShieldCheck size={16} />{" "}
            {handover.idRequired ? "Bring ID to confirm ownership." : "No ID is required."}
          </p>
          <Link className="flow-inline-link" to={`/messages/${claimQuery.data.threadId}`}>
            Message the finder <ArrowRight size={14} />
          </Link>
        </section>
      ) : isOwner ? (
        <form className="flow-card handover-form" onSubmit={handleSubmit(submit)} noValidate>
          <h2>{handover ? "Update pickup plan" : "Set a pickup plan"}</h2>
          <div className="auth-field">
            <label htmlFor="pickup-location">Public pickup location</label>
            <Input
              id="pickup-location"
              placeholder="e.g. Northside Library front desk"
              error={errors.pickupLocation?.message}
              {...register("pickupLocation")}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="pickup-time">Pickup date and time</label>
            <Input
              id="pickup-time"
              placeholder="e.g. Saturday, 10 am–noon"
              error={errors.pickupTime?.message}
              {...register("pickupTime")}
            />
          </div>
          <Checkbox
            id="pickup-id-required"
            label="Ask the claimant to bring ID"
            checked={watch("idRequired")}
            onCheckedChange={(checked) =>
              setValue("idRequired", checked === true, { shouldDirty: true })
            }
          />
          {formError && (
            <p className="auth-form-error" role="alert">
              {formError}
            </p>
          )}
          <div className="flow-action-row">
            <Button type="submit" loading={handoverMutation.isPending}>
              Save pickup details
            </Button>
            {handover && (
              <span className="flow-saved-note">
                Saved {formatTimestamp(handover.updatedAt ?? "")}
              </span>
            )}
          </div>
          <p className="flow-note">
            Choose a staffed or well-lit public place. Never include a home address.
          </p>
        </form>
      ) : (
        <section className="flow-card handover-details">
          <h2>Pickup plan is being arranged</h2>
          <p>
            The finder will add a public pickup location and time here. You’ll receive a
            notification when it’s ready.
          </p>
        </section>
      )}
    </div>
  );
}

const messageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a message.")
    .max(2000, "Keep messages under 2,000 characters.")
    .refine(
      (value) => !/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(value),
      "Please don’t share email addresses in messages.",
    )
    .refine(
      (value) => !/(?:\+?\d[\d\s().-]{7,}\d)/.test(value),
      "Please don’t share phone numbers in messages.",
    ),
});

export function MessagesPage() {
  const { threadId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const threadsQuery = useQuery({ queryKey: ["message-threads"], queryFn: getMessageThreads });
  const conversationQuery = useQuery({
    queryKey: ["message-thread", threadId],
    queryFn: () => getThread(threadId ?? ""),
    enabled: Boolean(threadId),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ body: string }>({ resolver: zodResolver(messageSchema) });

  useEffect(() => {
    if (!threadId || !conversationQuery.data) return;
    void markThreadRead(threadId)
      .then(() =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ["message-threads"] }),
          queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        ]),
      )
      .catch((error: unknown) => console.error("Couldn’t mark the conversation as read.", error));
  }, [threadId, conversationQuery.data, queryClient]);
  useEffect(() => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, [conversationQuery.data?.messages.length]);

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendThreadMessage(threadId ?? "", body),
    onMutate: async (body) => {
      const key = ["message-thread", threadId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof getThread>>>(key);
      const optimistic: Message = {
        id: `local-${crypto.randomUUID()}`,
        itemId: previous?.thread.itemId ?? "",
        threadId: threadId ?? "",
        senderId: user?.id ?? "",
        recipientId: "",
        body,
        createdAt: new Date().toISOString(),
      };
      if (previous) {
        queryClient.setQueryData(key, {
          ...previous,
          messages: [...previous.messages, optimistic],
          thread: { ...previous.thread, lastMessage: optimistic },
        });
      }
      return { previous };
    },
    onError: (error, _body, context) => {
      if (context?.previous)
        queryClient.setQueryData(["message-thread", threadId], context.previous);
      setFormError(error.message);
    },
    onSuccess: async (message) => {
      setFormError("");
      queryClient.setQueryData(
        ["message-thread", threadId],
        (current: Awaited<ReturnType<typeof getThread>> | undefined) =>
          current
            ? {
                ...current,
                messages: [
                  ...current.messages.filter((entry) => !entry.id.startsWith("local-")),
                  message,
                ],
                thread: { ...current.thread, lastMessage: message },
              }
            : current,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["message-threads"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
  });

  async function submitMessage(values: { body: string }) {
    setFormError("");
    await sendMutation.mutateAsync(values.body);
    reset();
  }

  return (
    <div className="flow-page messages-page">
      <Link className="flow-back-link" to="/account">
        <ArrowLeft size={15} /> Your account
      </Link>
      <header className="flow-page-heading">
        <p className="auth-eyebrow">PRIVATE CONVERSATIONS</p>
        <h1>Messages</h1>
        <p>
          Keep item conversations here. Email addresses and phone numbers are blocked for safety.
        </p>
      </header>
      {threadsQuery.isLoading ? (
        <p className="account-loading">Loading conversations…</p>
      ) : threadsQuery.isError ? (
        <ErrorState onRetry={() => void threadsQuery.refetch()} />
      ) : !threadId ? (
        <ThreadList threads={threadsQuery.data ?? []} />
      ) : conversationQuery.isLoading ? (
        <p className="account-loading">Opening conversation…</p>
      ) : conversationQuery.isError || !conversationQuery.data ? (
        <ErrorState onRetry={() => void conversationQuery.refetch()} />
      ) : (
        <section className="conversation-panel">
          <header className="conversation-heading">
            <div>
              <Link to={`/items/${conversationQuery.data.thread.itemId}`}>
                {conversationQuery.data.thread.itemTitle}
              </Link>
              <p>Conversation with {conversationQuery.data.thread.otherParticipantName}</p>
            </div>
            <Link
              className="flow-inline-link"
              to={`/claims/${conversationQuery.data.thread.claimId}`}
            >
              Claim status <ArrowRight size={14} />
            </Link>
          </header>
          <div className="conversation-messages" aria-live="polite">
            {conversationQuery.data.messages.map((message) => {
              const own = message.senderId === user?.id;
              return (
                <article className={`conversation-message${own ? " is-own" : ""}`} key={message.id}>
                  <p>{message.body}</p>
                  <time dateTime={message.createdAt}>{formatTimestamp(message.createdAt)}</time>
                  {own && (
                    <span
                      className="message-read-state"
                      aria-label={message.readAt ? "Read" : "Sent"}
                    >
                      {message.readAt ? <CheckCheck size={13} /> : <Check size={13} />}
                    </span>
                  )}
                </article>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <form className="conversation-composer" onSubmit={handleSubmit(submitMessage)} noValidate>
            <div className="auth-field">
              <label htmlFor="message-body">Your message</label>
              <Textarea
                id="message-body"
                rows={3}
                maxLength={2000}
                placeholder="Write a helpful, item-related message…"
                error={errors.body?.message}
                {...register("body")}
              />
            </div>
            <p className="conversation-safety">
              <ShieldCheck size={14} /> Don’t share personal contact details. Messages are private
              to this claim.
            </p>
            {formError && (
              <p className="auth-form-error" role="alert">
                {formError}
              </p>
            )}
            <Button type="submit" loading={sendMutation.isPending}>
              <Send size={15} /> Send message
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}

function ThreadList({ threads }: { threads: MessageThread[] }) {
  if (!threads.length) {
    return (
      <EmptyState
        icon={<MessageCircle size={25} />}
        title="No conversations yet"
        description="When you submit a claim, a private conversation with the finder will appear here."
        action={
          <Link className="ui-button ui-button--primary" to="/items">
            Browse items
          </Link>
        }
      />
    );
  }
  return (
    <div className="thread-list">
      {threads.map((thread) => (
        <Link
          className={`thread-card${thread.unreadCount ? " has-unread" : ""}`}
          to={`/messages/${thread.id}`}
          key={thread.id}
        >
          <span className="thread-avatar">
            <MessageCircle size={19} />
          </span>
          <span className="thread-copy">
            <strong>{thread.otherParticipantName}</strong>
            <span>{thread.itemTitle}</span>
            <small>{thread.lastMessage?.body ?? "Conversation started with your claim."}</small>
          </span>
          <span className="thread-meta">
            {thread.lastMessage && (
              <time dateTime={thread.lastMessage.createdAt}>
                {formatTimestamp(thread.lastMessage.createdAt)}
              </time>
            )}
            {thread.unreadCount > 0 && (
              <span className="thread-unread-count">{thread.unreadCount} unread</span>
            )}
          </span>
        </Link>
      ))}
    </div>
  );
}
