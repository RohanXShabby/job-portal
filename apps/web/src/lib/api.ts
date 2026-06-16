import { env } from "@job-portal/env/web";

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
  meta?: Record<string, unknown>;
};

export type Job = {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary: number;
  type: "full-time" | "part-time" | "remote";
  skills: string[];
  status: "active" | "closed";
  postedBy: string;
  createdAt?: string;
};

export type Application = {
  _id: string;
  jobId: string;
  candidateId: string;
  resumeUrl: string;
  coverLetter?: string;
  status: "pending" | "reviewed" | "accepted" | "rejected";
  appliedAt?: string;
};

export type User = {
  _id: string;
  name: string;
  email: string;
  role: "super_admin" | "recruiter" | "candidate";
  emailVerified: boolean;
};

async function apiFetch<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message ?? "Request failed");
  }
  return payload;
}

export const api = {
  jobs: (params: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.set(key, String(value));
    });
    return apiFetch<Array<{ id: string; source: Job }>>(`/api/jobs?${query.toString()}`);
  },
  job: (id: string) => apiFetch<Job>(`/api/jobs/${id}`),
  apply: (jobId: string, formData: FormData) =>
    apiFetch<Application>(`/api/jobs/${jobId}/apply`, { method: "POST", body: formData }),
  updateJob: (jobId: string, data: Partial<Job>) =>
    apiFetch<Job>(`/api/jobs/${jobId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteJob: (jobId: string) => apiFetch<null>(`/api/jobs/${jobId}`, { method: "DELETE" }),
  myApplications: () => apiFetch<Application[]>("/api/applications/me"),
  jobApplications: (jobId: string) => apiFetch<Application[]>(`/api/jobs/${jobId}/applications`),
  updateApplicationStatus: (jobId: string, appId: string, status: Application["status"]) =>
    apiFetch<Application>(`/api/jobs/${jobId}/applications/${appId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  adminStats: () =>
    apiFetch<{ totalJobs: number; applications: number; users: number; activeListings: number }>(
      "/api/admin/stats",
    ),
  users: () => apiFetch<{ users: User[]; pagination: Record<string, number> }>("/api/users"),
  updateUserRole: (userId: string, role: User["role"]) =>
    apiFetch<User>(`/api/users/${userId}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  allApplications: () => apiFetch<Application[]>("/api/applications/all"),
};
