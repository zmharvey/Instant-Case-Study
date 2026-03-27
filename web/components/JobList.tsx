"use client";

import type { Job } from "@/lib/api";
import JobCard from "./JobCard";

interface Props {
  jobs: Job[];
  onDelete: (jobId: string) => Promise<void>;
  onRetry: (job: Job) => Promise<void>;
  page: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}

export default function JobList({ jobs, onDelete, onRetry, page, hasMore, onPageChange }: Props) {
  if (jobs.length === 0 && page === 0) {
    return (
      <p className="text-slate-400 text-sm text-center py-10">
        No case studies yet. Enter a GitHub URL above to get started.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onDelete={onDelete} onRetry={onRetry} />
      ))}

      {(page > 0 || hasMore) && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm transition-colors"
          >
            ← Previous
          </button>
          <span className="text-slate-500 text-sm">Page {page + 1}</span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!hasMore}
            className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
