import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) redirect("/login");
  if ((session.user as { role?: string }).role !== "super_admin") redirect("/");

  return children;
}
