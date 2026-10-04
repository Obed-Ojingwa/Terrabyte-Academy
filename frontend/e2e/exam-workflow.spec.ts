import { expect, test, type Page } from "@playwright/test";

const tutor = { email: "tutor@example.test", password: "e2e-password", firstName: "Test" };
const student = { email: "student@example.test", password: "e2e-password", firstName: "Test" };

test("tutor authors, student submits, tutor grades, student sees final result", async ({ page }) => {
  test.setTimeout(120_000);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await login(page, tutor.email, tutor.password, "tutor");
  await page.getByRole("link", { name: "Exams" }).click();
  await expect(page.getByRole("heading", { name: "Exam studio" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Exam E2E Course" })).toHaveCount(1);
  await expect(page.getByLabel("Course")).toHaveValue("33333333-3333-4333-8333-333333333333");

  await page.getByLabel("Title").first().fill(`E2E Exam ${Date.now()}`);
  await page.getByRole("button", { name: "Create exam" }).click();
  await expect(page.getByRole("heading", { name: "Questions" })).toBeVisible();

  await page.getByLabel("Question", { exact: true }).fill("Select the correct answer");
  await page.getByPlaceholder("Choice 1").fill("Correct option");
  await page.getByPlaceholder("Choice 2").fill("Incorrect option");
  await page.getByRole("button", { name: "Add question" }).click();
  await expect(page.getByText("Select the correct answer", { exact: true })).toBeVisible();

  await page.getByLabel("Question", { exact: true }).fill("Explain your reasoning");
  await page.getByLabel("Question type").selectOption("essay");
  await page.getByLabel("Points", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Add question" }).click();
  await expect(page.getByText("Explain your reasoning")).toBeVisible();

  await login(page, student.email, student.password, "student");
  await page.locator('a[href="/dashboard/student/exams"]').last().click();
  await expect(page).toHaveURL(/dashboard\/student\/exams/);
  await expect(page.getByRole("heading", { name: /E2E Exam/ })).toBeVisible();
  await page.getByRole("button", { name: "Start exam" }).click();
  await expect(page.getByText("Select the correct answer")).toBeVisible();
  await page.getByRole("group", { name: /Question 1/ }).getByRole("radio").first().check();
  await page.getByPlaceholder("Write your response").fill("A reasoned response");
  await page.getByRole("button", { name: "Submit attempt" }).click();
  await expect(page.getByText("awaiting tutor review")).toBeVisible();

  await login(page, tutor.email, tutor.password, "tutor");
  await page.locator('a[href="/dashboard/tutor/exams"]').last().click();
  await expect(page).toHaveURL(/dashboard\/tutor\/exams/);
  await expect(page.getByText("A reasoned response")).toBeVisible();
  await page.getByLabel("Score (0–2)").fill("2");
  await page.getByLabel("Feedback").fill("Good reasoning");
  await page.getByRole("button", { name: "Finalize grade" }).click();
  await expect(page.getByText("No essay attempts are waiting for review.")).toBeVisible();

  await login(page, student.email, student.password, "student");
  await page.locator('a[href="/dashboard/student/exams"]').last().click();
  await expect(page).toHaveURL(/dashboard\/student\/exams/);
  await expect(page.getByText("Attempt 1: Passed")).toBeVisible();
  await expect(page.getByText("Score: 3 points")).toBeVisible();
  await expect(page.getByText("Good reasoning")).toBeVisible();
  expect(pageErrors).toEqual([]);
});

async function login(page: Page, email: string, password: string, role: "tutor" | "student") {
  await page.goto("/auth/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /Sign In/ }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/${role}`));
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}
