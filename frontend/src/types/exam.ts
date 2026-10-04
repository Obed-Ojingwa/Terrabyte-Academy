export type ExamQuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "essay";

export interface ExamChoice {
  id: string;
  text: string;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question: string;
  type: ExamQuestionType;
  options: { choices: ExamChoice[] } | null;
  correct?: string | null;
  points: number;
  position: number;
}

export interface StudentExamQuestion extends Omit<ExamQuestion, "correct"> {}

export interface Exam {
  id: string;
  course_id: string;
  title: string;
  duration_min: number;
  pass_score: number;
  available_from: string | null;
  available_until: string | null;
  max_attempts: number;
  created_at: string;
  questions: StudentExamQuestion[];
}

export interface ManagementExam extends Omit<Exam, "questions"> {
  questions: ExamQuestion[];
  results: ExamAttempt[];
}

export type ExamAttemptStatus =
  | "in_progress"
  | "expired"
  | "pending_review"
  | "graded";

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  attempt_number: number;
  started_at: string;
  expires_at: string | null;
  submitted_at: string | null;
  status: ExamAttemptStatus;
  score: number | null;
  auto_score: number | null;
  passed: boolean;
  answers: Record<string, string> | null;
  manual_grades: Record<string, number> | null;
  feedback: string | null;
  taken_at: string;
}

export interface StartedExamAttempt {
  attempt_id: string;
  attempt_number: number;
  started_at: string;
  expires_at: string;
  status: "in_progress";
}
