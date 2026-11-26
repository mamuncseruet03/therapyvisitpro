import { auth, signOut } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Layout from "@/components/layout/Layout";

export default async function AppLayout({ children }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!(await getCurrentUser())) {
    return (
      <main className="mx-auto max-w-lg space-y-3 p-8">
        <h1 className="text-xl font-semibold">Account access is suspended</h1>
        <p>Contact your administrator to restore access.</p>
        <form action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}>
          <button type="submit" className="rounded border px-3 py-2 text-sm">Sign Out</button>
        </form>
      </main>
    );
  }

  const user = {
    id: session.user.id,
    email: session.user.email,
    full_name: session.user.name,
    user_type: session.user.userType?.toLowerCase(),
    role: session.user.role?.toLowerCase(),
    therapist_id: session.user.therapistId,
    discipline: session.user.discipline,
  };

  return <Layout user={user}>{children}</Layout>;
}
