"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/components/layout/UserContext";
import SuperuserDashboard from "@/components/dashboard/SuperuserDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import TherapistDashboard from "@/components/dashboard/TherapistDashboard";
import ClientDashboard from "@/components/dashboard/ClientDashboard";
import GuestDashboard from "@/components/dashboard/GuestDashboard";
import CoordinatorDashboard from "@/components/dashboard/CoordinatorDashboard";
import HRDashboard from "@/components/dashboard/HRDashboard";

export default function DashboardPage() {
  return <Suspense fallback={<div className="py-12 text-center text-slate-400">Loading...</div>}><Dashboard /></Suspense>;
}

function Dashboard() {
  const searchParams = useSearchParams();
  const currentUser = useCurrentUser();
  const roleParam = searchParams.get("role");
  const userType = roleParam || currentUser?.user_type || "therapist";
  const effectiveUser = { ...currentUser, user_type: userType, role: userType };

  switch (userType) {
    case "superuser":
      return <SuperuserDashboard user={effectiveUser} />;
    case "admin":
      return <AdminDashboard user={effectiveUser} />;
    case "therapist":
      return <TherapistDashboard user={effectiveUser} />;
    case "client":
      return <ClientDashboard user={effectiveUser} />;
    case "coordinator":
      return <CoordinatorDashboard user={effectiveUser} />;
    case "hr":
      return <HRDashboard user={effectiveUser} />;
    case "guest":
      return <GuestDashboard user={effectiveUser} />;
    default:
      return <TherapistDashboard user={effectiveUser} />;
  }
}
