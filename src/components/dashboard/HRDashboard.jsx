"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, CheckCheck, Users, CalendarClock, FileWarning, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import ClockInOut from "@/components/coordinator/ClockInOut";
import { getTherapists } from "@/lib/api-client/therapists";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api-client/notifications";

const typeStyles = {
  hr_alert: { bg: "bg-indigo-50", border: "border-indigo-200", icon: <AlertTriangle className="w-4 h-4 text-indigo-500" />, badge: "bg-indigo-100 text-indigo-700" },
  general: { bg: "bg-slate-50", border: "border-slate-200", icon: <Bell className="w-4 h-4 text-slate-400" />, badge: "bg-slate-100 text-slate-600" },
  task: { bg: "bg-amber-50", border: "border-amber-200", icon: <Clock className="w-4 h-4 text-amber-500" />, badge: "bg-amber-100 text-amber-700" },
  communication_note: { bg: "bg-blue-50", border: "border-blue-200", icon: <Bell className="w-4 h-4 text-blue-500" />, badge: "bg-blue-100 text-blue-700" },
};

export default function HRDashboard({ user }) {
  const [filter, setFilter] = useState("unread");

  const [notifications, setNotifications] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [notifs, theraps] = await Promise.all([
        getNotifications(user?.email),
        getTherapists(),
      ]);
      setNotifications(notifs);
      setTherapists(theraps);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(user?.email);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const hrAlerts = notifications.filter(n => n.type === "hr_alert");
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const urgentCount = notifications.filter(n => !n.is_read && n.title?.startsWith("URGENT")).length;

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.is_read;
    if (filter === "hr_alert") return n.type === "hr_alert";
    return true;
  }).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const today = new Date();
  const upcomingReviews = therapists.filter(t => {
    if (!t.annual_review_date) return false;
    const days = Math.round((new Date(t.annual_review_date + "T00:00:00") - today) / 86400000);
    return days >= 0 && days <= 60;
  }).sort((a, b) => new Date(a.annual_review_date) - new Date(b.annual_review_date));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Clock In/Out */}
      <ClockInOut />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HR Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Welcome back, {user?.full_name?.split(" ")[0]}</p>
        </div>
        <Link href="/Therapists">
          <Button variant="outline" className="gap-2">
            <Users className="w-4 h-4" />
            Manage Therapists
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-indigo-100 bg-indigo-50/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-700">{unreadCount}</div>
              <div className="text-xs text-indigo-500">Unread</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-100 bg-red-50/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-700">{urgentCount}</div>
              <div className="text-xs text-red-500">Urgent</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-100 bg-amber-50/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-700">{upcomingReviews.length}</div>
              <div className="text-xs text-amber-500">Reviews (60d)</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-teal-100 bg-teal-50/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-teal-700">{therapists.length}</div>
              <div className="text-xs text-teal-500">Active Therapists</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications Panel */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-800">Notifications</h2>
              {unreadCount > 0 && (
                <Badge className="bg-indigo-600 text-white text-xs">{unreadCount}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                {[["unread", "Unread"], ["hr_alert", "HR Alerts"], ["all", "All"]].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFilter(val)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      filter === val ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 text-slate-500 h-7"
                  onClick={() => handleMarkAllRead()}
                  disabled={false}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-center py-8 text-slate-400 text-sm">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <BellOff className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              filtered.map((n) => {
                const style = typeStyles[n.type] || typeStyles.general;
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 p-3 rounded-xl border transition-all ${style.bg} ${style.border} ${!n.is_read ? "shadow-sm" : "opacity-70"}`}
                  >
                    <div className="mt-0.5 shrink-0">{style.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium text-slate-800 ${!n.is_read ? "" : "font-normal"}`}>{n.title}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                          {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ""}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="shrink-0 mt-0.5 text-slate-300 hover:text-green-500 transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming Reviews Sidebar */}
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-amber-500" />
            Upcoming Annual Reviews
          </h2>
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {upcomingReviews.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  No reviews in next 60 days
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcomingReviews.map((t) => {
                    const days = Math.round((new Date(t.annual_review_date + "T00:00:00") - today) / 86400000);
                    const urgent = days <= 14;
                    return (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${urgent ? "bg-red-100" : "bg-amber-100"}`}>
                          <span className={`text-xs font-bold ${urgent ? "text-red-700" : "text-amber-700"}`}>{days}d</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{t.full_name}</p>
                          <p className="text-xs text-slate-400">{format(new Date(t.annual_review_date + "T00:00:00"), "MMM d, yyyy")}</p>
                        </div>
                        {urgent && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="space-y-2">
            <h2 className="font-semibold text-slate-800 text-sm">Quick Links</h2>
            <Link href="/Therapists">
              <Button variant="outline" className="w-full justify-start gap-2 text-sm h-9">
                <Users className="w-4 h-4 text-teal-600" />
                Therapist Records
              </Button>
            </Link>
            <Link href="/UserManagement">
              <Button variant="outline" className="w-full justify-start gap-2 text-sm h-9">
                <FileWarning className="w-4 h-4 text-indigo-600" />
                User Management
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
