"use client";

import { Badge } from "@/components/ui/badge";
import { Shield, User, Stethoscope, Eye, Users, ClipboardList, Briefcase } from "lucide-react";

const userTypeConfig = {
  superuser: {
    label: "Superuser",
    icon: Shield,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-red-50 text-red-700 border-red-200",
  },
  therapist: {
    label: "Therapist",
    icon: Stethoscope,
    color: "bg-teal-50 text-teal-700 border-teal-200",
  },
  guest: {
    label: "Guest",
    icon: Eye,
    color: "bg-slate-50 text-slate-700 border-slate-200",
  },
  client: {
    label: "Client",
    icon: Users,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  coordinator: {
    label: "Coordinator",
    icon: ClipboardList,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  hr: {
    label: "HR",
    icon: Briefcase,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
};

export default function UserProfileBadge({ userType }) {
  const config = userTypeConfig[userType] || userTypeConfig.therapist;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1.5 ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
