"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Eye, ShieldAlert } from "lucide-react";

export default function GuestDashboard({ user }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Guest Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome, {user?.full_name}</p>
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Limited Access</h3>
              <p className="text-sm text-slate-600 mb-3">
                Your account has guest access with view-only permissions. You can browse information but cannot create or edit records.
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Eye className="w-4 h-4" />
                <span>View-only mode</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-2">What you can do:</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                View patient information
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Browse visit notes
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                View therapist profiles
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Restricted actions:</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Create or edit patient records
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Document visit notes
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Manage system settings
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
