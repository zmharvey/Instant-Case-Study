"use client";

import { downloadUrl } from "@/lib/api";

interface Props {
  jobId: string;
  repoName: string | null;
}

export default function DownloadButtons({ jobId, repoName }: Props) {
  const label = repoName ?? "repo";

  return (
    <div className="flex gap-2 flex-wrap">
      <a
        href={downloadUrl(jobId, "case-study")}
        download={`case_study_${label}.pdf`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        Case Study PDF
      </a>
      <a
        href={downloadUrl(jobId, "linkedin")}
        download={`linkedin_post_${label}.pdf`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        LinkedIn PDF
      </a>
    </div>
  );
}
