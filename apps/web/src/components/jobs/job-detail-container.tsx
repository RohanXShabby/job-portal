"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { offlineDb } from "@/lib/offline-db";
import { queryKeys } from "@/lib/query-keys";

export function JobDetailContainer({ jobId }: { jobId: string }) {
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const jobQuery = useQuery({
    queryKey: queryKeys.jobs.detail(jobId),
    queryFn: () => api.job(jobId),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    offlineDb.getDraft(jobId).then((draft) => setCoverLetter(draft ?? ""));
  }, [jobId]);

  useEffect(() => {
    offlineDb.saveDraft(jobId, coverLetter);
  }, [coverLetter, jobId]);

  const applyMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      if (resume) formData.set("resume", resume);
      formData.set("coverLetter", coverLetter);
      return api.apply(jobId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.mine() });
    },
  });

  const job = jobQuery.data?.data;

  if (jobQuery.isLoading) return <main className="p-6">Loading...</main>;
  if (!job) return <main className="p-6">Job not found.</main>;

  return (
    <main className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-6">
      <section className="grid gap-2">
        <h1 className="text-3xl font-semibold">{job.title}</h1>
        <p className="text-muted-foreground">{job.company} · {job.location} · {job.type}</p>
        <p className="font-medium">${job.salary.toLocaleString()}</p>
      </section>
      <p className="leading-7">{job.description}</p>
      <section className="grid gap-3">
        <textarea
          value={coverLetter}
          onChange={(event) => setCoverLetter(event.target.value)}
          className="min-h-36 rounded-md border bg-background p-3 text-sm"
          placeholder="Cover letter"
        />
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(event) => setResume(event.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <button
          type="button"
          disabled={!resume || applyMutation.isPending}
          onClick={() => applyMutation.mutate()}
          className="h-10 w-fit rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Apply
        </button>
      </section>
    </main>
  );
}
