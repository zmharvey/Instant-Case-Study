-- Run this once in your Supabase SQL editor to set up the jobs table.

CREATE TABLE IF NOT EXISTS jobs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT NOT NULL,
    repo_url    TEXT NOT NULL,
    repo_name   TEXT,
    status      TEXT NOT NULL DEFAULT 'pending',
    error_msg   TEXT,
    cs_pdf_path TEXT,
    li_pdf_path TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status  ON jobs(status);
