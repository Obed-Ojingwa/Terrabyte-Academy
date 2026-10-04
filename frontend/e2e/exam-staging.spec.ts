import { expect, test, type Page } from "@playwright/test";

const tutorEmail = process.env.E2E_TUTOR_EMAIL;
const tutorPassword = process.env.E2E_TUTOR_PASSWORD;
const studentEmail = process.env.E2E_STUDENT_EMAIL;
const studentPassword = process.env.E2E_STUDENT_PASSWORD;
const courseId = process.env.E2E_COURSE_ID;
const stagingUrl = process.env.E2E_STAGING_BASE_URL;
const configured = Boolean(tutorEmail && tutorPassword && studentEmail && studentPassword && courseId && stagingUrl);

test.skip(!configured, "Set staging URL, tutor/student credentials, and an active-enrollment course ID to run against staging.");

async function login(page: Page, email: string, password: string, dashboardRole: "tutor" | "student") {
  await page.goto("/auth/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /Sign In/ }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/${dashboardRole}`));
}

test("staging exam: tutor authors, enrolled student submits, tutor grades essay", async ({ page }) => {
  test.setTimeout(180_000);
  await login(page, tutorEmail!, tutorPassword!, "tutor");
  await page.goto("/dashboard/tutor/exams");
  await expect(page.getByRole("heading", { name: "Exam studio" })).toBeVisible();
  await page.getByLabel("Course").selectOption(courseId!);

  const examTitle = `Staging E2E ${new Date().toISOString()}`;
  await page.getByLabel("Title").first().fill(examTitle);
  await page.getByRole("button", { name: "Create exam" }).click();
  await expect(page.getByRole("heading", { name: "Questions" })).toBeVisible();

  await page.getByLabel("Question", { exact: true }).fill("Select the staging test answer");
  await page.getByPlaceholder("Choice 1").fill("Correct answer");
  await page.getByPlaceholder("Choice 2").fill("Incorrect answer");
  await page.getByRole("button", { name: "Add question" }).click();
  await expect(page.getByText("Select the staging test answer")).toBeVisible();

  await page.getByLabel("Question", { exact: true }).fill("Write a short explanation");
  await page.getByLabel("Question type").selectOption("essay");
  await page.getByLabel("Points", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Add question" }).click();
  await expect(page.getByText("Write a short explanation")).toBeVisible();

  await login(page, studentEmail!, studentPassword!, "student");
  await page.goto("/dashboard/student/exams");
  await expect(page.getByRole("heading", { name: examTitle })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Start exam" }).click();
  await page.getByRole("group", { name: /Question 1/ }).getByRole("radio").first().check();
  await page.getByPlaceholder("Write your response").fill("Staging essay response");
  await page.getByRole("button", { name: "Submit attempt" }).click();
  await expect(page.getByText("awaiting tutor review")).toBeVisible();

  await login(page, tutorEmail!, tutorPassword!, "tutor");
  await page.goto("/dashboard/tutor/exams");
  await expect(page.getByText("Staging essay response")).toBeVisible({ timeout: 20_000 });
  await page.getByLabel("Score (0–2)").fill("2");
  await page.getByLabel("Feedback").fill("Staging E2E grade");
  await page.getByRole("button", { name: "Finalize grade" }).click();
  await expect(page.getByText("No essay attempts are waiting for review.")).toBeVisible();

  await login(page, studentEmail!, studentPassword!, "student");
  await page.goto("/dashboard/student/exams");
  await expect(page.getByText("Attempt 1: Passed")).toBeVisible();
});
