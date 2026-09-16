"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DcOasisForm from "./DcOasisForm";

export default function DischargeOasisSection({ oasis = {}, onChange }) {
  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-800">Discharge OASIS</CardTitle>
        <p className="text-xs text-slate-500 mt-1">D/C Not to Inpatient Facility (OASIS-E2) -- Extended Home Care - Effective 4/1/2026</p>
      </CardHeader>
      <CardContent>
        <DcOasisForm value={oasis} onChange={onChange} />
      </CardContent>
    </Card>
  );
}
