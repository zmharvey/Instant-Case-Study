"use client";

import { useCallback, useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import GenerateForm from "@/components/GenerateForm";
import JobList from "@/components/JobList";
import { listJobs, getJob, deleteJob, createJob, type Job } from "@/lib/api";

const PAGE_SIZE = 10;

export default function DashboardPage() {
  const { user } = useUser();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await listJobs(p * PAGE_SIZE, PAGE_SIZE + 1);
      setHasMore(data.length > PAGE_SIZE);
      setJobs(data.slice(0, PAGE_SIZE));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(page);
  }, [page, loadPage]);

  // Poll only the in-flight jobs on the current page
  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === "pending" || j.status === "running");
    if (!hasActive) return;

    const id = setInterval(async () => {
      const updated = await Promise.all(
        jobs.map((j) =>
          j.status === "pending" || j.status === "running"
            ? getJob(j.id).catch(() => j)
            : Promise.resolve(j)
        )
      );
      setJobs(updated);
    }, 3000);

    return () => clearInterval(id);
  }, [jobs]);

  function handleJobCreated(job: Job) {
    if (page === 0) {
      setJobs((prev) => [job, ...prev.slice(0, PAGE_SIZE - 1)]);
    } else {
      setPage(0);
    }
  }

  async function handleDelete(jobId: string) {
    await deleteJob(jobId);
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }

  async function handleRetry(job: Job) {
    const displayName = user?.fullName ?? user?.username ?? undefined;
    const newJob = await createJob(job.repo_url, {
      displayName,
      companyName: job.company_name ?? undefined,
      targetAudience: job.target_audience ?? undefined,
      tone: job.tone ?? undefined,
      positioningBlurb: job.positioning_blurb ?? undefined,
    });
    handleJobCreated(newJob);
  }

  function handlePageChange(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 rounded-sm bg-indigo-500" />
          <span className="text-white font-semibold text-lg">Instant Case Study</span>
        </div>
        <UserButton afterSignOutUrl="/sign-in" />
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
        <section>
          <h2 className="text-white text-xl font-semibold mb-1">New Case Study</h2>
          <p className="text-slate-400 text-sm mb-4">
            Paste a public GitHub repository URL. We'll generate a case study PDF and a LinkedIn post PDF in about 15–30 seconds.
          </p>
          <GenerateForm onJobCreated={handleJobCreated} />
        </section>

        <section>
          <h2 className="text-white text-xl font-semibold mb-4">History</h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <svg className="w-6 h-6 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : (
            <JobList
              jobs={jobs}
              onDelete={handleDelete}
              onRetry={handleRetry}
              page={page}
              hasMore={hasMore}
              onPageChange={handlePageChange}
            />
          )}
        </section>
      </main>
    </div>
  );
}
