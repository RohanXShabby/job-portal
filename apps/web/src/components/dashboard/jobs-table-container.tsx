"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function JobsTableContainer() {
  const queryClient = useQueryClient();
  const jobsQuery = useQuery({
    queryKey: queryKeys.jobs.list({}),
    queryFn: () => api.jobs({ limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });

  const jobs = jobsQuery.data?.data.map((result) => ({ ...result.source, id: result.id })) ?? [];
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "closed" }) =>
      api.updateJob(id, { status }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all() }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteJob(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all() }),
  });

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Jobs</h1>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Company</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const id = job._id ?? job.id ?? "";
              return (
                <tr key={id} className="border-t">
                  <td className="p-3">{job.title}</td>
                  <td className="p-3">{job.company}</td>
                  <td className="p-3">{job.status}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      className="mr-2 rounded-md border px-3 py-1"
                      onClick={() =>
                        statusMutation.mutate({ id, status: job.status === "active" ? "closed" : "active" })
                      }
                    >
                      Toggle
                    </button>
                    <a className="mr-2 rounded-md border px-3 py-1" href={`/jobs/${id}`}>
                      Edit
                    </a>
                    <button
                      type="button"
                      className="rounded-md border px-3 py-1"
                      onClick={() => deleteMutation.mutate(id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
