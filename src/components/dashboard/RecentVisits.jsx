"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const therapyColor = {
  "Physical Therapy": "bg-blue-50 text-blue-700 border-blue-200",
  "Occupational Therapy": "bg-amber-50 text-amber-700 border-amber-200",
  "Speech Therapy": "bg-violet-50 text-violet-700 border-violet-200",
};

const statusColor = {
  draft: "bg-slate-100 text-slate-600",
  completed: "bg-emerald-50 text-emerald-700",
  signed: "bg-teal-50 text-teal-700",
};

export default function RecentVisits({ visits = [] }) {
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadPDF = async (e, visit) => {
    e.preventDefault();
    e.stopPropagation();
    // mock no-op
  };

  if (visits.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No visit notes yet</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Recent Visits</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {visits.map((v) => (
            <Link
              key={v.id}
              href={`/VisitNoteDetail?id=${v.id}`}
              className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{v.patient_name}</p>
                  <p className="text-xs text-slate-400">{v.therapist_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={`text-xs font-normal ${therapyColor[v.therapy_type] || ""}`}>
                  {v.therapy_type?.replace(" Therapy", "")}
                </Badge>
                <Badge className={`text-xs font-normal ${statusColor[v.status] || ""}`}>
                  {v.status}
                </Badge>
                <span className="text-xs text-slate-400 w-20 text-right">
                  {v.visit_date ? format(new Date(v.visit_date), "MMM d") : ""}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => handleDownloadPDF(e, v)}
                  disabled={downloadingId === v.id}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
