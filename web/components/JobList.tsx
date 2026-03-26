"use client";

import { useEffect, useRef, useState } from "react";
import { listJobs, getJob, type Job } from "@/lib/api";
import JobCard from "./JobCard";

const POLL_INTERVAL = 3000;

export default function JobList({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasActive = jobs.some((j) => j.status === "pending" || j.status === "running");

  useEffect(() => {
    if (!hasActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(async () => {
      // Only re-fetch jobs that are still in-flight
      const updated = await Promise.all(
        jobs.map(async (j) => {
          if (j.status === "pending" || j.status === "running") {
            try {
              return await getJob(j.id);
            } catch {
              return j;
            }
          }
          return j;
        })
      );
      setJobs(updated);
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasActive, jobs]);

  if (jobs.length === 0) {
    return (
      <p className="text-slate-400 text-sm text-center py-10">
        No case studies yet. Enter a GitHub URL above to get started.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

// Exported so the dashboard page can prepend a new job without a full reload
export function prependJob(setJobs: React.Dispatch<React.SetStateAction<Job[]>>, job: Job) {
  setJobs((prev) => [job, ...prev]);
}
