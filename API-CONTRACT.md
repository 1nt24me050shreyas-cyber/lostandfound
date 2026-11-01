# API contract

This document describes the current frontend/MSW contract for the backend implementation. The MSW handlers in `src/mocks/handlers.ts` and typed clients under `src/features/` are the source of truth for this demo. All paths are relative to `VITE_API_BASE_URL` (default `/api`); JSON requests use `Content-Type: application/json`.

## Common conventions

- Authenticated requests send `Authorization: Bearer <accessToken>`.
- Success bodies are JSON. Collection endpoints return arrays directly unless noted.
- Errors use `{ "message": "..." }`. The client raises an `ApiError` with the HTTP status and parsed payload.
- The client attempts one refresh and retries eligible requests after a `401` when a refresh token is available. Auth endpoints are not automatically retried.
- `401` means unauthenticated/expired; `403` means authenticated but not permitted. Other endpoint-specific `400`, `404`, `409` responses are described below.
- Timestamps are ISO 8601 strings. Dates for item and claim dates use `YYYY-MM-DD`.
- Public listing payloads must not include private contact information. Claim proof and account information are private.

## Shared response types

The canonical TypeScript declarations are in `src/types/index.ts`.

```ts
type ItemStatus = "lost" | "found" | "claimed" | "returned";
type ClaimStatus = "submitted" | "under_review" | "approved" | "rejected" | "handed_over";
type UserRole = "member" | "admin";

type Item = {
  id: string;
  title: string;
  category: string;
  status: ItemStatus;
  location: string;
  date: string; // YYYY-MM-DD
  time?: string;
  description: string;
  image: string;
  images?: string[];
  reporter: string;
  reporterId?: string;
};

type NewItem = Omit<Item, "id"> & {
  contactEmail: string;
  contactPhone?: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
};

type Claim = {
  id?: string;
  itemId?: string;
  name: string;
  email: string;
  details: string;
  uniqueMarks?: string;
  lostDate?: string;
  lostLocation?: string;
  photoUrl?: string;
  consent?: boolean;
  ownerId?: string;
  userId?: string;
  status?: ClaimStatus;
  createdAt?: string;
  statusHistory?: Array<{ status: ClaimStatus; timestamp: string; note?: string }>;
};

type HandoverDetails = {
  pickupLocation: string;
  pickupTime: string;
  idRequired: boolean;
  updatedAt?: string;
};
```

## Public listings and categories

| Method and path           | Access        | Request                                                                     | Success response                                                                       | Errors/behavior                                                                                          |
| ------------------------- | ------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `GET /categories`         | Public        | —                                                                           | `string[]`                                                                             | —                                                                                                        |
| `GET /items`              | Public        | Optional query: `q`, `category`, `status`, `location`, `dateFrom`, `dateTo` | `Item[]`                                                                               | Filters search title/category/location/description; `status=all` and `category=All items` mean no filter |
| `GET /items/:id`          | Public        | —                                                                           | `Item`                                                                                 | `404` if missing                                                                                         |
| `GET /stats/summary`      | Public        | —                                                                           | `{ returnedThisMonth: number; activeListings: number; neighborsContributing: number }` | —                                                                                                        |
| `POST /items`             | Public        | `NewItem`                                                                   | `Item` (`201`)                                                                         | `contactEmail` and `contactPhone` are stored privately and excluded from the returned listing            |
| `PATCH /items/:id`        | Listing owner | Partial `{ title, description, location, status }`                          | Updated `Item`                                                                         | `401` unauthenticated; `404` if not owned/found                                                          |
| `DELETE /items/:id`       | Listing owner | —                                                                           | `{ message: string }`                                                                  | `401` unauthenticated; `404` if not owned/found                                                          |
| `POST /items/:id/reports` | Public        | `{ reason: string; details: string }`                                       | `{ message: string }`                                                                  | `404` if listing is missing                                                                              |

`GET /items` supports exact query strings as follows: `q` searches lowercased title, category, location, and description; `category` and `status` match exact values; `location` is a case-insensitive substring; date bounds are inclusive.

## Authentication and account

