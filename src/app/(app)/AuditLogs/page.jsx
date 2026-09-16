"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAuditLogs } from "@/lib/api-client/audit-logs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Search, ShieldCheck } from "lucide-react";

const actionColors = {
  view: "bg-blue-50 text-blue-700",
  create: "bg-green-50 text-green-700",
  update: "bg-amber-50 text-amber-700",
  delete: "bg-red-50 text-red-700",
  export: "bg-purple-50 text-purple-700",
  sign: "bg-teal-50 text-teal-700",
  login: "bg-slate-100 text-slate-600",
  logout: "bg-slate-100 text-slate-600",
};

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    return !q ||
      (l.user_name || "").toLowerCase().includes(q) ||
      (l.user_email || "").toLowerCase().includes(q) ||
      (l.resource_label || "").toLowerCase().includes(q) ||
      (l.resource_type || "").toLowerCase().includes(q) ||
      (l.action || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-teal-100 rounded-lg">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-sm text-slate-500">HIPAA access and activity trail</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search by user, patient, action…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-sm text-slate-400 text-center py-12">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No audit logs found</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(log => (
                <div key={log.id} className="flex items-start gap-4 px-5 py-3 hover:bg-slate-50">
                  <div className="shrink-0 pt-0.5">
                    <Badge className={`text-xs capitalize ${actionColors[log.action] || "bg-slate-100 text-slate-600"}`}>
                      {log.action}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800">{log.resource_type}</span>
                      {log.resource_label && <span className="text-sm text-slate-600">— {log.resource_label}</span>}
                    </div>
                    {log.details && <p className="text-xs text-slate-400 mt-0.5">{log.details}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">
                      By <span className="text-slate-600 font-medium">{log.user_name || "Unknown"}</span>
                      {log.user_email && <span className="ml-1 text-slate-400">({log.user_email})</span>}
                    </p>
                  </div>
                  <div className="shrink-0 text-xs text-slate-400 whitespace-nowrap">
                    {log.timestamp ? format(new Date(log.timestamp), "MMM d, yyyy h:mm a") : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}