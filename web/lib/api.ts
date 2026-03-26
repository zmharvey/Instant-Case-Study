export type JobStatus = "pending" | "running" | "done" | "failed";

export interface Job {
  id: string;
  user_id: string;
  repo_url: string;
  repo_name: string | null;
  status: JobStatus;
  error_msg: string | null;
  created_at: string;
  finished_at: string | null;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`/api/${path}`, init);
  return res;
}

export async function createJob(repoUrl: string): Promise<Job> {
  const res = await apiFetch("jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_url: repoUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Failed to create job");
  }
  return res.json();
}

export async function listJobs(): Promise<Job[]> {
  const res = await apiFetch("jobs");
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await apiFetch(`jobs/${jobId}`);
  if (!res.ok) throw new Error("Failed to fetch job");
  return res.json();
}

export function downloadUrl(jobId: string, type: "case-study" | "linkedin"): string {
  return `/api/jobs/${jobId}/download/${type}`;
}
