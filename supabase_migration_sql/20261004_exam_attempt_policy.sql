--Exam Attempt Policy Migration
BEGIN;

ALTER TABLE public.exams
    ADD COLUMN available_from TIMESTAMPTZ,
    ADD COLUMN available_until TIMESTAMPTZ,
    ADD COLUMN max_attempts INTEGER NOT NULL DEFAULT 1,
    ADD CONSTRAINT ck_exams_max_attempts CHECK (max_attempts BETWEEN 1 AND 10),
    ADD CONSTRAINT ck_exams_availability_window
        CHECK (available_from IS NULL OR available_until IS NULL OR available_from < available_until);

ALTER TABLE public.exam_results
    ADD COLUMN attempt_number INTEGER,
    ADD COLUMN started_at TIMESTAMPTZ,
    ADD COLUMN expires_at TIMESTAMPTZ,
    ADD COLUMN submitted_at TIMESTAMPTZ,
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'graded',
    ADD COLUMN auto_score NUMERIC(8, 2),
    ADD COLUMN manual_grades JSONB,
    ADD COLUMN feedback TEXT;

ALTER TABLE public.exam_results
    ALTER COLUMN score TYPE NUMERIC(8, 2);

WITH ranked_results AS (
    SELECT result.id,
           ROW_NUMBER() OVER (
               PARTITION BY result.exam_id, result.student_id
               ORDER BY result.taken_at, result.id
           ) AS attempt_number,
           result.taken_at,
           exam.duration_min
    FROM public.exam_results AS result
    JOIN public.exams AS exam ON exam.id = result.exam_id
)
UPDATE public.exam_results AS result
SET attempt_number = ranked_results.attempt_number,
    started_at = (ranked_results.taken_at AT TIME ZONE 'UTC') - (ranked_results.duration_min * INTERVAL '1 minute'),
    expires_at = ranked_results.taken_at AT TIME ZONE 'UTC',
    submitted_at = ranked_results.taken_at AT TIME ZONE 'UTC',
    auto_score = result.score,
    manual_grades = '{}'::jsonb
FROM ranked_results
WHERE result.id = ranked_results.id;

ALTER TABLE public.exam_results
    ALTER COLUMN attempt_number SET DEFAULT 1,
    ALTER COLUMN attempt_number SET NOT NULL,
    ALTER COLUMN started_at SET NOT NULL,
    ADD CONSTRAINT ck_exam_results_attempt_number CHECK (attempt_number >= 1),
    ADD CONSTRAINT ck_exam_results_status
        CHECK (status IN ('in_progress', 'expired', 'pending_review', 'graded'));

CREATE INDEX ix_exam_results_exam_student
    ON public.exam_results (exam_id, student_id);

ALTER TABLE public.exam_results
    ADD CONSTRAINT uq_exam_results_attempt
    UNIQUE (exam_id, student_id, attempt_number);

COMMIT;
