import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/auth/is-admin";
import type { ReactNode } from "react";

async function AdminGuard({ children }: { children: ReactNode }) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/dashboard");
  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}
