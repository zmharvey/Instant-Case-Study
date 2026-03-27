"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createJob, type Job, type JobTone } from "@/lib/api";

const TONES: JobTone[] = ["Professional", "Conversational", "Technical"];

interface Props {
  onJobCreated: (job: Job) => void;
}

export default function GenerateForm({ onJobCreated }: Props) {
  const { user } = useUser();
  const [url, setUrl] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState<JobTone | "">("");
  const [positioningBlurb, setPositioningBlurb] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!url.startsWith("https://github.com/")) {
      setError("URL must start with https://github.com/");
      return;
    }

    setLoading(true);
    try {
      const displayName = user?.fullName ?? user?.username ?? undefined;
      const job = await createJob(url.trim(), {
        displayName,
        companyName: companyName.trim() || undefined,
        targetAudience: targetAudience.trim() || undefined,
        tone: tone || undefined,
        positioningBlurb: positioningBlurb.trim() || undefined,
      });
      onJobCreated(job);
      setUrl("");
      setCompanyName("");
      setTargetAudience("");
      setTone("");
      setPositioningBlurb("");
      setShowOptions(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          required
          disabled={loading}
          className="flex-1 bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !url}
          className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Submitting...
            </>
          ) : (
            "Generate"
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowOptions((v) => !v)}
        className="self-start text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${showOptions ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {showOptions ? "Hide options" : "Customize output"}
      </button>

      {showOptions && (
        <div className="flex flex-col gap-3 bg-[#1e293b] border border-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-xs">
            Optional context to sharpen the AI-generated content.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-slate-300 text-xs font-medium">Company / Project name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
                disabled={loading}
                className="bg-[#0f172a] border border-slate-700 rounded-md px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300 text-xs font-medium">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as JobTone | "")}
                disabled={loading}
                className="bg-[#0f172a] border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-white"
              >
                <option value="">Default</option>
                {TONES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-300 text-xs font-medium">Target audience</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. CTOs at mid-market SaaS companies"
              disabled={loading}
              className="bg-[#0f172a] border border-slate-700 rounded-md px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-300 text-xs font-medium">Positioning blurb</label>
            <textarea
              value={positioningBlurb}
              onChange={(e) => setPositioningBlurb(e.target.value)}
              placeholder="e.g. This tool helps DevOps teams cut deploy time by 40%"
              rows={2}
              disabled={loading}
              className="bg-[#0f172a] border border-slate-700 rounded-md px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 resize-none"
            />
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );
}
