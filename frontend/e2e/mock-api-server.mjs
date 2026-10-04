import { createServer } from "node:http";

const host = "127.0.0.1";
const port = 8000;
const tutor = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "tutor@example.test",
  first_name: "Test",
  last_name: "Tutor",
  is_active: true,
  role: { name: "tutor" },
};
const student = {
  id: "22222222-2222-4222-8222-222222222222",
  email: "student@example.test",
  first_name: "Test",
  last_name: "Student",
  is_active: true,
  role: { name: "student" },
};
const course = {
  id: "33333333-3333-4333-8333-333333333333",
  title: "Exam E2E Course",
  tutor_id: tutor.id,
};
const state = { activeRole: "tutor", exams: [], questions: new Map(), attempts: new Map() };
let nextQuestion = 0;
let nextAttempt = 0;

function send(response, status, payload, origin) {
  response.writeHead(status, {
    "access-control-allow-origin": origin ?? "http://127.0.0.1:3010",
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "authorization,content-type",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "content-type": "application/json; charset=utf-8",
    vary: "Origin",
  });
  response.end(payload === undefined ? "" : JSON.stringify(payload));
}

async function readBody(request) {
  let text = "";
  for await (const chunk of request) text += chunk;
  return text ? JSON.parse(text) : {};
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (request.method === "OPTIONS") return send(response, 204, undefined, origin);
  const url = new URL(request.url ?? "/", `http://${host}:${port}`);
  const path = url.pathname.replace(/^\/api\/v1/, "");
  const body = request.method === "GET" ? {} : await readBody(request).catch(() => ({}));
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  const currentUser = token === "e2e-tutor-token"
    ? tutor
    : token === "e2e-student-token"
      ? student
      : state.activeRole === "tutor" ? tutor : student;
  const respond = (status, payload) => send(response, status, payload, origin);

  if (path === "/health") return respond(200, { status: "ok" });
  if (path === "/auth/login" && request.method === "POST") {
    const user = body.email === tutor.email ? tutor : body.email === student.email ? student : null;
    if (!user) return respond(401, { detail: "Invalid test user" });
    state.activeRole = user.role.name;
    const roleToken = user.role.name === "tutor" ? "e2e-tutor-token" : "e2e-student-token";
    return respond(200, { access_token: roleToken, refresh_token: `refresh-${roleToken}`, token_type: "bearer", user });
  }
  if (path === "/auth/refresh" && request.method === "POST") {
    const roleToken = body.refresh_token === "refresh-e2e-tutor-token" ? "e2e-tutor-token" : "e2e-student-token";
    return respond(200, { access_token: roleToken, refresh_token: `refresh-${roleToken}`, token_type: "bearer" });
  }
  if (!currentUser) return respond(401, { detail: "Authentication required" });
  if (path === "/users/me" && request.method === "GET") return respond(200, currentUser);
  if (path === "/courses/me" && request.method === "GET") return respond(200, currentUser.role.name === "tutor" ? [course] : []);

  if (path === "/exams" && request.method === "GET") {
    const visible = currentUser.role.name === "student"
      ? state.exams.filter((exam) => exam.course_id === course.id)
      : state.exams;
    return respond(200, visible.map((exam) => ({
      ...exam,
      questions: (state.questions.get(exam.id) ?? []).map(({ correct: _correct, ...question }) => question),
    })));
  }

  if (path === "/exams" && request.method === "POST" && currentUser.role.name === "tutor") {
    const exam = {
      id: "44444444-4444-4444-8444-444444444444",
      course_id: body.course_id,
      title: body.title,
      duration_min: body.duration_min,
      pass_score: body.pass_score,
      max_attempts: body.max_attempts,
      available_from: body.available_from,
      available_until: body.available_until,
      created_at: new Date().toISOString(),
    };
    state.exams.unshift(exam);
    state.questions.set(exam.id, []);
    state.attempts.set(exam.id, []);
    return respond(201, exam);
  }

  const managementMatch = path.match(/^\/exams\/([^/]+)\/management$/);
  if (managementMatch && request.method === "GET" && currentUser.role.name === "tutor") {
    const exam = state.exams.find((item) => item.id === managementMatch[1]);
    if (!exam) return respond(404, { detail: "Exam not found" });
    return respond(200, { ...exam, questions: state.questions.get(exam.id) ?? [], results: state.attempts.get(exam.id) ?? [] });
  }

  const questionMatch = path.match(/^\/exams\/([^/]+)\/questions$/);
  if (questionMatch && request.method === "POST" && currentUser.role.name === "tutor") {
    const questions = state.questions.get(questionMatch[1]);
    if (!questions) return respond(404, { detail: "Exam not found" });
    const question = {
      ...body,
      id: `${String(++nextQuestion).padStart(8, "0")}-5555-4555-8555-555555555555`,
      exam_id: questionMatch[1],
      position: questions.length,
    };
    questions.push(question);
    return respond(201, question);
  }

  const startMatch = path.match(/^\/exams\/([^/]+)\/attempts$/);
  if (startMatch && request.method === "POST" && currentUser.role.name === "student") {
    const exam = state.exams.find((item) => item.id === startMatch[1]);
    if (!exam) return respond(404, { detail: "Exam not found" });
    const attempts = state.attempts.get(exam.id);
    let attempt = attempts.find((item) => item.status === "in_progress");
    if (!attempt) {
      const now = new Date();
      attempt = {
        id: `${String(++nextAttempt).padStart(8, "0")}-6666-4666-8666-666666666666`,
        exam_id: exam.id,
        student_id: student.id,
        attempt_number: attempts.length + 1,
        started_at: now.toISOString(),
        expires_at: new Date(now.getTime() + exam.duration_min * 60_000).toISOString(),
        submitted_at: null,
        status: "in_progress",
        score: null,
        auto_score: null,
        passed: false,
        answers: {},
        manual_grades: {},
        feedback: null,
        taken_at: now.toISOString(),
      };
      attempts.push(attempt);
    }
    return respond(200, {
      attempt_id: attempt.id,
      attempt_number: attempt.attempt_number,
      started_at: attempt.started_at,
      expires_at: attempt.expires_at,
      status: "in_progress",
    });
  }

  const resultMatch = path.match(/^\/exams\/([^/]+)\/results$/);
  if (resultMatch && request.method === "GET" && currentUser.role.name === "student") {
    return respond(200, state.attempts.get(resultMatch[1]) ?? []);
  }
  if (resultMatch && request.method === "POST" && currentUser.role.name === "student") {
    const attempts = state.attempts.get(resultMatch[1]) ?? [];
    const attempt = attempts.find((item) => item.id === body.attempt_id && item.student_id === currentUser.id);
    if (!attempt) return respond(404, { detail: "Exam attempt not found" });
    const questions = state.questions.get(resultMatch[1]) ?? [];
    let autoScore = 0;
    for (const question of questions) {
      const answer = body.answers?.[question.id] ?? "";
      if (question.type === "single_choice" && answer === question.correct) autoScore += question.points;
      else if (question.type === "multiple_choice" && JSON.stringify(JSON.parse(answer || "[]").sort()) === question.correct) autoScore += question.points;
      else if (question.type === "true_false" && answer === question.correct) autoScore += question.points;
      else if (question.type === "short_answer" && answer.trim().toLowerCase() === question.correct?.trim().toLowerCase()) autoScore += question.points;
    }
    const hasEssay = questions.some((question) => question.type === "essay");
    Object.assign(attempt, {
      status: hasEssay ? "pending_review" : "graded",
      answers: body.answers,
      auto_score: autoScore,
      score: hasEssay ? null : autoScore,
      passed: !hasEssay && autoScore / questions.reduce((sum, question) => sum + question.points, 0) * 100 >= examScore(resultMatch[1]),
      submitted_at: new Date().toISOString(),
    });
    return respond(201, attempt);
  }

  const gradeMatch = path.match(/^\/exams\/([^/]+)\/results\/([^/]+)\/grade$/);
  if (gradeMatch && request.method === "PUT" && currentUser.role.name === "tutor") {
    const attempt = (state.attempts.get(gradeMatch[1]) ?? []).find((item) => item.id === gradeMatch[2]);
    const questions = state.questions.get(gradeMatch[1]) ?? [];
    if (!attempt) return respond(404, { detail: "Exam attempt not found" });
    const manualScore = questions.filter((question) => question.type === "essay").reduce((sum, question) => sum + Number(body.grades?.[question.id] ?? 0), 0);
    const score = Number(attempt.auto_score ?? 0) + manualScore;
    const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);
    Object.assign(attempt, {
      status: "graded",
      manual_grades: body.grades,
      feedback: body.feedback,
      score,
      passed: score / totalPoints * 100 >= examScore(gradeMatch[1]),
    });
    return respond(200, attempt);
  }

  return respond(404, { detail: `Unexpected test API request: ${request.method} ${path}` });
});

function examScore(examId) {
  return state.exams.find((exam) => exam.id === examId)?.pass_score ?? 70;
}

server.listen(port, host, () => console.log(`Exam E2E mock API listening on http://${host}:${port}`));
