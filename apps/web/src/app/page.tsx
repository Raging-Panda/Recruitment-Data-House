import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LoginCard } from "@/components/login-card";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard/profile");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <LoginCard />
    </main>
  );
}