| Method and path               | Access        | Request                                                                     | Success response                                            | Errors/behavior                                                     |
| ----------------------------- | ------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------- |
| `POST /auth/sign-in`          | Public        | `{ email: string; password: string }`                                       | `{ user: User; accessToken: string; refreshToken: string }` | `401` invalid credentials                                           |
| `POST /auth/sign-up`          | Public        | `{ name: string; email: string; password: string }`                         | Same auth response (`201`)                                  | `409` email already exists                                          |
| `POST /auth/forgot-password`  | Public        | `{ email: string }`                                                         | `{ message: string }`                                       | Response intentionally does not disclose whether the account exists |
| `POST /auth/refresh`          | Refresh token | `{ refreshToken: string }`                                                  | `{ user: User; accessToken: string; refreshToken: string }` | `401` invalid token; refresh token is rotated                       |
| `GET /users/me`               | Signed in     | —                                                                           | `User`                                                      | `401` unauthenticated                                               |
| `PATCH /users/me`             | Signed in     | `{ name: string; email: string }`                                           | `User`                                                      | `401` unauthenticated; `409` email already used                     |
| `DELETE /users/me`            | Signed in     | —                                                                           | `{ message: string }`                                       | `401` unauthenticated; removes the user's demo account data         |
| `GET /users/me/account`       | Signed in     | —                                                                           | `{ profile: User; preferences: NotificationPreferences }`   | `401` unauthenticated                                               |
| `PATCH /users/me/preferences` | Signed in     | `{ emailUpdates: boolean; claimMessages: boolean; communityNews: boolean }` | `NotificationPreferences`                                   | `401` unauthenticated                                               |
| `GET /users/me/reports`       | Signed in     | —                                                                           | `Item[]` owned by caller                                    | `401` unauthenticated                                               |
| `GET /users/me/claims`        | Signed in     | —                                                                           | `Array<{ claim: Claim; item: Item }>` for caller            | `401` unauthenticated                                               |
| `GET /users/me/messages`      | Signed in     | —                                                                           | `Message[]` sent or received by caller                      | `401` unauthenticated                                               |

The mock keeps tokens in memory. A production backend should define token lifetime, secure refresh-token storage/rotation, revocation, and password reset delivery before implementation.

## Claims and handover

| Method and path            | Access                                                  | Request                                                                                   | Success response                                                                                 | Errors/behavior                                                                                                |
| -------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `POST /items/:id/claims`   | Public, or signed-in claimant using their account email | `{ name; email; details; uniqueMarks; lostDate; lostLocation; photoUrl?; consent: true }` | `{ message: string; claimId: string; threadId: string }` (`201`)                                 | `400` missing proof/consent or signed-in email mismatch; `404` listing missing; `409` owner claims own listing |
| `GET /claims/:id`          | Claimant or listing owner                               | —                                                                                         | `{ claim: Claim; item: Item; ownerName: string; handover?: HandoverDetails; threadId?: string }` | `401` unauthenticated; `404` inaccessible/missing                                                              |
| `PATCH /claims/:id/status` | Listing owner                                           | `{ status: "under_review" \| "approved" \| "rejected" \| "handed_over" }`                 | Claim details as above                                                                           | `401` unauthenticated; `403` not owner; `409` invalid transition or handover not ready                         |
| `PUT /claims/:id/handover` | Listing owner                                           | `{ pickupLocation: string; pickupTime: string; idRequired: boolean }`                     | `HandoverDetails`                                                                                | `401` unauthenticated; `403` not owner; `409` claim not approved; `400` missing location/time                  |

Admin claim decisions use `PATCH /admin/claims/:id` (see Admin endpoints). A successful claim creates a private conversation. Claim lifecycle is `submitted` → `under_review` → `approved` or `rejected`; approved claims may transition to `handed_over` after handover details are saved. Status history entries contain `status`, `timestamp`, and optional `note`. When a listing owner reads claim details, the mock hides the claimant email from the returned claim.

## Messaging and notifications

