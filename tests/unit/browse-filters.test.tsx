import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowsePage } from "@/pages/BrowsePage";
import type { Item } from "@/types";
import { getCategories } from "@/features/admin/admin.api";
import { getItems } from "@/features/items/items.api";

vi.mock("@/features/admin/admin.api", () => ({ getCategories: vi.fn() }));
vi.mock("@/features/items/items.api", () => ({ getItems: vi.fn() }));

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

function renderBrowse(initialEntry = "/items") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[initialEntry]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <BrowsePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("browse filters", () => {
  beforeEach(() => {
    vi.mocked(getCategories).mockResolvedValue(["Bags", "Keys"]);
    vi.mocked(getItems).mockResolvedValue([item]);
  });

  it("filters listings by status", async () => {
    renderBrowse();
    await screen.findByLabelText("Status");
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "found" } });

    await waitFor(() => {
      expect(getItems).toHaveBeenLastCalledWith(expect.objectContaining({ status: "found" }));
    });
  });

  it("restores URL-backed search filters", async () => {
    renderBrowse("/items?q=canvas&status=found");
    await screen.findByText(item.title);

    expect(screen.getByLabelText("Search listings")).toHaveValue("canvas");
    expect(screen.getByLabelText("Status")).toHaveValue("found");
    expect(getItems).toHaveBeenCalledWith(
      expect.objectContaining({ q: "canvas", status: "found" }),
    );
  });
});
