export type JobStatus = "pending" | "running" | "done" | "failed";
export type JobTone = "Professional" | "Conversational" | "Technical";

export interface Job {
  id: string;
  user_id: string;
  repo_url: string;
  repo_name: string | null;
  status: JobStatus;
  error_msg: string | null;
  created_at: string;
  finished_at: string | null;
  company_name: string | null;
  target_audience: string | null;
  tone: JobTone | null;
  positioning_blurb: string | null;
}

export interface CreateJobOptions {
  displayName?: string;
  companyName?: string;
  targetAudience?: string;
  tone?: JobTone;
  positioningBlurb?: string;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`/api/${path}`, init);
  return res;
}

export async function createJob(repoUrl: string, options: CreateJobOptions = {}): Promise<Job> {
  const res = await apiFetch("jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repo_url: repoUrl,
      display_name: options.displayName,
      company_name: options.companyName || null,
      target_audience: options.targetAudience || null,
      tone: options.tone || null,
      positioning_blurb: options.positioningBlurb || null,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Failed to create job");
  }
  return res.json();
}

export async function listJobs(offset = 0, limit = 11): Promise<Job[]> {
  const res = await apiFetch(`jobs?offset=${offset}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export async function deleteJob(jobId: string): Promise<void> {
  const res = await apiFetch(`jobs/${jobId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete job");
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await apiFetch(`jobs/${jobId}`);
  if (!res.ok) throw new Error("Failed to fetch job");
  return res.json();
}

export function downloadUrl(jobId: string, type: "case-study" | "linkedin"): string {
  return `/api/jobs/${jobId}/download/${type}`;
}
