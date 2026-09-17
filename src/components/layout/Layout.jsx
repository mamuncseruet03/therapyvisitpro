"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "./sign-out-action";
import { UserProvider } from "./UserContext";
import { ChevronDown } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Menu,
  Activity,
  UserCog,
  X,
  Building2,
  Receipt,
  CalendarDays,
  DollarSign,
  BarChart2,
  CalendarCheck,
  ClipboardList,
  Library,
  LogOut,
  Shield,
  Clock,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AnnouncementBar from "./AnnouncementBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getUsersForSelect } from "@/lib/api-client/tasks";
import { getCompanyInfo } from "@/lib/api-client/company-info";

const BASE44_MENU_PERMISSIONS = {
  admin: ["Dashboard", "Patients", "Therapists", "VisitNotes", "VisitCalendar", "Agencies", "Invoices", "Payroll", "Reports", "CompanyInformation", "TaskAssignment", "Orders", "DocumentLibrary", "UserManagement", "CompanySettings", "AuditLogs"],
  therapist: ["Dashboard", "MySchedule", "MyTasks", "MyProfile", "MyPatients", "VisitNotes", "CompanyInformation"],
  coordinator: ["Dashboard", "Patients", "VisitNotes", "VisitCalendar", "CompanyInformation", "TaskAssignment", "DocumentLibrary", "CoordinatorTasks", "MyLabor"],
  hr: ["Dashboard", "Therapists", "CompanyInformation"],
  guest: [],
  client: [],
};

const NAV = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard", href: "/" },
  { name: "My Schedule", icon: CalendarDays, page: "MySchedule", href: "/MySchedule" },
  { name: "User Administration", icon: UserCog, page: "UserManagement", href: "/UserManagement" },
  { name: "My Tasks", icon: ClipboardList, page: "MyTasks", href: "/MyTasks" },
  { name: "My Tasks", icon: ClipboardList, page: "CoordinatorTasks", href: "/CoordinatorTasks" },
  { name: "My Labor", icon: Clock, page: "MyLabor", href: "/MyLabor" },
  { name: "My Profile", icon: UserCog, page: "MyProfile", href: "/MyProfile" },
  { name: "My Patients", icon: UserCheck, page: "MyPatients", href: "/MyPatients" },
  { name: "Patients", icon: Users, page: "Patients", href: "/Patients" },
  { name: "Therapists", icon: UserCheck, page: "Therapists", href: "/Therapists" },
  { name: "Visit Notes", icon: FileText, page: "VisitNotes", href: "/VisitNotes" },
  { name: "Visit Calendar", icon: CalendarDays, page: "VisitCalendar", href: "/VisitCalendar" },
  { name: "Agencies", icon: Activity, page: "Agencies", href: "/Agencies" },
  { name: "Invoices", icon: Receipt, page: "AgencyInvoices", href: "/Invoices?view=agency" },
  { name: "Billing", icon: Receipt, page: "Invoices", href: "/Invoices", submenu: [
    "Invoice Manager",
    "Edit Special Pricing",
    "Edit Rate Level Pricing",
    "Edit Visit Add-Ons",
    "Edit Invoice",
    "Medicare Part B Billing",
  ]},
  { name: "Payroll", icon: DollarSign, page: "Payroll", href: "/Payroll" },
  { name: "Reports", icon: BarChart2, page: "Reports", href: "/Reports", submenu: [
    "Accounts Receivable Report",
    "Billed Visits",
    "Trended Referrals by Agency",
    "Discharge List Report",
    "Profitability Report",
    "Missed Visit Report",
  ]},
  { name: "Company Info", icon: Building2, page: "CompanyInformation", href: "/CompanyInformation" },
  { name: "Company Settings", icon: Settings, page: "CompanySettings", href: "/CompanySettings" },
  { name: "Task Assignment", icon: ClipboardList, page: "TaskAssignment", href: "/TaskAssignment" },
  { name: "Orders", icon: ClipboardList, page: "Orders", href: "/Orders", submenu: ["Medical Record Deletions", "Eval Orders", "Recert Orders", "Discharge Orders"] },
  { name: "Document Library", icon: Library, page: "DocumentLibrary", href: "/DocumentLibrary" },
  { name: "Weekly Close", icon: DollarSign, page: "WeeklyClose", href: "/WeeklyClose" },
  { name: "Audit Logs", icon: Shield, page: "AuditLogs", href: "/AuditLogs" },
];

const SUPERUSER_HIDDEN = ["MySchedule", "MyPatients", "MyTasks", "MyProfile", "WeeklyClose", "VisitNotes", "VisitCalendar"];

function getPageFromPathname(pathname) {
  if (pathname === "/") return "Dashboard";
  return pathname.replace("/", "");
}

