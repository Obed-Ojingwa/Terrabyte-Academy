"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ClipboardCheck, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import type { Exam, ExamAttempt, ExamChoice, ExamQuestion, ExamQuestionType, ManagementExam } from "@/types/exam";

type QuestionDraft = {
  question: string;
  type: ExamQuestionType;
  points: string;
  choices: ExamChoice[];
  singleCorrect: string;
  multipleCorrect: string[];
  textCorrect: string;
};

const emptyQuestion = (): QuestionDraft => ({
  question: "",
  type: "single_choice",
  points: "1",
  choices: [
    { id: "option-1", text: "" },
    { id: "option-2", text: "" },
  ],
  singleCorrect: "option-1",
  multipleCorrect: [],
  textCorrect: "",
});

const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300";

function localDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export default function TutorExamsPage() {
  const queryClient = useQueryClient();
  const [courseId, setCourseId] = useState("");
  const [examId, setExamId] = useState("");
  const [examDraft, setExamDraft] = useState({
    title: "",
    duration_min: "60",
    pass_score: "70",
    max_attempts: "1",
    available_from: "",
    available_until: "",
  });
  const [newExamDraft, setNewExamDraft] = useState({
    title: "",
    duration_min: "60",
    pass_score: "70",
    max_attempts: "1",
    available_from: "",
    available_until: "",
  });
  const [questionDraft, setQuestionDraft] = useState<QuestionDraft>(emptyQuestion);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, Record<string, string>>>({});
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});

  const { data: coursesData = [], isLoading: loadingCourses } = useQuery({
    queryKey: ["tutor-exam-courses"],
    queryFn: async () => (await api.get("/courses/me")).data,
  });
  const courses = useMemo(() => coursesData ?? [], [coursesData]);

  useEffect(() => {
    if (!courseId && courses.length) setCourseId(courses[0].id);
  }, [courseId, courses]);

  const { data: examsData = [], isLoading: loadingExams } = useQuery({
    queryKey: ["tutor-exams", courseId],
    queryFn: async () => (await api.get("/exams", { params: { course_id: courseId } })).data as Exam[],
    enabled: !!courseId,
  });
  const exams = useMemo(() => examsData ?? [], [examsData]);

  useEffect(() => {
    if (!examId && exams.length) setExamId(exams[0].id);
    if (examId && !exams.some((exam: Exam) => exam.id === examId)) setExamId("");
  }, [examId, exams]);

  const { data: selectedExam, isLoading: loadingSelectedExam } = useQuery({
    queryKey: ["tutor-exam-management", examId],
    queryFn: async () => (await api.get(`/exams/${examId}/management`)).data as ManagementExam,
    enabled: !!examId,
  });

  useEffect(() => {
    if (!selectedExam) return;
    setExamDraft({
      title: selectedExam.title,
      duration_min: String(selectedExam.duration_min),
      pass_score: String(selectedExam.pass_score),
      max_attempts: String(selectedExam.max_attempts ?? 1),
      available_from: localDateTime(selectedExam.available_from),
      available_until: localDateTime(selectedExam.available_until),
    });
  }, [selectedExam]);

  const refreshExam = () => queryClient.invalidateQueries({ queryKey: ["tutor-exam-management", examId] });
  const createExamMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post("/exams", payload)).data as Exam,
    onSuccess: async (exam) => {
      toast.success("Exam created");
      await queryClient.invalidateQueries({ queryKey: ["tutor-exams", courseId] });
      setExamId(exam.id);
      setNewExamDraft({ title: "", duration_min: "60", pass_score: "70", max_attempts: "1", available_from: "", available_until: "" });
    },
    onError: () => toast.error("Unable to create exam"),
  });
  const updateExamMutation = useMutation({
    mutationFn: async () => api.put(`/exams/${examId}`, {
      title: examDraft.title.trim(),
      duration_min: Number(examDraft.duration_min),
      pass_score: Number(examDraft.pass_score),
      max_attempts: Number(examDraft.max_attempts),
      available_from: toIso(examDraft.available_from),
      available_until: toIso(examDraft.available_until),
    }),
    onSuccess: () => {
      toast.success("Exam settings saved");
      refreshExam();
      queryClient.invalidateQueries({ queryKey: ["tutor-exams", courseId] });
    },
    onError: () => toast.error("Unable to save exam settings"),
  });

  function prepareQuestionPayload() {
    const common = {
      question: questionDraft.question.trim(),
      type: questionDraft.type,
      points: Number(questionDraft.points),
    };
    if (questionDraft.type === "single_choice") {
      return { ...common, options: { choices: questionDraft.choices }, correct: questionDraft.singleCorrect };
    }
    if (questionDraft.type === "multiple_choice") {
      return { ...common, options: { choices: questionDraft.choices }, correct: questionDraft.multipleCorrect };
    }
    if (questionDraft.type === "true_false") {
      return { ...common, options: null, correct: questionDraft.textCorrect };
    }
    if (questionDraft.type === "short_answer") {
      return { ...common, options: null, correct: questionDraft.textCorrect.trim() };
    }
    return { ...common, options: null, correct: null };
  }

  const saveQuestionMutation = useMutation({
    mutationFn: async () => {
      const payload = prepareQuestionPayload();
      if (editingQuestionId) return api.put(`/exams/${examId}/questions/${editingQuestionId}`, payload);
      return api.post(`/exams/${examId}/questions`, payload);
    },
    onSuccess: () => {
      toast.success(editingQuestionId ? "Question updated" : "Question added");
      setQuestionDraft(emptyQuestion());
      setEditingQuestionId(null);
      refreshExam();
    },
    onError: () => toast.error("Check the question fields and try again"),
  });
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => api.delete(`/exams/${examId}/questions/${questionId}`),
    onSuccess: () => {
      toast.success("Question removed");
      refreshExam();
    },
    onError: () => toast.error("Unable to remove question"),
  });
  const reorderMutation = useMutation({
    mutationFn: async (questions: ExamQuestion[]) => api.put(`/exams/${examId}/questions/reorder`, {
      question_ids: questions.map((question) => question.id),
    }),
    onSuccess: refreshExam,
    onError: () => toast.error("Unable to reorder questions"),
  });
  const gradeMutation = useMutation({
    mutationFn: async ({ attemptId, grades, feedback }: { attemptId: string; grades: Record<string, number>; feedback: string }) =>
      api.put(`/exams/${examId}/results/${attemptId}/grade`, { grades, feedback: feedback || null }),
    onSuccess: () => {
      toast.success("Attempt graded");
      refreshExam();
    },
    onError: () => toast.error("Unable to save essay grades"),
  });

  const questions = useMemo(
    () => [...(selectedExam?.questions ?? [])].sort((a, b) => a.position - b.position),
    [selectedExam],
  );
  const hasAttempts = Boolean(selectedExam?.results.length);

  function handleCreateExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newExamDraft.available_from && newExamDraft.available_until && new Date(newExamDraft.available_from) >= new Date(newExamDraft.available_until)) {
      toast.error("The exam close time must be after its open time");
      return;
    }
    createExamMutation.mutate({
      course_id: courseId,
      title: newExamDraft.title.trim(),
      duration_min: Number(newExamDraft.duration_min),
      pass_score: Number(newExamDraft.pass_score),
      max_attempts: Number(newExamDraft.max_attempts),
      available_from: toIso(newExamDraft.available_from),
      available_until: toIso(newExamDraft.available_until),
    });
  }

  function handleSaveExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (examDraft.available_from && examDraft.available_until && new Date(examDraft.available_from) >= new Date(examDraft.available_until)) {
      toast.error("The exam close time must be after its open time");
      return;
    }
    updateExamMutation.mutate();
  }

  function editQuestion(question: ExamQuestion) {
    let correctMultiple: string[] = [];
    if (question.type === "multiple_choice" && question.correct) {
      try {
        const parsed = JSON.parse(question.correct);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) correctMultiple = parsed;
      } catch {
        correctMultiple = [];
      }
    }
    setEditingQuestionId(question.id);
    setQuestionDraft({
      question: question.question,
      type: question.type,
      points: String(question.points),
      choices: question.options?.choices?.map((choice) => ({ ...choice })) ?? emptyQuestion().choices,
      singleCorrect: question.type === "single_choice" ? question.correct ?? "" : "",
      multipleCorrect: correctMultiple,
      textCorrect: question.type === "multiple_choice" || question.type === "single_choice" ? "" : question.correct ?? "",
    });
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= questions.length) return;
    const next = [...questions];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    reorderMutation.mutate(next);
  }

  function handleSaveQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((questionDraft.type === "single_choice" || questionDraft.type === "multiple_choice") && questionDraft.choices.some((choice) => !choice.text.trim())) {
      toast.error("Every choice needs text");
      return;
    }
    if (questionDraft.type === "single_choice" && !questionDraft.singleCorrect) {
      toast.error("Choose the correct option");
      return;
    }
    if (questionDraft.type === "multiple_choice" && !questionDraft.multipleCorrect.length) {
      toast.error("Select at least one correct option");
      return;
    }
    saveQuestionMutation.mutate();
  }

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Exam studio</h1>
          <p className="mt-1 text-sm text-slate-600">Build assessments, set availability, and manage question order.</p>
        </div>
        <label className="min-w-56 text-sm font-medium">Course
          <select value={courseId} onChange={(event) => { setCourseId(event.target.value); setExamId(""); }} className={`${inputClass} mt-1`}>
            <option value="">Select a course</option>
            {courses.map((course: { id: string; title: string }) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
        </label>
      </header>

      {!loadingCourses && !courses.length && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">No assigned courses are available.</p>}

      {courseId && (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.5fr)]">
          <section className="space-y-4">
            <form onSubmit={handleCreateExam} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold"><Plus size={17} /> Create exam</h2>
              <div className="space-y-3">
                <label className="block text-sm font-medium">Title<input value={newExamDraft.title} onChange={(event) => setNewExamDraft({ ...newExamDraft, title: event.target.value })} className={`${inputClass} mt-1`} maxLength={255} required /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm font-medium">Minutes<input type="number" min="1" max="1440" value={newExamDraft.duration_min} onChange={(event) => setNewExamDraft({ ...newExamDraft, duration_min: event.target.value })} className={`${inputClass} mt-1`} required /></label>
                  <label className="text-sm font-medium">Pass %<input type="number" min="0" max="100" step="0.1" value={newExamDraft.pass_score} onChange={(event) => setNewExamDraft({ ...newExamDraft, pass_score: event.target.value })} className={`${inputClass} mt-1`} required /></label>
                </div>
                <label className="block text-sm font-medium">Attempts allowed<input type="number" min="1" max="10" value={newExamDraft.max_attempts} onChange={(event) => setNewExamDraft({ ...newExamDraft, max_attempts: event.target.value })} className={`${inputClass} mt-1`} required /></label>
                <label className="block text-sm font-medium">Opens (optional)<input type="datetime-local" value={newExamDraft.available_from} onChange={(event) => setNewExamDraft({ ...newExamDraft, available_from: event.target.value })} className={`${inputClass} mt-1`} /></label>
                <label className="block text-sm font-medium">Closes (optional)<input type="datetime-local" value={newExamDraft.available_until} onChange={(event) => setNewExamDraft({ ...newExamDraft, available_until: event.target.value })} className={`${inputClass} mt-1`} /></label>
                <button className={buttonClass} disabled={createExamMutation.isPending || !newExamDraft.title.trim()}><Plus size={15} /> Create exam</button>
              </div>
            </form>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-base font-bold">Course exams</h2>
              {loadingExams ? <p className="text-sm text-slate-500">Loading exams...</p> : exams.length ? (
                <div className="space-y-2">
                  {exams.map((exam: Exam) => (
                    <button key={exam.id} onClick={() => setExamId(exam.id)} className={`w-full rounded-lg border px-3 py-3 text-left ${exam.id === examId ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:bg-slate-50"}`}>
                      <span className="block font-semibold">{exam.title}</span>
                      <span className="mt-1 block text-xs text-slate-500">{exam.duration_min} min · {exam.max_attempts} attempt(s)</span>
                    </button>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">No exams created yet.</p>}
            </section>
          </section>

          {examId && selectedExam && (
            <div className="space-y-5">
              <form onSubmit={handleSaveExam} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2"><ClipboardCheck size={18} className="text-brand-600" /><h2 className="text-base font-bold">Exam settings</h2></div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="text-sm font-medium sm:col-span-2">Title<input value={examDraft.title} onChange={(event) => setExamDraft({ ...examDraft, title: event.target.value })} className={`${inputClass} mt-1`} required /></label>
                  <label className="text-sm font-medium">Duration (minutes)<input type="number" min="1" max="1440" value={examDraft.duration_min} onChange={(event) => setExamDraft({ ...examDraft, duration_min: event.target.value })} className={`${inputClass} mt-1`} required /></label>
                  <label className="text-sm font-medium">Pass score (%)<input type="number" min="0" max="100" step="0.1" value={examDraft.pass_score} onChange={(event) => setExamDraft({ ...examDraft, pass_score: event.target.value })} className={`${inputClass} mt-1`} required /></label>
                  <label className="text-sm font-medium">Attempts (1–10)<input type="number" min="1" max="10" value={examDraft.max_attempts} onChange={(event) => setExamDraft({ ...examDraft, max_attempts: event.target.value })} className={`${inputClass} mt-1`} required /></label>
                  <label className="text-sm font-medium">Opens (optional)<input type="datetime-local" value={examDraft.available_from} onChange={(event) => setExamDraft({ ...examDraft, available_from: event.target.value })} className={`${inputClass} mt-1`} /></label>
                  <label className="text-sm font-medium">Closes (optional)<input type="datetime-local" value={examDraft.available_until} onChange={(event) => setExamDraft({ ...examDraft, available_until: event.target.value })} className={`${inputClass} mt-1`} /></label>
                </div>
                <button className={`${buttonClass} mt-4`} disabled={updateExamMutation.isPending}><Save size={15} /> Save settings</button>
              </form>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div><h2 className="text-base font-bold">Questions</h2><p className="mt-1 text-xs text-slate-500">{questions.length} question(s), ordered as students will see them.</p></div>
                </div>
                {loadingSelectedExam ? <p className="text-sm text-slate-500">Loading exam...</p> : questions.length ? (
                  <ol className="mb-5 space-y-2">
                    {questions.map((question, index) => (
                      <li key={question.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold">{index + 1}</span>
                        <div className="min-w-0 flex-1"><p className="font-medium">{question.question}</p><p className="mt-1 text-xs text-slate-500">{question.type.replaceAll("_", " ")} · {question.points} point(s)</p></div>
                        <button type="button" title="Move question up" aria-label="Move question up" onClick={() => moveQuestion(index, -1)} disabled={hasAttempts || index === 0 || reorderMutation.isPending} className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"><ArrowUp size={16} /></button>
                        <button type="button" title="Move question down" aria-label="Move question down" onClick={() => moveQuestion(index, 1)} disabled={hasAttempts || index === questions.length - 1 || reorderMutation.isPending} className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"><ArrowDown size={16} /></button>
                        <button type="button" title="Edit question" aria-label="Edit question" onClick={() => editQuestion(question as ExamQuestion)} disabled={hasAttempts} className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"><Pencil size={16} /></button>
                        <button type="button" title="Delete question" aria-label="Delete question" onClick={() => deleteQuestionMutation.mutate(question.id)} disabled={hasAttempts} className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-30"><Trash2 size={16} /></button>
                      </li>
                    ))}
                  </ol>
                ) : <p className="mb-5 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">Add at least one question before students can start this exam.</p>}

                {hasAttempts && <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Question content and scoring policy are locked because an attempt has started. Duplicate the exam to make a revised version.</p>}

                {!hasAttempts && <form onSubmit={handleSaveQuestion} className="border-t border-slate-200 pt-5">
                  <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-bold">{editingQuestionId ? "Edit question" : "Add question"}</h3>{editingQuestionId && <button type="button" onClick={() => { setQuestionDraft(emptyQuestion()); setEditingQuestionId(null); }} className="inline-flex items-center gap-1 text-sm text-slate-600"><X size={15} /> Cancel</button>}</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-medium sm:col-span-2">Question<textarea value={questionDraft.question} onChange={(event) => setQuestionDraft({ ...questionDraft, question: event.target.value })} className={`${inputClass} mt-1`} rows={3} maxLength={10000} required /></label>
                    <label className="text-sm font-medium">Question type<select value={questionDraft.type} onChange={(event) => setQuestionDraft({ ...questionDraft, type: event.target.value as ExamQuestionType })} className={`${inputClass} mt-1`}>
                      <option value="single_choice">Single choice</option><option value="multiple_choice">Multiple choice</option><option value="true_false">True / false</option><option value="short_answer">Short answer</option><option value="essay">Essay (manual grade)</option>
                    </select></label>
                    <label className="text-sm font-medium">Points<input type="number" min="1" max="1000" value={questionDraft.points} onChange={(event) => setQuestionDraft({ ...questionDraft, points: event.target.value })} className={`${inputClass} mt-1`} required /></label>
                  </div>

                  {(questionDraft.type === "single_choice" || questionDraft.type === "multiple_choice") && (
                    <fieldset className="mt-4 space-y-2"><legend className="mb-2 text-sm font-semibold">Choices · {questionDraft.type === "single_choice" ? "select the correct answer" : "select all correct answers"}</legend>
                      {questionDraft.choices.map((choice, index) => (
                        <div key={choice.id} className="flex items-center gap-2">
                          <input type={questionDraft.type === "single_choice" ? "radio" : "checkbox"} name="correct-choice" checked={questionDraft.type === "single_choice" ? questionDraft.singleCorrect === choice.id : questionDraft.multipleCorrect.includes(choice.id)} onChange={(event) => setQuestionDraft({ ...questionDraft, singleCorrect: questionDraft.type === "single_choice" ? choice.id : questionDraft.singleCorrect, multipleCorrect: questionDraft.type === "multiple_choice" ? event.target.checked ? [...questionDraft.multipleCorrect, choice.id] : questionDraft.multipleCorrect.filter((id) => id !== choice.id) : questionDraft.multipleCorrect })} aria-label={`Mark choice ${index + 1} correct`} />
                          <input value={choice.text} onChange={(event) => setQuestionDraft({ ...questionDraft, choices: questionDraft.choices.map((item) => item.id === choice.id ? { ...item, text: event.target.value } : item) })} className={inputClass} placeholder={`Choice ${index + 1}`} maxLength={500} required />
                          <button type="button" onClick={() => setQuestionDraft({ ...questionDraft, choices: questionDraft.choices.filter((item) => item.id !== choice.id), multipleCorrect: questionDraft.multipleCorrect.filter((id) => id !== choice.id), singleCorrect: questionDraft.singleCorrect === choice.id ? "" : questionDraft.singleCorrect })} disabled={questionDraft.choices.length <= 2} aria-label={`Remove choice ${index + 1}`} className="rounded p-2 text-red-600 hover:bg-red-50 disabled:opacity-30"><X size={16} /></button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setQuestionDraft({ ...questionDraft, choices: [...questionDraft.choices, { id: `option-${Date.now()}`, text: "" }] })} className="text-sm font-semibold text-brand-700">+ Add choice</button>
                    </fieldset>
                  )}
                  {questionDraft.type === "true_false" && <label className="mt-4 block text-sm font-medium">Correct answer<select value={questionDraft.textCorrect} onChange={(event) => setQuestionDraft({ ...questionDraft, textCorrect: event.target.value })} className={`${inputClass} mt-1`} required><option value="">Choose answer</option><option value="true">True</option><option value="false">False</option></select></label>}
                  {questionDraft.type === "short_answer" && <label className="mt-4 block text-sm font-medium">Accepted answer<input value={questionDraft.textCorrect} onChange={(event) => setQuestionDraft({ ...questionDraft, textCorrect: event.target.value })} className={`${inputClass} mt-1`} maxLength={10000} required /></label>}
                  {questionDraft.type === "essay" && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Essay responses are held for tutor grading. All essay questions must be graded before a final result is released.</p>}
                  <button className={`${buttonClass} mt-4`} disabled={saveQuestionMutation.isPending}><Save size={15} /> {editingQuestionId ? "Save question" : "Add question"}</button>
                </form>}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold">Essay review</h2>
                <p className="mt-1 text-sm text-slate-600">Grade every essay question in an attempt to release its final score.</p>
                {selectedExam.results.filter((attempt: ExamAttempt) => attempt.status === "pending_review").length ? (
                  <div className="mt-4 space-y-4">
                    {selectedExam.results.filter((attempt: ExamAttempt) => attempt.status === "pending_review").map((attempt: ExamAttempt) => {
                      const essayQuestions = questions.filter((question) => question.type === "essay");
                      return (
                        <form key={attempt.id} onSubmit={(event) => {
                          event.preventDefault();
                          const draft = gradeDrafts[attempt.id] ?? {};
                          if (essayQuestions.some((question) => draft[question.id] === undefined || draft[question.id] === "")) {
                            toast.error("Enter a score for each essay question");
                            return;
                          }
                          gradeMutation.mutate({
                            attemptId: attempt.id,
                            grades: Object.fromEntries(essayQuestions.map((question) => [question.id, Number(draft[question.id])])),
                            feedback: feedbackDrafts[attempt.id] ?? "",
                          });
                        }} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <h3 className="font-semibold">Attempt {attempt.attempt_number}</h3>
                          <div className="mt-3 space-y-3">
                            {essayQuestions.map((question) => (
                              <div key={question.id} className="rounded-lg border border-slate-200 bg-white p-3">
                                <p className="text-sm font-medium">{question.question}</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{attempt.answers?.[question.id] || "No response"}</p>
                                <label className="mt-3 block text-sm font-medium">Score (0–{question.points})<input type="number" min="0" max={question.points} step="0.1" value={gradeDrafts[attempt.id]?.[question.id] ?? ""} onChange={(event) => setGradeDrafts((previous) => ({ ...previous, [attempt.id]: { ...(previous[attempt.id] ?? {}), [question.id]: event.target.value } }))} className={`${inputClass} mt-1 max-w-48`} required /></label>
                              </div>
                            ))}
                            <label className="block text-sm font-medium">Feedback<textarea value={feedbackDrafts[attempt.id] ?? ""} onChange={(event) => setFeedbackDrafts((previous) => ({ ...previous, [attempt.id]: event.target.value }))} className={`${inputClass} mt-1`} maxLength={10000} rows={3} /></label>
                            <button className={buttonClass} disabled={gradeMutation.isPending}><Save size={15} /> Finalize grade</button>
                          </div>
                        </form>
                      );
                    })}
                  </div>
                ) : <p className="mt-3 text-sm text-slate-500">No essay attempts are waiting for review.</p>}
              </section>
            </div>
          )}
          {examId && loadingSelectedExam && <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading exam workspace...</p>}
          {!examId && exams.length > 0 && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">Choose an exam to edit its settings and questions.</p>}
        </div>
      )}
    </div>
  );
}
