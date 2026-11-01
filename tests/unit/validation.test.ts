import { describe, expect, it } from "vitest";
import { claimSchema } from "@/features/claims/claim-schema";
import {
  formatReportDate,
  formatReportPhone,
  localDateString,
  reportSchema,
} from "@/features/items/report-schema";

describe("report validation", () => {
  it("rejects incomplete or future-dated listings", () => {
    expect(reportSchema.safeParse({}).success).toBe(false);
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const futureDate = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
    expect(
      reportSchema.safeParse({
        title: "Blue umbrella",
        category: "Other",
        description: "A blue umbrella with a wooden handle.",
        location: "Pine Street Café",
        date: futureDate,
        time: "",
        reporter: "Alex",
        contactEmail: "alex@example.com",
        contactPhone: "",
      }).success,
    ).toBe(false);
  });

  it("accepts a complete listing dated no later than today", () => {
    const result = reportSchema.safeParse({
      title: "  Blue umbrella  ",
      category: "Other",
      description: "A blue umbrella with a wooden handle.",
      location: "Pine Street Café",
      date: localDateString(),
      time: "",
      reporter: "Alex",
      contactEmail: "alex@example.com",
      contactPhone: "",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Blue umbrella");
  });

  it("formats review dates and phone numbers for display", () => {
    expect(formatReportDate("2026-11-01")).toBe("1 Nov 2026");
    expect(formatReportPhone("4155550132")).toBe("(415) 555-0132");
    expect(formatReportPhone("+1 (415) 555-0132")).toBe("+1 (415) 555-0132");
  });
});

describe("claim validation", () => {
  const validClaim = {
    name: "Alex Morgan",
    email: "alex@example.com",
    uniqueMarks: "Small scratch near the left hinge",
    lostDate: "2025-01-15",
    lostLocation: "Pine Street Café",
    photoUrl: "",
    consent: true,
  };

  it("requires ownership details and consent", () => {
    expect(claimSchema.safeParse({ ...validClaim, uniqueMarks: "", consent: false }).success).toBe(
      false,
    );
  });

  it("accepts complete proof with optional photo omitted", () => {
    const { photoUrl, ...claim } = validClaim;
    expect(photoUrl).toBe("");
    expect(claimSchema.safeParse(claim).success).toBe(true);
  });
});
