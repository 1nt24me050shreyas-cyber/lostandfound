import { http, HttpResponse } from "msw";
import { env } from "@/lib/env";
import { seedItems } from "@/mocks/seed";
import type {
  AuthResponse,
  NotificationPreferences,
  SignInCredentials,
  SignUpCredentials,
} from "@/features/auth/auth.types";
import type {
  Claim,
  ClaimStatus,
  HandoverDetails,
  Item,
  ItemStatus,
  Message,
  MessageThread,
  NewItem,
  Notification,
  User,
} from "@/types";

const items = [...seedItems];
const claims: Claim[] = [];
const messages: Message[] = [];
const threads = new Map<
  string,
  { id: string; claimId: string; itemId: string; participantIds: string[] }
>();
const handovers = new Map<string, HandoverDetails>();
const originalClaimItemStatuses = new Map<string, ItemStatus>();
const notifications: Notification[] = [];
const reports: Array<{
  id: string;
  itemId: string;
  reason: string;
  details: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected" | "duplicate";
  reviewReason?: string;
}> = [];
const auditLog: Array<{
  id: string;
  actor: string;
  action: string;
  target: string;
  reason?: string;
  createdAt: string;
}> = [];
const categories = [...new Set(items.map((item) => item.category))];
const privateContacts = new Map<string, { email: string; phone?: string }>();
const demoUser: User = {
  id: "usr-demo",
  name: "Alex Morgan",
  email: "alex@example.com",
  role: "member",
};
const defaultPreferences: NotificationPreferences = {
  emailUpdates: true,
  claimMessages: true,
  communityNews: false,
};
const accounts = new Map<
  string,
  { user: User; password: string; preferences: NotificationPreferences }
>([
  [
    demoUser.email,
    { user: demoUser, password: "password123", preferences: { ...defaultPreferences } },
  ],
  [
    "admin@example.com",
    {
      user: {
        id: "usr-admin",
        name: "Jordan Admin",
        email: "admin@example.com",
        role: "admin",
      },
      password: "admin123",
      preferences: { ...defaultPreferences },
    },
  ],
]);
const accessSessions = new Map<string, string>();
const refreshSessions = new Map<string, string>();

function getAuthorizedUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const userId = token ? accessSessions.get(token) : undefined;
  return [...accounts.values()].find((account) => account.user.id === userId)?.user ?? null;
}

function unauthorized() {
  return HttpResponse.json({ message: "Please sign in to continue." }, { status: 401 });
}

function forbidden() {
  return HttpResponse.json({ message: "Administrator access is required." }, { status: 403 });
}

function getAdminUser(request: Request) {
  const user = getAuthorizedUser(request);
  return user?.role === "admin" ? user : null;
}

function recordAudit(actor: User, action: string, target: string, reason?: string) {
  auditLog.unshift({
    id: `audit-${crypto.randomUUID()}`,
    actor: actor.name,
    action,
    target,
    reason,
    createdAt: new Date().toISOString(),
  });
}

function linkGuestClaimToUser(claim: Claim, user: User) {
  const claimId = claim.id;
  const email = claim.email.toLowerCase();
  if (!claimId || email !== user.email.toLowerCase()) return false;

  const guestId = `guest:${email}`;
  const claimThreads = [...threads.values()].filter((thread) => thread.claimId === claimId);
  const claimThreadIds = new Set(claimThreads.map((thread) => thread.id));
  claim.userId = user.id;
  for (const thread of claimThreads) {
    thread.participantIds = thread.participantIds.map((id) => (id === guestId ? user.id : id));
  }
  for (const message of messages) {
    if (
      message.threadId &&
      claimThreadIds.has(message.threadId) &&
      message.recipientId === guestId
    ) {
      message.recipientId = user.id;
    }
  }
  for (const notification of notifications) {
    const belongsToClaim =
      notification.href === `/claims/${claimId}` ||
      notification.href === `/claims/${claimId}/handover` ||
      [...claimThreadIds].some((threadId) => notification.href === `/messages/${threadId}`);
    if (belongsToClaim && notification.userId === guestId) notification.userId = user.id;
  }
  return true;
}

function createAuthResponse(user: User): AuthResponse {
  const accessToken = `access-${crypto.randomUUID()}`;
  const refreshToken = `refresh-${crypto.randomUUID()}`;
  accessSessions.set(accessToken, user.id);
  refreshSessions.set(refreshToken, user.id);
  return { user, accessToken, refreshToken };
}

