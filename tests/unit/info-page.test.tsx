import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { InfoPage } from "@/pages/InfoPage";

describe("how it works page", () => {
  it("renders a number, title, and description for each step", () => {
    render(
      <MemoryRouter initialEntries={["/how-it-works"]}>
        <InfoPage />
      </MemoryRouter>,
    );

    const steps = screen.getAllByRole("article");
    expect(steps).toHaveLength(3);
    expect(within(steps[0]).getByText("01")).toBeInTheDocument();
    expect(within(steps[0]).getByRole("heading", { name: "Search nearby" })).toBeInTheDocument();
    expect(
      within(steps[0]).getByText(
        "Browse recent listings or search by an item, place, or detail you remember.",
      ),
    ).toBeInTheDocument();
  });
});
