"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getReferrals } from "@/lib/api-client/referrals";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, FileText, Upload, Pencil } from "lucide-react";

const actionColors = {
  created: "bg-emerald-50 text-emerald-700",
  updated: "bg-blue-50 text-blue-700",
  skipped: "bg-amber-50 text-amber-700",
};

export default function ReferralListTab({ onEdit }) {
  const [search, setSearch] = useState("");
  const [referrals, setReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReferrals = useCallback(async () => {
    try {
      const data = await getReferrals();
      setReferrals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadReferrals(); }, [loadReferrals]);

  const filtered = referrals.filter((r) =>
    `${r.first_name} ${r.last_name} ${r.agency || ""} ${r.insurance || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">All Referrals</h2>
          <p className="text-sm text-slate-500">{referrals.length} total referrals logged</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search referrals..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead className="hidden md:table-cell">Referral Date</TableHead>
              <TableHead className="hidden lg:table-cell">Agency</TableHead>
              <TableHead className="hidden lg:table-cell">Therapy Types</TableHead>
              <TableHead className="hidden xl:table-cell">Insurance</TableHead>
              <TableHead className="hidden md:table-cell">Source</TableHead>
              <TableHead>Patient Action</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-400">Loading...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-400">No referrals found</TableCell>
              </TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id} className="hover:bg-slate-50/60">
                <TableCell className="font-medium">
                  <div>{r.first_name} {r.last_name}</div>
                  {r.date_of_birth && <div className="text-xs text-slate-400">DOB: {r.date_of_birth}</div>}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-slate-500">
                  {r.referral_date || "---"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                  {r.agency || "---"}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex gap-1 flex-wrap">
                    {(r.therapy_types || []).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">{t.replace(" Therapy", "")}</Badge>
                    ))}
                    {(!r.therapy_types || r.therapy_types.length === 0) && <span className="text-slate-400 text-sm">---</span>}
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell text-sm text-slate-500">
                  {r.insurance || "---"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {r.source_type === "pdf_import" ? (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Upload className="w-3 h-3" /> PDF Import
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <FileText className="w-3 h-3" /> Manual
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {r.patient_action ? (
                    <Badge className={`text-xs capitalize ${actionColors[r.patient_action] || ""}`}>
                      {r.patient_action}
                    </Badge>
                  ) : "---"}
                </TableCell>
                <TableCell>
                  {r.patient_id && onEdit && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(r.patient_id)}>
                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
