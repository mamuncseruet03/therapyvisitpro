"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getCompanyInfo, saveMenuPermissions } from "@/lib/api-client/company-info";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Settings, ShieldCheck, User, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";

// All navigable pages with friendly labels
const ALL_NAV_PAGES = [
  { key: "Dashboard", label: "Dashboard" },
  { key: "MySchedule", label: "My Schedule" },
  { key: "MyTasks", label: "My Tasks" },
  { key: "MyProfile", label: "My Profile" },
  { key: "MyPatients", label: "My Patients" },
  { key: "Patients", label: "Patients" },
  { key: "Therapists", label: "Therapists" },
  { key: "VisitNotes", label: "Visit Notes" },
  { key: "VisitCalendar", label: "Visit Calendar" },
  { key: "Agencies", label: "Agencies" },
  { key: "Invoices", label: "Billing" },
  { key: "Payroll", label: "Payroll" },
  { key: "Reports", label: "Reports" },
  { key: "CompanyInformation", label: "Company Info" },
  { key: "TaskAssignment", label: "Task Assignment" },
  { key: "Orders", label: "Orders" },
  { key: "DocumentLibrary", label: "Document Library" },
  { key: "UserManagement", label: "User Administration" },
  { key: "CompanySettings", label: "Company Settings" },
  { key: "CoordinatorTasks", label: "My Tasks (Coordinator)" },
  { key: "MyLabor", label: "My Labor (Coordinator)" },
];

const ROLES = [
  { key: "admin", label: "Admin", icon: ShieldCheck, color: "text-teal-600" },
  { key: "therapist", label: "Therapist", icon: User, color: "text-blue-600" },
  { key: "coordinator", label: "Coordinator", icon: Users, color: "text-violet-600" },
  { key: "guest", label: "Guest", icon: User, color: "text-slate-500" },
  { key: "client", label: "Agency/Client", icon: User, color: "text-amber-600" },
];

// Default permissions if none configured
const DEFAULT_PERMISSIONS = {
  admin: ALL_NAV_PAGES.filter(p =>
    !["MySchedule", "MyPatients", "MyTasks", "MyProfile"].includes(p.key)
  ).map(p => p.key),
  therapist: ["Dashboard", "MySchedule", "MyTasks", "MyProfile", "MyPatients", "VisitNotes", "CompanyInformation"],
  coordinator: ["Dashboard", "Patients", "Therapists", "VisitNotes", "VisitCalendar", "Agencies", "CompanyInformation", "TaskAssignment", "Orders", "DocumentLibrary", "UserManagement", "CoordinatorTasks", "MyLabor"],
  guest: ["Dashboard", "CompanyInformation"],
  client: ["Dashboard", "CompanyInformation"],
};

export default function CompanySettings() {
  const effectiveUser = useCurrentUser();
  const isSuperuser = effectiveUser?.role === "superuser" || effectiveUser?.user_type === "superuser";

  const [permissions, setPermissions] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const data = await getCompanyInfo();
      setPermissions(data?.menu_permissions || DEFAULT_PERMISSIONS);
    } catch (err) {
      setPermissions(DEFAULT_PERMISSIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveMenuPermissions(permissions);
      if (result?.success) {
        toast.success("Menu permissions saved. Changes apply on next page load.");
        setDirty(false);
      }
    } catch (err) {
      toast.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (role, pageKey) => {
    setPermissions(prev => {
      const current = prev[role] || [];
      const updated = current.includes(pageKey)
        ? current.filter(k => k !== pageKey)
        : [...current, pageKey];
      return { ...prev, [role]: updated };
    });
    setDirty(true);
  };

  const setAll = (role, value) => {
    setPermissions(prev => ({
      ...prev,
      [role]: value ? ALL_NAV_PAGES.map(p => p.key) : [],
    }));
    setDirty(true);
  };

  if (!isSuperuser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <ShieldAlert className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">Superuser access required</p>
      </div>
    );
  }

  if (isLoading || permissions === null) {
    return <div className="text-center py-10 text-slate-400 text-sm">Loading…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-teal-600" />
            Company Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">Control which menu options each role can access</p>
        </div>
        <Button
          onClick={() => handleSave()}
          disabled={!dirty || saving}
          className="bg-teal-600 hover:bg-teal-700 gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Menu Access Matrix</CardTitle>
          <p className="text-xs text-slate-400">Check the boxes to allow each role to see that menu item. Superusers always have full access.</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-600 w-56">Menu Item</th>
                  {ROLES.map(role => (
                    <th key={role.key} className="text-center px-6 py-3 font-semibold">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`flex items-center gap-1.5 ${role.color}`}>
                          <role.icon className="w-4 h-4" />
                          <span>{role.label}</span>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => setAll(role.key, true)} className="text-[10px] text-teal-600 hover:underline">All</button>
                          <span className="text-slate-300">|</span>
                          <button onClick={() => setAll(role.key, false)} className="text-[10px] text-red-500 hover:underline">None</button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_NAV_PAGES.map((page, idx) => (
                  <tr key={page.key} className={`border-b last:border-b-0 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                    <td className="px-5 py-3 font-medium text-slate-700">{page.label}</td>
                    {ROLES.map(role => {
                      const allowed = (permissions[role.key] || []).includes(page.key);
                      return (
                        <td key={role.key} className="text-center px-6 py-3">
                          <button
                            onClick={() => toggle(role.key, page.key)}
                            className={`w-5 h-5 rounded border-2 transition-all mx-auto flex items-center justify-center ${
                              allowed
                                ? "bg-teal-500 border-teal-500 text-white"
                                : "border-slate-300 hover:border-teal-400"
                            }`}
                          >
                            {allowed && <span className="text-xs font-bold leading-none">✓</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <p className="font-semibold mb-1">Note</p>
          <p>Superusers always have full access to all pages regardless of these settings. Changes take effect when users refresh or navigate to a new page.</p>
        </div>
      </div>
    </div>
  );
}
