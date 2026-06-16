"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export default function ProfilePage() {
  const applicationsQuery = useQuery({
    queryKey: queryKeys.applications.mine(),
    queryFn: () => api.myApplications(),
  });
  const applications = applicationsQuery.data?.data ?? [];

  return (
    <main className="mx-auto grid w-full max-w-4xl gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <section className="grid gap-3">
        <h2 className="text-lg font-medium">Application history</h2>
        {applications.map((application) => (
          <div key={application._id} className="rounded-md border p-4">
            <p className="text-sm font-medium">Job {application.jobId}</p>
            <p className="text-sm text-muted-foreground">{application.status}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
