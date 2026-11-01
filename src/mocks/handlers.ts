import { http, HttpResponse } from "msw";
import { env } from "@/lib/env";
import { seedItems } from "@/mocks/seed";
import type { Claim, Item, Message, NewItem, User } from "@/types";

const items = [...seedItems];
const claims: Claim[] = [];
const messages: Message[] = [];
const reports: Array<{ itemId: string; reason: string; details: string; createdAt: string }> = [];
const privateContacts = new Map<string, { email: string; phone?: string }>();
const currentUser: User = {
  id: "usr-demo",
  name: "Alex Morgan",
  email: "alex@example.com",
  role: "member",
};

export const handlers = [
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
    const item: Item = { ...publicDetails, id: `itm-${crypto.randomUUID()}` };
    privateContacts.set(item.id, { email: contactEmail, phone: contactPhone });
    items.unshift(item);
    return HttpResponse.json(item, { status: 201 });
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
    const claim: Claim = {
      ...payload,
      id: `clm-${crypto.randomUUID()}`,
      itemId: item.id,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    claims.push(claim);

    if (item.status === "found") item.status = "claimed";

    return HttpResponse.json(
      { message: "Your claim has been sent.", claimId: claim.id },
      { status: 201 },
    );
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
      itemId: item.id,
      reason: payload.reason,
      details: payload.details,
      createdAt: new Date().toISOString(),
    });
    return HttpResponse.json({ message: "Thank you. The listing has been flagged for review." });
  }),
  http.get(`${env.apiBaseUrl}/items/:id/messages`, ({ params }) => {
    const itemMessages = messages.filter((message) => message.itemId === params.id);
    return HttpResponse.json(itemMessages);
  }),
  http.post(`${env.apiBaseUrl}/items/:id/messages`, async ({ params, request }) => {
    const item = items.find((entry) => entry.id === params.id);
    if (!item) {
      return HttpResponse.json(
        { message: "This listing is no longer available." },
        { status: 404 },
      );
    }

    const payload = (await request.json()) as Pick<Message, "body" | "recipientId">;
    const message: Message = {
      ...payload,
      id: `msg-${crypto.randomUUID()}`,
      itemId: item.id,
      senderId: currentUser.id,
      createdAt: new Date().toISOString(),
    };
    messages.push(message);
    return HttpResponse.json(message, { status: 201 });
  }),
  http.get(`${env.apiBaseUrl}/users/me`, () => HttpResponse.json(currentUser)),
];
