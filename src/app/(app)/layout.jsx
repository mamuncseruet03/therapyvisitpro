import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Layout from "@/components/layout/Layout";

export default async function AppLayout({ children }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
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
