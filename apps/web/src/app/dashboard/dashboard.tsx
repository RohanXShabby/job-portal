"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function Dashboard() {
  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => api.adminStats(),
  });
  const stats = statsQuery.data?.data;

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total jobs", stats?.totalJobs ?? 0],
          ["Applications", stats?.applications ?? 0],
          ["Users", stats?.users ?? 0],
          ["Active listings", stats?.activeListings ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <nav className="flex flex-wrap gap-2">
        <a className="rounded-md border px-3 py-2 text-sm" href="/dashboard/jobs">Jobs</a>
        <a className="rounded-md border px-3 py-2 text-sm" href="/dashboard/users">Users</a>
        <a className="rounded-md border px-3 py-2 text-sm" href="/dashboard/applications">Applications</a>
      </nav>
    </main>
  );
}