| Method and path                    | Access                   | Request            | Success response                                 | Errors/behavior                                                                                                               |
| ---------------------------------- | ------------------------ | ------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `GET /messages/threads`            | Conversation participant | —                  | `MessageThread[]`                                | `401` unauthenticated                                                                                                         |
| `GET /messages/threads/:id`        | Conversation participant | —                  | `{ thread: MessageThread; messages: Message[] }` | `401` unauthenticated; `404` inaccessible/missing; reading marks received messages and related notifications read             |
| `POST /messages/threads/:id`       | Conversation participant | `{ body: string }` | `Message` (`201`)                                | `401` unauthenticated; `403` not participant; `400` blank, over 2,000 characters, email or phone detected; `409` no recipient |
| `PATCH /messages/threads/:id/read` | Conversation participant | —                  | `{ message: string }`                            | `401` unauthenticated; `403` not participant                                                                                  |
| `GET /notifications`               | Signed in                | —                  | `Notification[]`                                 | `401` unauthenticated                                                                                                         |
| `PATCH /notifications/:id/read`    | Notification owner       | —                  | `Notification`                                   | `401` unauthenticated; `404` missing/not owned                                                                                |
| `PATCH /notifications/read-all`    | Signed in                | —                  | `{ message: string }`                            | `401` unauthenticated                                                                                                         |

`Message` includes `id`, `threadId`, `itemId`, `senderId`, `recipientId`, `body`, `createdAt`, and optional `readAt`. `MessageThread` includes `id`, `claimId`, `itemId`, `itemTitle`, `otherParticipantName`, optional `lastMessage`, and `unreadCount`. `Notification` includes `id`, `userId`, `title`, `body`, `href`, `createdAt`, and optional `readAt`. Never expose email addresses or phone numbers in message content; production validation must enforce this server-side.

## Admin endpoints

All `/admin/*` paths require an authenticated user with the `admin` role. Missing authentication returns `401`; a signed-in non-admin receives `403`.

| Method and path                  | Request                                                                              | Success response                                          | Errors/behavior                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /admin/overview`            | —                                                                                    | `{ overview; reports; claims; users; categories; audit }` | Contains counts, pending reports/claims, recent activity, report rows joined with items, claim rows joined with items, users, categories, and up to 200 audit entries |
| `PATCH /admin/reports/bulk`      | `{ ids: string[]; status: "approved" \| "rejected" \| "duplicate"; reason: string }` | Updated `AdminReport[]`                                   | `400` invalid/empty action or missing reason; `404` missing report; `409` any report not pending                                                                      |
| `PATCH /admin/claims/:id`        | `{ status: "approved" \| "rejected"; reason: string }`                               | `{ claim: Claim; item: Item }`                            | `400` missing/invalid decision or reason; `404` missing/not waiting claim                                                                                             |
| `PATCH /admin/users/:id`         | `{ role: "member" \| "admin" }`                                                      | `User`                                                    | `404` missing user/invalid role; `409` admin cannot remove own admin role                                                                                             |
| `POST /admin/categories`         | `{ name: string }`                                                                   | Category string (`201`)                                   | `400` empty or over 40 characters; `409` duplicate                                                                                                                    |
| `DELETE /admin/categories/:name` | —                                                                                    | `{ message: string }`                                     | `404` missing category; `409` category still used by a listing                                                                                                        |

`AdminReport` is `{ id; item: Item; reason; details; createdAt; status; reviewReason? }`, where status is `pending`, `approved`, `rejected`, or `duplicate`. `AuditEntry` is `{ id; actor; action; target; reason?; createdAt }`. Admin claim decisions append a timestamped history note and an audit entry; rejecting a claim restores the listing's pre-claim status.

## Backend implementation notes

- Enforce ownership and role checks in the API, never only in the client.
- Treat listing contact details, claimant proof, account data, and messages as private.
- Validate all request bodies and query parameters; define consistent error payloads and status codes.
- Replace mock-only in-memory tokens, claim linking, email/phone detection, image data URLs, and seed data with production implementations and storage.
- The current mock allows public listing creation, but report edit/delete are owner-only. Confirm whether production listing creation should require an account before implementation.
