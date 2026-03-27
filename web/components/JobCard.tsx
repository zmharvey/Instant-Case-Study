"use client";

import { useState } from "react";
import type { Job } from "@/lib/api";
import DownloadButtons from "./DownloadButtons";

interface Props {
  job: Job;
  onDelete: (jobId: string) => Promise<void>;
  onRetry: (job: Job) => Promise<void>;
}

function StatusBadge({ status }: { status: Job["status"] }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-400 text-sm">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Queued
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 text-indigo-400 text-sm">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Generating...
      </span>
    );
  }
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-400 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-red-400 text-sm">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
      Failed
    </span>
  );
}

export default function JobCard({ job, onDelete, onRetry }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const displayName = job.repo_name ?? job.repo_url.split("/").slice(-1)[0];
  const createdAt = new Date(job.created_at).toLocaleString();

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(job.id);
    } catch {
      setDeleting(false);
    }
  }

  async function handleRetry() {
    setRetrying(true);
    try {
      await onRetry(job);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-white font-medium truncate">{displayName}</p>
          <p className="text-slate-400 text-xs truncate mt-0.5">{job.repo_url}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={job.status} />
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
            className="p-1 text-slate-500 hover:text-red-400 disabled:opacity-40 transition-colors"
          >
            {deleting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {job.status === "done" && (
        <DownloadButtons jobId={job.id} repoName={job.repo_name} />
      )}

      {job.status === "failed" && (
        <div className="flex flex-col gap-2">
          {job.error_msg && (
            <p className="text-red-400 text-xs bg-red-950/40 rounded px-2 py-1.5 border border-red-900/50">
              {job.error_msg}
            </p>
          )}
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
          >
            {retrying ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Retrying...
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </>
            )}
          </button>
        </div>
      )}

      <p className="text-slate-500 text-xs">{createdAt}</p>
    </div>
  );
}
