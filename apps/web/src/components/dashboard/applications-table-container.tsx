"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Application } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function ApplicationsTableContainer() {
  const queryClient = useQueryClient();
  const applicationsQuery = useQuery({
    queryKey: queryKeys.applications.all(),
    queryFn: () => api.allApplications(),
  });
  const mutation = useMutation({
    mutationFn: ({ app, status }: { app: Application; status: Application["status"] }) =>
      api.updateApplicationStatus(app.jobId, app._id, status),
    onMutate: async ({ app, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.applications.all() });
      const previous = queryClient.getQueryData(queryKeys.applications.all());
      queryClient.setQueryData(queryKeys.applications.all(), (current: typeof applicationsQuery.data) =>
        current
          ? { ...current, data: current.data.map((item) => (item._id === app._id ? { ...item, status } : item)) }
          : current,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.applications.all(), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.applications.all() }),
  });
  const applications = applicationsQuery.data?.data ?? [];

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Applications</h1>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr><th className="p-3">Candidate</th><th className="p-3">Job</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app._id} className="border-t">
                <td className="p-3">{app.candidateId}</td>
                <td className="p-3">{app.jobId}</td>
                <td className="p-3">
                  <select
                    value={app.status}
                    onChange={(event) =>
                      mutation.mutate({ app, status: event.target.value as Application["status"] })
                    }
                    className="h-9 rounded-md border bg-background px-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
