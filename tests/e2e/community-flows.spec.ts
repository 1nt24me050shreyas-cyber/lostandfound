import { expect, test, type Page } from "@playwright/test";

async function openInProjectTheme(page: Page, path: string, theme: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

test("searches and filters the community noticeboard", async ({ page }, testInfo) => {
  await openInProjectTheme(page, "/items", testInfo.project.name);
  await page.getByLabel("Search listings").fill("Canvas tote");
  await expect(
    page.getByRole("heading", { name: "Canvas tote with a little red book" }),
  ).toBeVisible();
  await page.getByLabel("Status", { exact: true }).selectOption("found");
  await expect(
    page.getByRole("heading", { name: "Canvas tote with a little red book" }),
  ).toBeVisible();
  await expect(page.locator(".browse-result-count")).toContainText("1");
});

test("posts a lost-item report", async ({ page }, testInfo) => {
  await openInProjectTheme(page, "/report/lost", testInfo.project.name);
  await page.getByLabel("What is it?").fill(`E2E ${testInfo.project.name} blue umbrella`);
  await page.getByLabel("Category").selectOption("Other");
  await page
    .getByLabel("A few more details")
    .fill("Blue umbrella with a wooden handle and brass tip.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Where was it?").fill("Pine Street Café");
  await page.getByLabel("When did you last see it?").fill(new Date().toISOString().slice(0, 10));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Your first name").fill("Casey");
  await page.getByLabel("Email address").fill(`casey-${testInfo.project.name}@example.com`);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Post lost item" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Your listing is live on the community board.",
  );
  await expect(
    page.getByRole("heading", { name: `E2E ${testInfo.project.name} blue umbrella` }),
  ).toBeVisible();
});

test("submits a claim and has an administrator approve it", async ({ page }, testInfo) => {
  await openInProjectTheme(page, "/items", testInfo.project.name);
  await page
    .getByRole("link", { name: /Canvas tote with a little red book/ })
    .first()
    .click();
  await page.getByRole("button", { name: /This is mine/ }).click();

  const claimDialog = page.getByRole("dialog", { name: "Claim this item" });
  await claimDialog.getByLabel("Your name").fill("Casey Claimant");
  await claimDialog
    .getByLabel("Email address")
    .fill(`claimant-${testInfo.project.name}@example.com`);
  await claimDialog
    .getByLabel(/Describe unique marks/)
    .fill("A small blue flower sticker is under the inside pocket.");
  await claimDialog.getByLabel("When did you lose it?").fill(new Date().toISOString().slice(0, 10));
  await claimDialog.getByLabel("Where did you lose it?").fill("Northside Library");
  await claimDialog.getByRole("checkbox").check();
  await claimDialog.getByRole("button", { name: /Submit claim for review/ }).click();
  await expect(page.getByText("Claim sent for review.")).toBeVisible();

  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill("admin@example.com");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.goto("/admin");
  await page.getByRole("button", { name: "Claims review" }).click();
  await expect(page.getByRole("heading", { name: "Claims requiring review" })).toBeVisible();
  await expect(page.getByText("Casey Claimant")).toBeVisible();
  await page
    .getByLabel("Decision reason")
    .fill("The claimant correctly identified the unique sticker.");
  await page.getByRole("button", { name: "Approve claim" }).click();
  await expect(page.getByText("No claims are waiting for review.")).toBeVisible();
  await page.getByRole("button", { name: "Audit log" }).click();
  await expect(page.getByText("Claim approved")).toBeVisible();
});
