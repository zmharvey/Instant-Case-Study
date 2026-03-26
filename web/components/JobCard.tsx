import type { Job } from "@/lib/api";
import DownloadButtons from "./DownloadButtons";

interface Props {
  job: Job;
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

export default function JobCard({ job }: Props) {
  const displayName = job.repo_name ?? job.repo_url.split("/").slice(-1)[0];
  const createdAt = new Date(job.created_at).toLocaleString();

  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-white font-medium truncate">{displayName}</p>
          <p className="text-slate-400 text-xs truncate mt-0.5">{job.repo_url}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {job.status === "done" && (
        <DownloadButtons jobId={job.id} repoName={job.repo_name} />
      )}

      {job.status === "failed" && job.error_msg && (
        <p className="text-red-400 text-xs bg-red-950/40 rounded px-2 py-1.5 border border-red-900/50">
          {job.error_msg}
        </p>
      )}

      <p className="text-slate-500 text-xs">{createdAt}</p>
    </div>
  );
}
