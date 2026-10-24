-- Set the exam pass mark to 40 percent for existing and future exams.
-- Run this once in the Supabase SQL Editor instead of applying the matching Alembic migration.
BEGIN;

UPDATE public.exams
SET pass_score = 40
WHERE pass_score IS DISTINCT FROM 40;

ALTER TABLE public.exams
    ALTER COLUMN pass_score SET DEFAULT 40,
    DROP CONSTRAINT IF EXISTS ck_exams_pass_score;

ALTER TABLE public.exams
    ADD CONSTRAINT ck_exams_pass_score CHECK (pass_score = 40);

COMMIT;