function addNotification(userId: string, title: string, body: string, href: string) {
  notifications.unshift({
    id: `ntf-${crypto.randomUUID()}`,
    userId,
    title,
    body,
    href,
    createdAt: new Date().toISOString(),
  });
}

function getThreadForUser(threadId: string, user: User) {
  const thread = threads.get(threadId);
  if (!thread) return null;
  if (thread.participantIds.includes(user.id)) return thread;
  const claim = claims.find((entry) => entry.id === thread.claimId);
  return claim && linkGuestClaimToUser(claim, user) ? thread : null;
}

function getThreadSummary(
  thread: { id: string; claimId: string; itemId: string; participantIds: string[] },
  user: User,
): MessageThread | null {
  const item = items.find((entry) => entry.id === thread.itemId);
  if (!item) return null;
  const otherId = thread.participantIds.find((id) => id !== user.id);
  const otherAccount = [...accounts.values()].find((account) => account.user.id === otherId);
  const threadMessages = messages.filter((message) => message.threadId === thread.id);
  const lastMessage = threadMessages[threadMessages.length - 1];
  return {
    id: thread.id,
    claimId: thread.claimId,
    itemId: item.id,
    itemTitle: item.title,
    otherParticipantName: otherAccount?.user.name ?? item.reporter,
    lastMessage,
    unreadCount: threadMessages.filter(
      (message) => message.recipientId === user.id && !message.readAt,
    ).length,
  };
}

function getClaimDetails(claim: Claim, user: User) {
  const item = items.find((entry) => entry.id === claim.itemId);
  const owner = [...accounts.values()].find((account) => account.user.id === claim.ownerId)?.user;
  const threadId = [...threads.values()].find((thread) => thread.claimId === claim.id)?.id;
  return item
    ? {
        claim: claim.ownerId === user.id ? { ...claim, email: "" } : claim,
        item,
        ownerName: owner?.name ?? item.reporter,
        handover: claim.id ? handovers.get(claim.id) : undefined,
        threadId,
      }
    : null;
}

function containsPersonalContact(body: string) {
  return /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(body) || /(?:\+?\d[\d\s().-]{7,}\d)/.test(body);
}

