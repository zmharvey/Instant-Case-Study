"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import GenerateForm from "@/components/GenerateForm";
import JobList from "@/components/JobList";
import { listJobs, type Job } from "@/lib/api";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listJobs()
      .then(setJobs)
      .finally(() => setLoading(false));
  }, []);

  function handleJobCreated(job: Job) {
    setJobs((prev) => [job, ...prev]);
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 rounded-sm bg-indigo-500" />
          <span className="text-white font-semibold text-lg">Instant Case Study</span>
        </div>
        <UserButton afterSignOutUrl="/sign-in" />
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Generate form */}
        <section>
          <h2 className="text-white text-xl font-semibold mb-1">New Case Study</h2>
          <p className="text-slate-400 text-sm mb-4">
            Paste a public GitHub repository URL. We'll generate a case study PDF and a LinkedIn post PDF in about 15–30 seconds.
          </p>
          <GenerateForm onJobCreated={handleJobCreated} />
        </section>

        {/* History */}
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
            <JobList initialJobs={jobs} />
          )}
        </section>
      </main>
    </div>
  );
}
