import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppNavbar } from "@/components/app/AppNavbar";
import { getMeServer } from "@/lib/server-api";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookie = (await headers()).get("cookie") ?? null;

  let user = null;
  try {
    user = await getMeServer(cookie);
  } catch {
    redirect("/");
  }

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar initialUser={user} />
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
