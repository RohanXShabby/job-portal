export const queryKeys = {
  session: () => ["session"] as const,
  jobs: {
    all: () => ["jobs"] as const,
    list: (filters: Record<string, string | number | undefined>) => ["jobs", "list", filters] as const,
    infinite: (filters: Record<string, string | number | undefined>) => ["jobs", "infinite", filters] as const,
    detail: (id: string) => ["jobs", "detail", id] as const,
  },
  applications: {
    all: () => ["applications"] as const,
    mine: () => ["applications", "mine"] as const,
    byJob: (jobId: string) => ["applications", "job", jobId] as const,
  },
  users: {
    all: () => ["users"] as const,
    list: () => ["users", "list"] as const,
  },
};
