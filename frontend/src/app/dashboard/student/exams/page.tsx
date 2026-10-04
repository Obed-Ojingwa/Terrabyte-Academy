"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Clock3, Play, Send } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import type { Exam, ExamAttempt, StudentExamQuestion } from "@/types/exam";

const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15";

function formatRemaining(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function StudentExamCard({ exam }: { exam: Exam }) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [now, setNow] = useState(Date.now());
  const resultsKey = ["student-exam-results", exam.id];
  const { data: attempts = [], isLoading } = useQuery({
    queryKey: resultsKey,
    queryFn: async () => (await api.get(`/exams/${exam.id}/results`)).data as ExamAttempt[],
  });
  const currentAttempt = attempts.find((attempt) => attempt.status === "in_progress");
  const latestAttempt = attempts[0];

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentAttempt) return;
    setAnswers(currentAttempt.answers ?? {});
  }, [currentAttempt]);

  const startMutation = useMutation({
    mutationFn: async () => (await api.post(`/exams/${exam.id}/attempts`)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: resultsKey });
      toast.success("Attempt started");
    },
    onError: (error: any) => toast.error(error.response?.data?.detail ?? "Unable to start this exam"),
  });
  const submitMutation = useMutation({
    mutationFn: async () => api.post(`/exams/${exam.id}/results`, {
      attempt_id: currentAttempt?.id,
      answers,
    }),
    onSuccess: async () => {
      toast.success("Exam submitted");
      await queryClient.invalidateQueries({ queryKey: resultsKey });
    },
    onError: (error: any) => toast.error(error.response?.data?.detail ?? "Unable to submit this attempt"),
  });

  const opensAt = exam.available_from ? new Date(exam.available_from).getTime() : null;
  const closesAt = exam.available_until ? new Date(exam.available_until).getTime() : null;
  const notOpen = opensAt !== null && now < opensAt;
  const closed = closesAt !== null && now >= closesAt;
  const remainingAttempts = Math.max(0, exam.max_attempts - attempts.length);
  const timeLeft = currentAttempt?.expires_at
    ? new Date(currentAttempt.expires_at).getTime() - now
    : 0;
  const deadlineReached = Boolean(currentAttempt && timeLeft <= 0);

  useEffect(() => {
    if (deadlineReached) {
      queryClient.invalidateQueries({ queryKey: ["student-exam-results", exam.id] });
    }
  }, [deadlineReached, exam.id, queryClient]);

  function setAnswer(questionId: string, value: string) {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
  }

  function renderQuestion(question: StudentExamQuestion) {
    const value = answers[question.id] ?? "";
    if (question.type === "single_choice") {
      return <fieldset className="mt-3 space-y-2"><legend className="sr-only">Choose one answer</legend>{(question.options?.choices ?? []).map((choice) => (
        <label key={choice.id} className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:border-brand-400">
          <input type="radio" name={question.id} value={choice.id} checked={value === choice.id} onChange={() => setAnswer(question.id, choice.id)} className="mt-1" />
          <span>{choice.text}</span>
        </label>
      ))}</fieldset>;
    }
    if (question.type === "multiple_choice") {
      let selected: string[] = [];
      try { selected = value ? JSON.parse(value) : []; } catch { selected = []; }
      return <fieldset className="mt-3 space-y-2"><legend className="sr-only">Choose all that apply</legend>{(question.options?.choices ?? []).map((choice) => (
        <label key={choice.id} className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:border-brand-400">
          <input type="checkbox" checked={selected.includes(choice.id)} onChange={(event) => {
            const next = event.target.checked ? [...selected, choice.id] : selected.filter((id) => id !== choice.id);
            setAnswer(question.id, JSON.stringify(next.sort()));
          }} className="mt-1" />
          <span>{choice.text}</span>
        </label>
      ))}</fieldset>;
    }
    if (question.type === "true_false") {
      return <div className="mt-3 flex gap-4">{["true", "false"].map((option) => (
        <label key={option} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 capitalize">
          <input type="radio" name={question.id} value={option} checked={value === option} onChange={() => setAnswer(question.id, option)} />{option}
        </label>
      ))}</div>;
    }
    return <textarea value={value} onChange={(event) => setAnswer(question.id, event.target.value)} className={`${fieldClass} mt-3`} rows={question.type === "essay" ? 7 : 3} maxLength={10000} placeholder={question.type === "essay" ? "Write your response" : "Your answer"} />;
  }

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 p-5">
        <div><div className="flex items-center gap-2"><Activity size={17} className="text-brand-600" /><h2 className="text-lg font-bold">{exam.title}</h2></div>
          <p className="mt-2 text-sm text-slate-600">{exam.duration_min} minutes · Pass {exam.pass_score}% · {exam.questions.length} question(s)</p>
          <p className="mt-1 text-xs text-slate-500">{exam.available_from ? `Opens ${new Date(exam.available_from).toLocaleString()}` : "Open now"}{exam.available_until ? ` · Closes ${new Date(exam.available_until).toLocaleString()}` : " · No closing date"}</p>
        </div>
        {currentAttempt ? <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-sm font-bold ${timeLeft <= 60_000 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-800"}`} aria-live="polite"><Clock3 size={16} />{formatRemaining(timeLeft)}</div> : (
          <button type="button" onClick={() => startMutation.mutate()} disabled={startMutation.isPending || isLoading || notOpen || closed || remainingAttempts === 0 || !exam.questions.length} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300">
            <Play size={16} />{startMutation.isPending ? "Starting..." : "Start exam"}
          </button>
        )}
      </header>

      {currentAttempt ? (
        <form onSubmit={(event) => { event.preventDefault(); submitMutation.mutate(); }} className="space-y-4 p-5">
          <p className="text-sm text-slate-600">Attempt {currentAttempt.attempt_number} of {exam.max_attempts}. Your answers are not submitted automatically when time expires.</p>
          {exam.questions.map((question, index) => (
            <fieldset key={question.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <legend className="px-1 text-sm font-bold text-slate-900">Question {index + 1} · {question.points} point(s)</legend>
              <p className="whitespace-pre-wrap text-sm text-slate-800">{question.question}</p>
              {renderQuestion(question)}
            </fieldset>
          ))}
          <button type="submit" disabled={submitMutation.isPending || timeLeft <= 0} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"><Send size={15} />{submitMutation.isPending ? "Submitting..." : "Submit attempt"}</button>
          {timeLeft <= 0 && <p className="text-sm font-medium text-red-700">Time is up. The server will reject this attempt if it has expired.</p>}
        </form>
      ) : latestAttempt?.status === "pending_review" ? (
        <div className="p-5 text-sm text-amber-900"><p className="font-semibold">Submitted · awaiting tutor review</p><p className="mt-1">Your final score will appear after the written response is graded.</p></div>
      ) : latestAttempt?.status === "graded" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm"><div><p className="font-semibold text-slate-900">Attempt {latestAttempt.attempt_number}: {latestAttempt.passed ? "Passed" : "Not passed"}</p><p className="mt-1 text-slate-600">Score: {latestAttempt.score ?? 0} points</p>{latestAttempt.feedback && <p className="mt-2 text-slate-700">Tutor feedback: {latestAttempt.feedback}</p>}</div><p className="text-slate-500">{remainingAttempts} attempt(s) remaining</p></div>
      ) : (
        <div className="p-5 text-sm text-slate-600">{isLoading ? "Loading your attempts..." : notOpen ? "This exam is not open yet." : closed ? "The exam window has closed." : !exam.questions.length ? "This exam is not ready yet." : remainingAttempts === 0 ? "No attempts remaining." : `${remainingAttempts} attempt(s) available.`}{latestAttempt?.status === "expired" && <span className="ml-2 font-medium text-red-700">Your previous attempt expired.</span>}</div>
      )}
    </article>
  );
}

export default function StudentExamsPage() {
  const { data: examsData = [], isLoading, isError } = useQuery({
    queryKey: ["student-exams"],
    queryFn: async () => (await api.get("/exams")).data as Exam[],
  });
  const exams = useMemo(() => examsData ?? [], [examsData]);

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <header className="mb-6"><h1 className="text-2xl font-black">Exams</h1><p className="mt-1 text-sm text-slate-600">Your scheduled assessments and attempt history.</p></header>
      <div className="space-y-4">
        {isLoading && <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading exams...</p>}
        {isError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">Exams could not be loaded. Refresh the page to try again.</p>}
        {exams.map((exam) => <StudentExamCard key={exam.id} exam={exam} />)}
        {!isLoading && !isError && !exams.length && <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">No exams are available for your enrolled courses.</p>}
      </div>
    </div>
  );
}
