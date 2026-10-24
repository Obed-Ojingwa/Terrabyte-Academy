import { expect, test, type Page } from "@playwright/test";

test("student can request a certificate before course completion and admin issues it", async ({ page, browser }) => {
  await login(page, "student@example.test", "student");
  await expect(page.getByText("25%", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Request certificate" })).toBeVisible();
  await page.getByRole("link", { name: "Certificates" }).click();
  await expect(page.getByRole("heading", { name: "Request a certificate" })).toBeVisible();
  await expect(page.getByText("Progress: 25%")).toBeVisible();
  await expect(page.getByRole("button", { name: "Request certificate" })).toBeVisible();

  await page.getByRole("button", { name: "Request certificate" }).click();
  await expect(page.getByText(/Certificate TBA-E2E123456 · pending/)).toBeVisible();

  const adminPage = await browser.newPage();
  try {
    await login(adminPage, "admin@example.test", "admin");
    await adminPage.getByRole("link", { name: "Certificates" }).click();
    await expect(adminPage.getByRole("heading", { name: "Certificate approvals" })).toBeVisible();
    await expect(adminPage.getByText("TBA-E2E123456")).toBeVisible();
    await adminPage.getByRole("button", { name: "Issue" }).click();
    await expect(adminPage.getByText("issued", { exact: true })).toBeVisible();
  } finally {
    await adminPage.close();
  }

  const issuedStudentPage = await browser.newPage();
  try {
    await login(issuedStudentPage, "student@example.test", "student");
    await issuedStudentPage.getByRole("link", { name: "Certificates" }).click();
    await expect(issuedStudentPage.getByRole("button", { name: "Download PDF" })).toBeVisible();
    const download = issuedStudentPage.waitForEvent("download");
    await issuedStudentPage.getByRole("button", { name: "Download PDF" }).click();
    expect((await download).suggestedFilename()).toBe("TBA-E2E123456.pdf");
  } finally {
    await issuedStudentPage.close();
  }
});

async function login(page: Page, email: string, role: "student" | "admin") {
  await page.goto("/auth/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill("e2e-password");
  const loginResponse = page.waitForResponse((response) =>
    response.url().includes("/auth/login") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Sign In/ }).click();
  const response = await loginResponse;
  expect(response.status()).toBe(200);
  await expect(page).toHaveURL(new RegExp(`/dashboard/${role}`));
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}