export default function Layout({ children, user }) {
  const pathname = usePathname();
  const currentPageName = getPageFromPathname(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState(null);
  const [impersonationUsers, setImpersonationUsers] = useState([]);
  const [impersonationSearch, setImpersonationSearch] = useState("");
  const [menuPermissions, setMenuPermissions] = useState(BASE44_MENU_PERMISSIONS);

  useEffect(() => {
    if (user?.user_type === "superuser") {
      getUsersForSelect().then(setImpersonationUsers).catch(() => setImpersonationUsers([]));
    }
  }, [user?.user_type]);

  useEffect(() => {
    getCompanyInfo()
      .then((info) => {
        if (info?.menu_permissions && Object.keys(info.menu_permissions).length > 0) {
          setMenuPermissions(info.menu_permissions);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const filteredImpersonationUsers = useMemo(() => {
    const query = impersonationSearch.trim().toLowerCase();
    return impersonationUsers.filter((candidate) =>
      !query || `${candidate.full_name || ""} ${candidate.email || ""} ${candidate.user_type || ""}`.toLowerCase().includes(query)
    );
  }, [impersonationSearch, impersonationUsers]);

  const effectiveUser = user
    ? { ...user, ...(impersonatedUser || {}) }
    : { user_type: "therapist", full_name: "User" };
  const isSuperuser = effectiveUser?.user_type === "superuser";
  const userRoleKey = effectiveUser?.user_type || "therapist";
  const isHR = userRoleKey === "hr";

  const visibleNav = NAV.filter((item) => {
    if (isSuperuser) return !SUPERUSER_HIDDEN.includes(item.page);
    const permissionRole = userRoleKey;
    const permissionPage = item.page === "AgencyInvoices" ? "Invoices" : item.page;
    return (menuPermissions[permissionRole] || []).includes(permissionPage);
  });

  const SidebarContent = ({ mobile }) => (
    <div className={`flex flex-col h-full bg-white ${mobile ? "" : "border-r border-slate-100"}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-sm tracking-tight">TherapyDocs</h1>
          <p className="text-[11px] text-slate-400 -mt-0.5">Visit Documentation</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => {
          const active = currentPageName === item.page;
          if (item.submenu) {
            const isReports = item.page === "Reports";
            const isBilling = item.page === "Invoices";
            const isOrders = item.page === "Orders";
            const isOpen = isReports ? reportsOpen : isBilling ? billingOpen : isOrders ? ordersOpen : false;
            const toggleOpen = isReports
              ? () => setReportsOpen(!reportsOpen)
              : isBilling
              ? () => setBillingOpen(!billingOpen)
              : isOrders
              ? () => setOrdersOpen(!ordersOpen)
              : () => {};
            return (
              <div key={item.page}>
                <button
                  onClick={toggleOpen}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active || isOpen
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  <item.icon className={`w-[18px] h-[18px] ${active || isOpen ? "text-teal-600" : "text-slate-400"}`} />
                  <span className="flex-1 text-left">{item.name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="ml-6 mt-1 space-y-0.5 border-l border-slate-100 pl-3">
                    {item.submenu.map((sub) => {
                      const tabMap = { "Medical Record Deletions": "deletions", "Eval Orders": "eval", "Recert Orders": "recert", "Discharge Orders": "discharge" };
                      const linkTo = tabMap[sub]
                        ? `${item.href}?tab=${tabMap[sub]}`
                        : `${item.href}?report=${encodeURIComponent(sub)}`;
                      return (
                        <Link
                          key={sub}
                          href={linkTo}
                          onClick={() => mobile && setSidebarOpen(false)}
                          className="block px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                        >
                          {sub}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link
              key={item.page}
              href={item.href}
              onClick={() => mobile && setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] ${active ? "text-teal-600" : "text-slate-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="px-3 pb-3 border-t border-slate-100 pt-3">
        {user?.user_type === "superuser" && (
          <Button variant="outline" className="mb-2 w-full justify-start gap-3" onClick={() => setImpersonateOpen(true)}>
            <Users className="h-[18px] w-[18px]" />
            {impersonatedUser ? "Change Impersonation" : "Impersonate User"}
          </Button>
        )}
        {impersonatedUser && (
          <Button variant="ghost" className="mb-2 w-full text-xs text-teal-700" onClick={() => setImpersonatedUser(null)}>
            Return to Superuser
          </Button>
        )}
        <button
          onClick={() => signOutAction()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
        <p className="text-[11px] text-slate-300 mt-2 px-3">Contract Therapy Services</p>
      </div>
    </div>
  );

  return (
    <UserProvider user={effectiveUser}>
    <div className="min-h-screen bg-slate-50/50 flex">
      <Dialog open={impersonateOpen} onOpenChange={setImpersonateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Impersonate User</DialogTitle></DialogHeader>
          <Input placeholder="Search users..." value={impersonationSearch} onChange={(event) => setImpersonationSearch(event.target.value)} />
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {filteredImpersonationUsers.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                onClick={() => { setImpersonatedUser(candidate); setImpersonateOpen(false); setImpersonationSearch(""); }}
              >
                <span className="text-sm font-medium">{candidate.full_name || candidate.email}</span>
                <span className="text-xs text-slate-500">{candidate.user_type}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 shadow-xl">
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-60">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-20">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-slate-900">TherapyDocs</span>
          </div>
          <div className="w-9" />
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <AnnouncementBar canPost={isSuperuser} />
          {children}
        </div>
      </main>
    </div>
    </UserProvider>
  );
}
