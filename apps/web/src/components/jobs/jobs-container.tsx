"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, type Job } from "@/lib/api";
import { offlineDb } from "@/lib/offline-db";
import { queryKeys } from "@/lib/query-keys";
import { JobList } from "./job-list";

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [delayMs, value]);
  return debounced;
}

export function JobsContainer() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [cachedJobs, setCachedJobs] = useState<Job[]>([]);
  const debouncedQuery = useDebouncedValue(query, 300);
  const filters = useMemo(
    () => ({ query: debouncedQuery, location, type, limit: 12 }),
    [debouncedQuery, location, type],
  );
  const cacheKey = JSON.stringify(filters);

  const jobsQuery = useInfiniteQuery({
    queryKey: queryKeys.jobs.infinite(filters),
    queryFn: async ({ pageParam }) => {
      const response = await api.jobs({ ...filters, page: pageParam });
      const jobs = response.data.map((result) => ({ ...result.source, id: result.id }));
      await offlineDb.cacheJobs(cacheKey, jobs);
      return { jobs, nextPage: jobs.length === 12 ? pageParam + 1 : undefined };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    offlineDb.getCachedJobs<Job[]>(cacheKey).then((jobs) => setCachedJobs(jobs ?? []));
  }, [cacheKey]);

  const jobs = jobsQuery.data?.pages.flatMap((page) => page.jobs) ?? cachedJobs;

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6">
      <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
            placeholder="Search jobs"
          />
        </label>
        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
          placeholder="Location"
        />
        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Any type</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="remote">Remote</option>
        </select>
      </div>

      <JobList
        jobs={jobs}
        onHoverJob={(id) =>
          queryClient.prefetchQuery({
            queryKey: queryKeys.jobs.detail(id),
            queryFn: () => api.job(id),
            staleTime: 1000 * 60 * 5,
          })
        }
      />

      {jobsQuery.hasNextPage && (
        <button
          type="button"
          onClick={() => jobsQuery.fetchNextPage()}
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Load more
        </button>
      )}
    </main>
  );
}