export const handlers = [
  http.get(`${env.apiBaseUrl}/categories`, () => HttpResponse.json(categories)),
  http.get(`${env.apiBaseUrl}/items`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
    const category = url.searchParams.get("category") ?? "All items";
    const location = url.searchParams.get("location")?.trim().toLowerCase() ?? "";
    const dateFrom = url.searchParams.get("dateFrom") ?? "";
    const dateTo = url.searchParams.get("dateTo") ?? "";
    const status = url.searchParams.get("status") ?? "all";
    const results = items.filter((item) => {
      const searchableText =
        `${item.title} ${item.category} ${item.location} ${item.description}`.toLowerCase();
      return (
        (!query || searchableText.includes(query)) &&
        (category === "All items" || item.category === category) &&
        (!location || item.location.toLowerCase().includes(location)) &&
        (!dateFrom || item.date >= dateFrom) &&
        (!dateTo || item.date <= dateTo) &&
        (status === "all" || item.status === status)
      );
    });

    return HttpResponse.json(results);
  }),
  http.get(`${env.apiBaseUrl}/stats/summary`, () => {
    const now = new Date();
    const returnedThisMonth = items.filter((item) => {
      const date = new Date(`${item.date}T00:00:00`);
      return (
        item.status === "returned" &&
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    }).length;
    const activeListings = items.filter(
      (item) => item.status === "lost" || item.status === "found",
    ).length;
    const neighborsContributing = new Set(items.map((item) => item.reporter.trim().toLowerCase()))
      .size;

    return HttpResponse.json({ returnedThisMonth, activeListings, neighborsContributing });
  }),
  http.get(`${env.apiBaseUrl}/items/:id`, ({ params }) => {
    const item = items.find((entry) => entry.id === params.id);
    return item
      ? HttpResponse.json(item)
      : HttpResponse.json({ message: "We couldn't find that item." }, { status: 404 });
  }),
  http.post(`${env.apiBaseUrl}/items`, async ({ request }) => {
    const payload = (await request.json()) as NewItem;
    const { contactEmail, contactPhone, ...publicDetails } = payload;
    const item: Item = {
      ...publicDetails,
      id: `itm-${crypto.randomUUID()}`,
      reporterId: getAuthorizedUser(request)?.id,
    };
    privateContacts.set(item.id, { email: contactEmail, phone: contactPhone });
    items.unshift(item);
    return HttpResponse.json(item, { status: 201 });
  }),
  http.patch(`${env.apiBaseUrl}/items/:id`, async ({ params, request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return unauthorized();
    const item = items.find((entry) => entry.id === params.id && entry.reporterId === user.id);
    if (!item) {
      return HttpResponse.json({ message: "We couldn't find that report." }, { status: 404 });
    }

    const updates = (await request.json()) as Partial<
      Pick<Item, "title" | "description" | "location" | "status">
    >;
    Object.assign(item, updates);
    return HttpResponse.json(item);
  }),
  http.delete(`${env.apiBaseUrl}/items/:id`, ({ params, request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return unauthorized();
    const itemIndex = items.findIndex(
      (entry) => entry.id === params.id && entry.reporterId === user.id,
    );
    if (itemIndex < 0) {
      return HttpResponse.json({ message: "We couldn't find that report." }, { status: 404 });
    }

    const [item] = items.splice(itemIndex, 1);
    privateContacts.delete(item.id);
    return HttpResponse.json({ message: "Your report has been deleted." });
  }),
  http.post(`${env.apiBaseUrl}/items/:id/claims`, async ({ params, request }) => {
    const item = items.find((entry) => entry.id === params.id);
    if (!item) {
      return HttpResponse.json(
        { message: "This listing is no longer available." },
        { status: 404 },
      );
    }

    const payload = (await request.json()) as Claim;
    if (
      !payload.consent ||
      !payload.uniqueMarks?.trim() ||
      !payload.lostDate?.trim() ||
      !payload.lostLocation?.trim()
    ) {
      return HttpResponse.json(
        { message: "Complete the ownership details and consent before sending your claim." },
        { status: 400 },
      );
    }
    const now = new Date().toISOString();
    const claimId = `clm-${crypto.randomUUID()}`;
    const ownerId = item.reporterId ?? demoUser.id;
    const ownerEmail = [...accounts.values()].find((account) => account.user.id === ownerId)?.user
      .email;
    const user = getAuthorizedUser(request);
    if (user && user.email.toLowerCase() !== payload.email.trim().toLowerCase()) {
      return HttpResponse.json(
        { message: "Use the email address on your signed-in account to submit a claim." },
        { status: 400 },
      );
    }
    const claimantId = user?.id;
    if (
      (claimantId && claimantId === ownerId) ||
      ownerEmail?.toLowerCase() === payload.email.trim().toLowerCase()
    ) {
      return HttpResponse.json(
        { message: "You can’t submit a claim on your own listing." },
        { status: 409 },
      );
    }
    const claim: Claim = {
      ...payload,
      id: claimId,
      itemId: item.id,
      userId: claimantId,
      ownerId,
      status: "submitted",
      createdAt: now,
      statusHistory: [{ status: "submitted", timestamp: now, note: "Claim submitted." }],
    };
    const threadId = `thr-${crypto.randomUUID()}`;
    threads.set(threadId, {
      id: threadId,
      claimId,
      itemId: item.id,
      participantIds: [...new Set([claimantId ?? `guest:${claim.email.toLowerCase()}`, ownerId])],
    });
    claims.push(claim);
    originalClaimItemStatuses.set(claimId, item.status);

    if (item.status === "found") item.status = "claimed";
    if (ownerId !== claimantId) {
      addNotification(
        ownerId,
        "A new claim was submitted",
        `Someone has submitted a claim for ${item.title}.`,
        `/claims/${claimId}`,
      );
    }
    if (claim.userId) {
      addNotification(
        claim.userId,
        "Your claim was submitted",
        `Your claim for ${item.title} is now in the review queue.`,
        `/claims/${claimId}`,
      );
    }

    return HttpResponse.json(
      { message: "Your claim has been sent.", claimId, threadId },
      { status: 201 },
    );
  }),
  http.get(`${env.apiBaseUrl}/claims/:id`, ({ params, request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return unauthorized();
    const claim = claims.find((entry) => entry.id === params.id);
    if (
      !claim ||
      (claim.userId !== user.id &&
        claim.ownerId !== user.id &&
        claim.email.toLowerCase() !== user.email.toLowerCase())
    ) {
      return HttpResponse.json({ message: "We couldn't find that claim." }, { status: 404 });
    }
    linkGuestClaimToUser(claim, user);
    const details = getClaimDetails(claim, user);
    return details
      ? HttpResponse.json(details)
      : HttpResponse.json(
          { message: "The listing for this claim is no longer available." },
          { status: 404 },
        );
  }),
  http.patch(`${env.apiBaseUrl}/claims/:id/status`, async ({ params, request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return unauthorized();
    const claim = claims.find((entry) => entry.id === params.id);
    if (!claim || claim.ownerId !== user.id) {
      return HttpResponse.json({ message: "You can't update this claim." }, { status: 403 });
    }

    const { status } = (await request.json()) as { status: ClaimStatus };
    const allowedTransitions: Partial<Record<ClaimStatus, ClaimStatus[]>> = {
      submitted: ["under_review"],
      under_review: ["approved", "rejected"],
      approved: ["handed_over"],
    };
    if (!allowedTransitions[claim.status ?? "submitted"]?.includes(status)) {
      return HttpResponse.json(
        { message: "That claim status change isn't available." },
        { status: 409 },
      );
    }
    if (status === "handed_over" && (!claim.id || !handovers.has(claim.id))) {
      return HttpResponse.json(
        { message: "Add the pickup details before marking this item as handed over." },
        { status: 409 },
      );
    }

    const timestamp = new Date().toISOString();
    claim.status = status;
    claim.statusHistory = [
      ...(claim.statusHistory ?? []),
      {
        status,
        timestamp,
        note: status === "rejected" ? "The claim was not approved." : undefined,
      },
    ];
    if (status === "rejected" && claim.itemId) {
      const item = items.find((entry) => entry.id === claim.itemId);
      const originalStatus = claim.id ? originalClaimItemStatuses.get(claim.id) : undefined;
      if (item && originalStatus) item.status = originalStatus;
    }

    const item = items.find((entry) => entry.id === claim.itemId);
    const title =
      status === "under_review"
        ? "Your claim is under review"
        : status === "approved"
          ? "Your claim was approved"
          : status === "rejected"
            ? "Claim update"
            : "Handover complete";
    for (const recipientId of new Set([claim.userId, claim.ownerId])) {
      if (recipientId && recipientId !== user.id) {
        addNotification(
          recipientId,
          title,
          item ? `There’s an update about ${item.title}.` : "There’s an update to your claim.",
          `/claims/${claim.id}`,
        );
      }
    }
    const details = getClaimDetails(claim, user);
    return details
      ? HttpResponse.json(details)
      : HttpResponse.json({ message: "Claim not found." }, { status: 404 });
  }),
  http.put(`${env.apiBaseUrl}/claims/:id/handover`, async ({ params, request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return unauthorized();
    const claim = claims.find((entry) => entry.id === params.id);
    if (!claim || claim.ownerId !== user.id) {
      return HttpResponse.json({ message: "You can't view this handover." }, { status: 403 });
    }
    if (claim.status !== "approved") {
      return HttpResponse.json(
        { message: "Handover details are available after approval." },
        { status: 409 },
      );
    }

    const payload = (await request.json()) as HandoverDetails;
    if (!payload.pickupLocation.trim() || !payload.pickupTime.trim()) {
      return HttpResponse.json({ message: "Add a pickup location and time." }, { status: 400 });
    }
    const details: HandoverDetails = { ...payload, updatedAt: new Date().toISOString() };
    handovers.set(claim.id!, details);
    for (const recipientId of new Set([claim.userId, claim.ownerId])) {
      if (recipientId && recipientId !== user.id) {
        addNotification(
          recipientId,
          "Handover details are ready",
          "Pickup arrangements have been added to the claim.",
          `/claims/${claim.id}/handover`,
        );
      }
    }
    return HttpResponse.json(details);
  }),
  http.get(`${env.apiBaseUrl}/admin/overview`, ({ request }) => {
    const admin = getAdminUser(request);
    if (!admin) return getAuthorizedUser(request) ? forbidden() : unauthorized();

    const mappedReports = reports.flatMap((report) => {
      const item = items.find((entry) => entry.id === report.itemId);
      return item ? [{ ...report, item }] : [];
    });
    const mappedClaims = claims.flatMap((claim) => {
      const item = items.find((entry) => entry.id === claim.itemId);
      return item ? [{ claim, item }] : [];
    });
    const counts = items.reduce<Record<string, number>>((result, item) => {
      result[item.status] = (result[item.status] ?? 0) + 1;
      return result;
    }, {});
    return HttpResponse.json({
      overview: {
        counts,
        reportsNeedingReview: reports.filter((report) => report.status === "pending").length,
        claimsNeedingReview: claims.filter(
          (claim) => claim.status === "submitted" || claim.status === "under_review",
        ).length,
        recentActivity: auditLog.slice(0, 8),
      },
      reports: mappedReports,
      claims: mappedClaims,
      users: [...accounts.values()].map((account) => account.user),
      categories: [...categories].sort((left, right) => left.localeCompare(right)),
      audit: auditLog.slice(0, 200),
    });
  }),
  http.patch(`${env.apiBaseUrl}/admin/reports/bulk`, async ({ request }) => {
    const admin = getAdminUser(request);
    if (!admin) return getAuthorizedUser(request) ? forbidden() : unauthorized();
    const payload = (await request.json()) as {
      ids?: string[];
      status?: "approved" | "rejected" | "duplicate";
      reason?: string;
    };
    const ids = [...new Set(payload.ids ?? [])];
    const reason = payload.reason?.trim() ?? "";
    if (
      !ids.length ||
      (payload.status !== "approved" &&
        payload.status !== "rejected" &&
        payload.status !== "duplicate") ||
      !reason
    ) {
      return HttpResponse.json(
        { message: "Select reports, choose an action, and provide a review reason." },
        { status: 400 },
      );
    }

    const updated = reports.filter((report) => ids.includes(report.id));
    if (updated.length !== ids.length) {
      return HttpResponse.json(
        { message: "One or more reports could not be found." },
        { status: 404 },
      );
    }
    if (updated.some((report) => report.status !== "pending")) {
      return HttpResponse.json(
        { message: "Only pending reports can be reviewed." },
        { status: 409 },
      );
    }
    for (const report of updated) {
      report.status = payload.status;
      report.reviewReason = reason;
      const item = items.find((entry) => entry.id === report.itemId);
      recordAudit(admin, `Report ${payload.status}`, item?.title ?? report.itemId, reason);
    }
    return HttpResponse.json(
      updated.flatMap((report) => {
        const item = items.find((entry) => entry.id === report.itemId);
        return item ? [{ ...report, item }] : [];
      }),
    );
  }),
  http.patch(`${env.apiBaseUrl}/admin/claims/:id`, async ({ params, request }) => {
    const admin = getAdminUser(request);
    if (!admin) return getAuthorizedUser(request) ? forbidden() : unauthorized();
    const claim = claims.find((entry) => entry.id === params.id);
    if (!claim || (claim.status !== "submitted" && claim.status !== "under_review")) {
      return HttpResponse.json(
        { message: "This claim is no longer waiting for review." },
        { status: 404 },
      );
    }
    const payload = (await request.json()) as { status?: "approved" | "rejected"; reason?: string };
    const reason = payload.reason?.trim() ?? "";
    if ((payload.status !== "approved" && payload.status !== "rejected") || !reason) {
      return HttpResponse.json(
        { message: "Choose approve or reject and provide a reason." },
        { status: 400 },
      );
    }
    const timestamp = new Date().toISOString();
    claim.status = payload.status;
    claim.statusHistory = [
      ...(claim.statusHistory ?? []),
      { status: payload.status, timestamp, note: reason },
    ];
    if (payload.status === "rejected" && claim.id && claim.itemId) {
      const item = items.find((entry) => entry.id === claim.itemId);
      const originalStatus = originalClaimItemStatuses.get(claim.id);
      if (item && originalStatus) item.status = originalStatus;
    }
    const item = items.find((entry) => entry.id === claim.itemId);
    recordAudit(admin, `Claim ${payload.status}`, item?.title ?? claim.id ?? "Claim", reason);
    if (claim.userId) {
      addNotification(
        claim.userId,
        payload.status === "approved" ? "Your claim was approved" : "Claim update",
        reason,
        `/claims/${claim.id}`,
      );
    }
    return item
      ? HttpResponse.json({ claim, item })
      : HttpResponse.json({ message: "Item not found." }, { status: 404 });
  }),
  http.patch(`${env.apiBaseUrl}/admin/users/:id`, async ({ params, request }) => {
    const admin = getAdminUser(request);
    if (!admin) return getAuthorizedUser(request) ? forbidden() : unauthorized();
    const payload = (await request.json()) as { role?: User["role"] };
    const account = [...accounts.values()].find((entry) => entry.user.id === params.id);
    if (!account || (payload.role !== "admin" && payload.role !== "member")) {
      return HttpResponse.json(
        { message: "That user or role could not be found." },
        { status: 404 },
      );
    }
    if (account.user.id === admin.id && payload.role !== "admin") {
      return HttpResponse.json(
        { message: "You cannot remove your own admin access." },
        { status: 409 },
      );
    }
    account.user.role = payload.role;
    recordAudit(admin, `User role set to ${payload.role}`, account.user.email);
    return HttpResponse.json(account.user);
  }),
  http.post(`${env.apiBaseUrl}/admin/categories`, async ({ request }) => {
    const admin = getAdminUser(request);
    if (!admin) return getAuthorizedUser(request) ? forbidden() : unauthorized();
    const payload = (await request.json()) as { name?: string };
    const name = payload.name?.trim();
    if (!name || name.length > 40) {
      return HttpResponse.json(
        { message: "Category names must be 1–40 characters." },
        { status: 400 },
      );
    }
    if (categories.some((category) => category.toLowerCase() === name.toLowerCase())) {
      return HttpResponse.json({ message: "That category already exists." }, { status: 409 });
    }
    categories.push(name);
    recordAudit(admin, "Category added", name);
    return HttpResponse.json(name, { status: 201 });
  }),
  http.delete(`${env.apiBaseUrl}/admin/categories/:name`, ({ params, request }) => {
    const admin = getAdminUser(request);
    if (!admin) return getAuthorizedUser(request) ? forbidden() : unauthorized();
    const name = String(params.name);
    const index = categories.findIndex((category) => category.toLowerCase() === name.toLowerCase());
    if (index < 0) return HttpResponse.json({ message: "Category not found." }, { status: 404 });
    if (items.some((item) => item.category.toLowerCase() === name.toLowerCase())) {
      return HttpResponse.json(
        { message: "This category is in use by listings and cannot be removed." },
        { status: 409 },
      );
    }
    categories.splice(index, 1);
    recordAudit(admin, "Category removed", name);
    return HttpResponse.json({ message: "Category removed." });
  }),
  http.post(`${env.apiBaseUrl}/items/:id/reports`, async ({ params, request }) => {
    const item = items.find((entry) => entry.id === params.id);
    if (!item) {
      return HttpResponse.json(
        { message: "This listing is no longer available." },
        { status: 404 },
      );
    }

    const payload = (await request.json()) as { reason: string; details: string };
    reports.push({
      id: `rpt-${crypto.randomUUID()}`,
      itemId: item.id,
      reason: payload.reason,
      details: payload.details,
      createdAt: new Date().toISOString(),
      status: "pending",
    });
    return HttpResponse.json({ message: "Thank you. The listing has been flagged for review." });
  }),
  http.get(`${env.apiBaseUrl}/messages/threads`, ({ request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return unauthorized();
    return HttpResponse.json(
      [...threads.values()]
        .filter((thread) => thread.participantIds.includes(user.id))
        .map((thread) => getThreadSummary(thread, user))
        .filter((thread): thread is MessageThread => thread !== null)
        .sort(
          (left, right) =>
            new Date(right.lastMessage?.createdAt ?? 0).getTime() -
            new Date(left.lastMessage?.createdAt ?? 0).getTime(),
        ),
    );
  }),
  http.get(`${env.apiBaseUrl}/messages/threads/:id`, ({ params, request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return unauthorized();
    const thread = getThreadForUser(String(params.id), user);
    if (!thread)
      return HttpResponse.json({ message: "We couldn't find that conversation." }, { status: 404 });

    for (const message of messages) {
      if (message.threadId === thread.id && message.recipientId === user.id && !message.readAt) {
        message.readAt = new Date().toISOString();
      }
    }
    notifications.forEach((notification) => {
      if (notification.userId === user.id && notification.href === `/messages/${thread.id}`) {
        notification.readAt ??= new Date().toISOString();
      }
    });
    const summary = getThreadSummary(thread, user);
    return summary
      ? HttpResponse.json({
          thread: summary,
          messages: messages.filter((message) => message.threadId === thread.id),
        })
      : HttpResponse.json(
          { message: "The listing for this conversation is no longer available." },
          { status: 404 },
        );
  }),
  http.post(`${env.apiBaseUrl}/messages/threads/:id`, async ({ params, request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return unauthorized();
    const thread = getThreadForUser(String(params.id), user);
    if (!thread)
      return HttpResponse.json(
        { message: "You can't send a message in this conversation." },
        { status: 403 },
      );

    const { body } = (await request.json()) as { body?: string };
    const text = body?.trim() ?? "";
    if (!text || text.length > 2000) {
      return HttpResponse.json(
        { message: "Write a message up to 2,000 characters." },
        { status: 400 },
      );
    }
    if (containsPersonalContact(text)) {
      return HttpResponse.json(
        {
          message: "For everyone’s safety, keep email addresses and phone numbers out of messages.",
        },
        { status: 400 },
      );
    }

    const recipientId = thread.participantIds.find((id) => id !== user.id);
    if (!recipientId) {
      return HttpResponse.json(
        { message: "This conversation has no other participant." },
        { status: 409 },
      );
    }
    const message: Message = {
      id: `msg-${crypto.randomUUID()}`,
      itemId: thread.itemId,
      threadId: thread.id,
      senderId: user.id,
      recipientId,
      body: text,
      createdAt: new Date().toISOString(),
    };
    messages.push(message);
    const item = items.find((entry) => entry.id === thread.itemId);
    addNotification(
      recipientId,
      "A neighbor sent you a message",
      item
        ? `There’s a new message about ${item.title}.`
        : "There’s a new message in your conversation.",
      `/messages/${thread.id}`,
    );
    return HttpResponse.json(message, { status: 201 });
  }),
  http.patch(`${env.apiBaseUrl}/messages/threads/:id/read`, ({ params, request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return unauthorized();
    const thread = getThreadForUser(String(params.id), user);
    if (!thread)
      return HttpResponse.json({ message: "You can't access this conversation." }, { status: 403 });
    const now = new Date().toISOString();
    for (const message of messages) {
      if (message.threadId === thread.id && message.recipientId === user.id && !message.readAt) {
        message.readAt = now;
      }
    }
    return HttpResponse.json({ message: "Conversation marked as read." });
  }),
  http.get(`${env.apiBaseUrl}/notifications`, ({ request }) => {
    const user = getAuthorizedUser(request);
    return user
      ? HttpResponse.json(notifications.filter((notification) => notification.userId === user.id))
      : unauthorized();
  }),
  http.patch(`${env.apiBaseUrl}/notifications/:id/read`, ({ params, request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return unauthorized();
    const notification = notifications.find(
      (entry) => entry.id === params.id && entry.userId === user.id,
    );
    if (!notification)
      return HttpResponse.json({ message: "Notification not found." }, { status: 404 });
    notification.readAt ??= new Date().toISOString();
    return HttpResponse.json(notification);
  }),
  http.patch(`${env.apiBaseUrl}/notifications/read-all`, ({ request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return unauthorized();
    const now = new Date().toISOString();
    notifications.forEach((notification) => {
      if (notification.userId === user.id) notification.readAt ??= now;
    });
    return HttpResponse.json({ message: "Notifications marked as read." });
  }),
  http.post(`${env.apiBaseUrl}/auth/sign-in`, async ({ request }) => {
    const credentials = (await request.json()) as SignInCredentials;
    const account = accounts.get(credentials.email.trim().toLowerCase());
    if (!account || account.password !== credentials.password) {
      return HttpResponse.json(
        { message: "That email and password combination doesn't look right." },
        { status: 401 },
      );
    }
    return HttpResponse.json(createAuthResponse(account.user));
  }),
  http.post(`${env.apiBaseUrl}/auth/sign-up`, async ({ request }) => {
    const credentials = (await request.json()) as SignUpCredentials;
    const email = credentials.email.trim().toLowerCase();
    if (accounts.has(email)) {
      return HttpResponse.json(
        { message: "An account with that email already exists. Try signing in instead." },
        { status: 409 },
      );
    }

    const user: User = {
      id: `usr-${crypto.randomUUID()}`,
      name: credentials.name.trim(),
      email,
      role: "member",
    };
    const account = {
      user,
      password: credentials.password,
      preferences: { ...defaultPreferences },
    };
    accounts.set(email, account);
    return HttpResponse.json(createAuthResponse(user), { status: 201 });
  }),
  http.post(`${env.apiBaseUrl}/auth/forgot-password`, () =>
    HttpResponse.json({
      message: "If an account exists for that address, a reset link will be sent.",
    }),
  ),
  http.post(`${env.apiBaseUrl}/auth/refresh`, async ({ request }) => {
    const payload = (await request.json()) as { refreshToken?: string };
    const userId = payload.refreshToken ? refreshSessions.get(payload.refreshToken) : undefined;
    const account = [...accounts.values()].find((entry) => entry.user.id === userId);
    if (!account || !payload.refreshToken) return unauthorized();

    refreshSessions.delete(payload.refreshToken);
    return HttpResponse.json(createAuthResponse(account.user));
  }),
  http.get(`${env.apiBaseUrl}/users/me`, ({ request }) => {
    const user = getAuthorizedUser(request);
    return user ? HttpResponse.json(user) : unauthorized();
  }),
  http.patch(`${env.apiBaseUrl}/users/me`, async ({ request }) => {
    const current = getAuthorizedUser(request);
    if (!current) return unauthorized();
    const updates = (await request.json()) as Pick<User, "name" | "email">;
    const email = updates.email.trim().toLowerCase();
    const oldEmail = current.email;
    if (email !== oldEmail && accounts.has(email)) {
      return HttpResponse.json(
        { message: "An account with that email already exists." },
        { status: 409 },
      );
    }

    const account = accounts.get(oldEmail);
    if (!account) return unauthorized();
    account.user.name = updates.name.trim();
    account.user.email = email;
    if (email !== oldEmail) {
      accounts.delete(oldEmail);
      accounts.set(email, account);
    }
    return HttpResponse.json(account.user);
  }),
  http.delete(`${env.apiBaseUrl}/users/me`, ({ request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return unauthorized();
    accounts.delete(user.email);
    for (const [token, userId] of accessSessions) {
      if (userId === user.id) accessSessions.delete(token);
    }
    for (const [token, userId] of refreshSessions) {
      if (userId === user.id) refreshSessions.delete(token);
    }
    const deletedItemIds = items
      .filter((item) => item.reporterId === user.id)
      .map((item) => item.id);
    for (let index = items.length - 1; index >= 0; index -= 1) {
      if (items[index].reporterId === user.id) items.splice(index, 1);
    }
    for (let index = claims.length - 1; index >= 0; index -= 1) {
      if (claims[index].userId === user.id) claims.splice(index, 1);
    }
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].senderId === user.id || messages[index].recipientId === user.id) {
        messages.splice(index, 1);
      }
    }
    for (const [threadId, thread] of threads) {
      if (thread.participantIds.includes(user.id)) threads.delete(threadId);
    }
    for (let index = notifications.length - 1; index >= 0; index -= 1) {
      if (notifications[index].userId === user.id) notifications.splice(index, 1);
    }
    deletedItemIds.forEach((itemId) => privateContacts.delete(itemId));
    return HttpResponse.json({ message: "Your account has been deleted." });
  }),
  http.get(`${env.apiBaseUrl}/users/me/reports`, ({ request }) => {
    const user = getAuthorizedUser(request);
    return user
      ? HttpResponse.json(items.filter((item) => item.reporterId === user.id))
      : unauthorized();
  }),
  http.get(`${env.apiBaseUrl}/users/me/claims`, ({ request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return unauthorized();
    const userClaims = claims
      .filter((claim) => claim.userId === user.id || claim.email.toLowerCase() === user.email)
      .flatMap((claim) => {
        const item = items.find((entry) => entry.id === claim.itemId);
        return item ? [{ claim, item }] : [];
      });
    return HttpResponse.json(userClaims);
  }),
  http.get(`${env.apiBaseUrl}/users/me/messages`, ({ request }) => {
    const user = getAuthorizedUser(request);
    return user
      ? HttpResponse.json(
          messages.filter(
            (message) => message.senderId === user.id || message.recipientId === user.id,
          ),
        )
      : unauthorized();
  }),
  http.get(`${env.apiBaseUrl}/users/me/account`, ({ request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return unauthorized();
    const account = accounts.get(user.email);
    return account
      ? HttpResponse.json({ profile: account.user, preferences: account.preferences })
      : unauthorized();
  }),
  http.patch(`${env.apiBaseUrl}/users/me/preferences`, async ({ request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return unauthorized();
    const account = accounts.get(user.email);
    if (!account) return unauthorized();
    account.preferences = (await request.json()) as NotificationPreferences;
    return HttpResponse.json(account.preferences);
  }),
];
