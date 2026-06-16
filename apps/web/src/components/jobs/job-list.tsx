"use client";

import type { Job } from "@/lib/api";

type JobListProps = {
  jobs: Job[];
  onHoverJob: (id: string) => void;
};

export function JobList({ jobs, onHoverJob }: JobListProps) {
  return (
    <div className="grid gap-3">
      {jobs.map((job) => {
        const id = job._id ?? job.id ?? "";
        return (
          <a
            key={id}
            href={`/jobs/${id}`}
            onMouseEnter={() => onHoverJob(id)}
            className="rounded-md border bg-background p-4 transition-colors hover:bg-muted"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{job.title}</h2>
                <p className="text-sm text-muted-foreground">{job.company} · {job.location}</p>
              </div>
              <span className="text-sm font-medium">${job.salary.toLocaleString()}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded border px-2 py-1 text-xs">{job.type}</span>
              {job.skills.slice(0, 4).map((skill) => (
                <span key={skill} className="rounded border px-2 py-1 text-xs">
                  {skill}
                </span>
              ))}
            </div>
          </a>
        );
      })}
    </div>
  );
}
