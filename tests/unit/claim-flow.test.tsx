import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthContextValue } from "@/app/auth-context";
import { getItem, getItems } from "@/features/items/items.api";
import { submitClaim } from "@/features/claims/claims.api";
import { ItemDetailPage } from "@/pages/ItemDetailPage";
import type { Item } from "@/types";

vi.mock("@/features/items/items.api", () => ({
  getItem: vi.fn(),
  getItems: vi.fn(),
  reportItem: vi.fn(),
}));
vi.mock("@/features/claims/claims.api", () => ({ submitClaim: vi.fn() }));

const item: Item = {
  id: "item-canvas-tote",
  title: "Canvas tote with a little red book",
  category: "Bags",
  status: "found",
  location: "Northside Library",
  date: "2025-01-15",
  description: "Natural canvas tote with a red paperback inside.",
  image: "/item.jpg",
  reporter: "Mara",
};

const guestAuth: AuthContextValue = {
  user: null,
  isLoading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
};

describe("claim flow", () => {
  beforeEach(() => {
    vi.mocked(getItem).mockResolvedValue(item);
    vi.mocked(getItems).mockResolvedValue([item]);
    vi.mocked(submitClaim).mockResolvedValue({
      message: "Your claim has been sent.",
      claimId: "claim-123",
      threadId: "thread-123",
    });
  });

  it("submits private ownership proof and confirms the claim", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={guestAuth}>
          <MemoryRouter
            initialEntries={["/items/item-canvas-tote"]}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route path="/items/:id" element={<ItemDetailPage />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );

    await screen.findByRole("heading", { name: item.title });
    await user.click(screen.getByRole("button", { name: /This is mine/ }));
    const dialog = await screen.findByRole("dialog", { name: "Claim this item" });
    await user.type(within(dialog).getByLabelText("Your name"), "Alex Morgan");
    await user.type(within(dialog).getByLabelText("Email address"), "alex@example.com");
    await user.type(
      within(dialog).getByLabelText(/Describe unique marks/),
      "Small scratch near the left hinge",
    );
    fireEvent.change(within(dialog).getByLabelText("When did you lose it?"), {
      target: { value: "2025-01-15" },
    });
    await user.type(within(dialog).getByLabelText("Where did you lose it?"), "Pine Street Café");
    await user.click(within(dialog).getByRole("checkbox"));
    await user.click(within(dialog).getByRole("button", { name: /Submit claim for review/ }));

    await waitFor(() => {
      expect(submitClaim).toHaveBeenCalledWith(
        item.id,
        expect.objectContaining({
          email: "alex@example.com",
          uniqueMarks: "Small scratch near the left hinge",
          consent: true,
        }),
      );
    });
    expect(await screen.findByText("Claim sent for review.")).toBeInTheDocument();
  });
});
