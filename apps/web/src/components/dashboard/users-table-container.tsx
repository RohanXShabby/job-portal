"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type User } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function UsersTableContainer() {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: queryKeys.users.list(), queryFn: () => api.users() });
  const mutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: User["role"] }) => api.updateUserRole(userId, role),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all() }),
  });
  const users = usersQuery.data?.data.users ?? [];

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Users</h1>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th></tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-t">
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">
                  <select
                    value={user.role}
                    onChange={(event) =>
                      mutation.mutate({ userId: user._id, role: event.target.value as User["role"] })
                    }
                    className="h-9 rounded-md border bg-background px-2"
                  >
                    <option value="candidate">Candidate</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="super_admin">Super admin</option>
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
