"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardList, Check, X, Calendar, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateAssignment } from "@/lib/api-client/referrals";
import { saveVisitNote } from "@/lib/api-client/visit-notes";

const therapyColors = {
  "Physical Therapy": "bg-teal-100 text-teal-700",
  "Occupational Therapy": "bg-purple-100 text-purple-700",
  "Speech Therapy": "bg-amber-100 text-amber-700",
};

function isDateInWeek(dateStr, weekStart, weekEnd) {
  if (!dateStr || !weekStart || !weekEnd) return true;
  const d = new Date(dateStr + "T00:00:00");
  const s = new Date(weekStart + "T00:00:00");
  const e = new Date(weekEnd + "T00:00:00");
  return d >= s && d <= e;
}

function buildInitialSchedule(assignment) {
  const weeks = assignment.approved_weekly_visits || [];
  if (weeks.length === 0) return null;
  return weeks.map((w) => ({
    week_label: w.week_label || "",
    week_start: w.week_start || "",
    week_end: w.week_end || "",
    approved_visits: Number(w.approved_visits) || 0,
    dates: Array(Number(w.approved_visits) || 0).fill(""),
  }));
}

function formatSentAt(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export default function AwaitingAcceptance({ assignments, user, therapistId, patients, onRefresh }) {
  const [viewDialog, setViewDialog] = useState(null);
  const [declineDialog, setDeclineDialog] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [scheduleDialog, setScheduleDialog] = useState(null);
  const [weekSchedule, setWeekSchedule] = useState(null);
  const [singleDate, setSingleDate] = useState("");
  const [delayReason, setDelayReason] = useState("");
  const [declineRequired, setDeclineRequired] = useState(false);
  const router = useRouter();

  const myPendingAssignments = assignments.filter(
    (a) =>
      ((therapistId && a.therapist_id === therapistId) || a.therapist_name === user?.full_name) &&
      a.status === "pending"
  );

  const myAcceptedAssignments = assignments.filter(
    (a) =>
      ((therapistId && a.therapist_id === therapistId) || a.therapist_name === user?.full_name) &&
      a.status === "accepted"
  );

  const [submitting, setSubmitting] = useState(false);

  const handleAcceptOnly = async (assignment) => {
    setSubmitting(true);
    try {
      await updateAssignment(assignment.id, { status: "accepted" });
      toast.success(`Accepted referral for ${assignment.patient_name}`);
      onRefresh?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const openScheduleDialog = (assignment) => {
    const schedule = buildInitialSchedule(assignment);
    setWeekSchedule(schedule);
    setDelayReason("");
    if (!schedule) {
      const patient = getPatient(assignment.patient_id);
      const today = new Date().toISOString().split("T")[0];
      const minDate = patient?.cert_period_start || today;
      setSingleDate(minDate > today ? minDate : today);
    }
    setScheduleDialog(assignment);
  };

  const isOutside48h = (dates, referralDate) => {
    if (!referralDate) return false;
    const refTime = new Date(referralDate).getTime();
    const firstDate = dates.find(Boolean);
    if (!firstDate) return false;
    const visitTime = new Date(firstDate + "T00:00:00").getTime();
    return visitTime - refTime > 2 * 24 * 60 * 60 * 1000;
  };

  const allScheduledDates = weekSchedule ? weekSchedule.flatMap((w) => w.dates) : [singleDate];
  const outside48h = scheduleDialog ? isOutside48h(allScheduledDates, scheduleDialog.created_date) : false;
  const totalScheduledVisits = weekSchedule ? weekSchedule.reduce((s, w) => s + w.approved_visits, 0) : 1;

  const handleSchedule = async () => {
    if (!scheduleDialog) return;
    if (outside48h && !delayReason.trim()) {
      toast.error("Please provide a reason for the delay before scheduling.");
      return;
    }
    setSubmitting(true);
    try {
      if (weekSchedule) {
        for (let wi = 0; wi < weekSchedule.length; wi++) {
          const week = weekSchedule[wi];
          for (let di = 0; di < week.dates.length; di++) {
            if (!week.dates[di]) {
              toast.error(`Please fill all dates for ${week.week_label || `Week ${wi + 1}`}`);
              setSubmitting(false);
              return;
            }
            if (week.week_start && week.week_end && !isDateInWeek(week.dates[di], week.week_start, week.week_end)) {
              toast.error(`Date for ${week.week_label || `Week ${wi + 1}`} visit ${di + 1} must be within ${week.week_start} – ${week.week_end}`);
              setSubmitting(false);
              return;
            }
          }
        }
        const allDates = weekSchedule.flatMap(w => w.dates);
        for (const date of allDates) {
          await saveVisitNote({
            patient_id: scheduleDialog.patient_id,
            patient_name: scheduleDialog.patient_name,
            therapist_id: scheduleDialog.therapist_id || therapistId,
            therapist_name: scheduleDialog.therapist_name || user?.full_name,
            therapy_type: scheduleDialog.therapy_type,
            visit_type: "treatment",
            visit_date: date,
            status: "scheduled",
            agency: scheduleDialog.agency,
          });
        }
        await updateAssignment(scheduleDialog.id, { status: "scheduled" });
      } else {
        if (!singleDate) { setSubmitting(false); return; }
        await saveVisitNote({
          patient_id: scheduleDialog.patient_id,
          patient_name: scheduleDialog.patient_name,
          therapist_id: scheduleDialog.therapist_id || therapistId,
          therapist_name: scheduleDialog.therapist_name || user?.full_name,
          therapy_type: scheduleDialog.therapy_type,
          visit_type: scheduleDialog.visit_type || "evaluation",
          visit_date: singleDate,
          status: "scheduled",
          agency: scheduleDialog.agency,
        });
        await updateAssignment(scheduleDialog.id, { status: "scheduled" });
      }
      toast.success("Visits scheduled successfully");
      onRefresh?.();
      setScheduleDialog(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to schedule visits");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!declineDialog) return;
    if (!declineReason.trim()) { setDeclineRequired(true); return; }
    setSubmitting(true);
    try {
      const history = [...(declineDialog.assignment_history || []), {
        therapist_id: declineDialog.therapist_id,
        therapist_name: declineDialog.therapist_name,
        action: "declined",
        reason: declineReason,
        date: new Date().toISOString(),
      }];
      await updateAssignment(declineDialog.id, {
        status: "declined",
        declined_by: user?.full_name,
        declined_reason: declineReason,
        assignment_history: history,
      });
      toast.success("Referral declined and returned to admin");
      onRefresh?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to decline assignment");
    } finally {
      setSubmitting(false);
      setDeclineDialog(null);
      setDeclineReason("");
      setDeclineRequired(false);
    }
  };

  const getPatient = (patientId) => patients.find((p) => p.id === patientId);

  const updateWeekDate = (weekIdx, dateIdx, value) => {
    setWeekSchedule((prev) =>
      prev.map((w, wi) =>
        wi === weekIdx
          ? { ...w, dates: w.dates.map((d, di) => (di === dateIdx ? value : d)) }
          : w
      )
    );
  };

  return (
    <>
      {/* Awaiting Acceptance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-teal-600" />
            Awaiting Acceptance
            <Badge variant="secondary" className="ml-auto">{myPendingAssignments.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myPendingAssignments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No pending referral assignments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myPendingAssignments.map((assignment) => {
                const patient = getPatient(assignment.patient_id);
                const totalApproved = (assignment.approved_weekly_visits || []).reduce(
                  (s, w) => s + (Number(w.approved_visits) || 0), 0
                );
                const sentAt = formatSentAt(assignment.created_date);
                return (
                  <div key={assignment.id} className="p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                    {sentAt && (
                      <p className="text-[10px] text-slate-400 mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Sent: {sentAt}
                      </p>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <div className="font-medium text-slate-900">{assignment.patient_name}</div>
                          <Badge className={therapyColors[assignment.therapy_type]}>
                            {assignment.therapy_type.replace(" Therapy", "")}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {assignment.visit_type === "evaluation" ? "Evaluation" : "Treatment"}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 space-y-0.5">
                          {assignment.agency && <span>{assignment.agency}</span>}
                          {patient?.cert_period_start && patient?.cert_period_end && (
                            <p>Cert: {patient.cert_period_start} → {patient.cert_period_end}</p>
                          )}
                          {totalApproved > 0 && (
                            <p className="text-teal-700 font-medium">
                              {totalApproved} total approved visits · {(assignment.approved_weekly_visits || []).length} weeks
                            </p>
                          )}
                          {assignment.supervising_therapist_name && (
                            <p>Supervisor: {assignment.supervising_therapist_name}</p>
                          )}
                        </div>
                        <Button variant="link" size="sm" className="text-xs px-0 h-auto mt-1" onClick={() => setViewDialog(assignment)}>
                          View Details
                        </Button>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Button size="sm" onClick={() => handleAcceptOnly(assignment)} disabled={submitting} className="bg-green-600 hover:bg-green-700 gap-1 w-full">
                          <Check className="w-3.5 h-3.5" /> Accept
                        </Button>
                        <Button size="sm" onClick={() => openScheduleDialog(assignment)} className="bg-teal-600 hover:bg-teal-700 gap-1 w-full">
                          <Calendar className="w-3.5 h-3.5" /> Accept & Schedule
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setDeclineDialog(assignment); setDeclineRequired(false); }} className="border-red-200 text-red-600 hover:bg-red-50 gap-1 w-full">
                          <X className="w-3.5 h-3.5" /> Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Awaiting Scheduling */}
      {myAcceptedAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Awaiting Scheduling
              <Badge variant="secondary" className="ml-auto">{myAcceptedAssignments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myAcceptedAssignments.map((assignment) => {
                const patient = getPatient(assignment.patient_id);
                const totalApproved = (assignment.approved_weekly_visits || []).reduce(
                  (s, w) => s + (Number(w.approved_visits) || 0), 0
                );
                return (
                  <div key={assignment.id} className="p-3 rounded-lg border border-teal-100 bg-teal-50/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <div className="font-medium text-slate-900">{assignment.patient_name}</div>
                          <Badge className={therapyColors[assignment.therapy_type]}>
                            {assignment.therapy_type.replace(" Therapy", "")}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 space-y-0.5">
                          {assignment.agency && <span>{assignment.agency}</span>}
                          {patient?.cert_period_start && patient?.cert_period_end && (
                            <p>Cert: {patient.cert_period_start} → {patient.cert_period_end}</p>
                          )}
                          {totalApproved > 0 && (
                            <p className="text-teal-700 font-medium">
                              {totalApproved} total approved visits · {(assignment.approved_weekly_visits || []).length} weeks
                            </p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => openScheduleDialog(assignment)} className="bg-teal-600 hover:bg-teal-700 gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Schedule All
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Dialog */}
      {scheduleDialog && (
        <Dialog open={!!scheduleDialog} onOpenChange={() => setScheduleDialog(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule All Visits — {scheduleDialog.patient_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm font-medium text-slate-800">{scheduleDialog.patient_name}</p>
                <p className="text-xs text-slate-500">
                  {scheduleDialog.therapy_type} · Treatment
                  {scheduleDialog.agency ? ` · ${scheduleDialog.agency}` : ""}
                </p>
                {scheduleDialog.supervising_therapist_name && (
                  <p className="text-xs text-slate-500">Supervisor: {scheduleDialog.supervising_therapist_name}</p>
                )}
              </div>

              {/* Supervisor rule info */}
              {scheduleDialog.supervising_therapist_id && (
                <div className="flex items-start gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Every 8th visit (30 day) and the last visit (discharge) will be automatically assigned to <strong>{scheduleDialog.supervising_therapist_name}</strong>.</span>
                </div>
              )}

              {/* 48-hour warning */}
              {outside48h && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-red-700 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Your eval date is outside the 48-hour window. Please provide a reason for the delay.
                  </div>
                  <Textarea
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    placeholder="Reason for scheduling outside 48-hour window..."
                    rows={2}
                    className="bg-white"
                  />
                </div>
              )}

              {weekSchedule ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>All <strong>{totalScheduledVisits} visits</strong> must be scheduled. Dates must fall within the corresponding week range.</span>
                  </div>
                  <div className="space-y-3 mt-2">
                    {weekSchedule.map((week, wi) => {
                      const priorCount = weekSchedule.slice(0, wi).reduce((s, w) => s + w.dates.length, 0);
                      const totalAll = weekSchedule.reduce((s, w) => s + w.dates.length, 0);
                      return (
                        <div key={wi} className="border rounded-lg overflow-hidden">
                          <div className="bg-slate-100 px-3 py-2 flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-sm text-slate-700">{week.week_label || `Week ${wi + 1}`}</span>
                              {week.week_start && week.week_end && (
                                <span className="text-xs text-slate-500 ml-2">{week.week_start} – {week.week_end}</span>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {week.approved_visits} visit{week.approved_visits !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                          <div className="p-3 space-y-2">
                            {week.dates.map((date, di) => {
                              const overallNum = priorCount + di + 1;
                              const isFirst = overallNum === 1;
                              const isLast = overallNum === totalAll;
                              const isReassessment = !isLast && overallNum % 8 === 0;
                              const needsSupervisor = (isLast || isReassessment) && !!scheduleDialog.supervising_therapist_id;
                              return (
                                <div key={di} className="flex items-center gap-3">
                                  <div className="flex flex-col w-28 shrink-0">
                                    <span className="text-xs text-slate-500">Visit {overallNum}</span>
                                    {isFirst && <span className="text-[10px] font-semibold text-blue-600">{(scheduleDialog.visit_type || "treatment").replace(/_/g, " ")} ✓</span>}
                                    {!isFirst && isLast && totalAll > 1 && <span className="text-[10px] font-semibold text-green-600">Discharge ✓</span>}
                                    {isReassessment && <span className="text-[10px] font-semibold text-amber-600">30 Day ✓</span>}
                                    {needsSupervisor && <span className="text-[10px] text-purple-600">→ Supervisor</span>}
                                  </div>
                                  <Input
                                    type="date"
                                    value={date}
                                    min={week.week_start || undefined}
                                    max={week.week_end || undefined}
                                    onChange={(e) => updateWeekDate(wi, di, e.target.value)}
                                    className={`flex-1 h-8 text-sm ${
                                      date && week.week_start && week.week_end && !isDateInWeek(date, week.week_start, week.week_end)
                                        ? "border-red-400"
                                        : ""
                                    }`}
                                  />
                                  {date && week.week_start && week.week_end && !isDateInWeek(date, week.week_start, week.week_end) && (
                                    <span className="text-xs text-red-500 shrink-0">Out of range</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Visit Date</Label>
                  {(() => {
                    const patient = getPatient(scheduleDialog.patient_id);
                    const minDate = patient?.cert_period_start;
                    const maxDate = patient?.cert_period_end;
                    return (
                      <>
                        <Input type="date" value={singleDate} onChange={(e) => setSingleDate(e.target.value)} min={minDate} max={maxDate} />
                        {minDate && maxDate && (
                          <p className="text-xs text-slate-500 mt-1">Auth period: {minDate} → {maxDate}</p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setScheduleDialog(null)}>Cancel</Button>
              <Button onClick={handleSchedule} disabled={submitting} className="bg-green-600 hover:bg-green-700 gap-2">
                <Calendar className="w-4 h-4" />
                {submitting ? "Scheduling..." : `Schedule ${totalScheduledVisits} Visit${totalScheduledVisits !== 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Details Dialog */}
      {viewDialog && (
        <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Referral Details</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm text-slate-500">Patient</Label>
                <p className="font-medium">{viewDialog.patient_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-500">Therapy Type</Label>
                  <Badge className={`${therapyColors[viewDialog.therapy_type]} mt-1`}>{viewDialog.therapy_type}</Badge>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Visit Type</Label>
                  <Badge variant="outline" className="mt-1">{viewDialog.visit_type === "evaluation" ? "Evaluation" : "Treatment"}</Badge>
                </div>
              </div>
              {viewDialog.agency && (
                <div>
                  <Label className="text-sm text-slate-500">Agency</Label>
                  <p className="font-medium">{viewDialog.agency}</p>
                </div>
              )}
              {viewDialog.supervising_therapist_name && (
                <div>
                  <Label className="text-sm text-slate-500">Supervising Therapist</Label>
                  <p className="font-medium">{viewDialog.supervising_therapist_name}</p>
                </div>
              )}
              {viewDialog.approved_weekly_visits?.length > 0 && (
                <div>
                  <Label className="text-sm text-slate-500 mb-2 block">Approved Weekly Visits</Label>
                  <div className="border rounded-lg overflow-hidden text-sm">
                    <div className="grid grid-cols-3 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                      <span>Week</span><span className="text-center">Requested</span><span className="text-center">Approved</span>
                    </div>
                    {viewDialog.approved_weekly_visits.map((w, i) => (
                      <div key={i} className="grid grid-cols-3 px-3 py-1.5 border-t text-xs">
                        <span className="text-slate-700">{w.week_label || `Wk ${i + 1}`}</span>
                        <span className="text-center text-slate-500">{w.requested_visits ?? "—"}</span>
                        <span className="text-center font-semibold text-teal-700">{w.approved_visits ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(() => {
                const patient = getPatient(viewDialog.patient_id);
                return patient ? (
                  <>
                    {patient.cert_period_start && patient.cert_period_end && (
                      <div>
                        <Label className="text-sm text-slate-500">Certification Period</Label>
                        <p className="font-medium">{patient.cert_period_start} to {patient.cert_period_end}</p>
                      </div>
                    )}
                    {patient.authorization_number && (
                      <div>
                        <Label className="text-sm text-slate-500">Authorization Number</Label>
                        <p className="font-medium">{patient.authorization_number}</p>
                      </div>
                    )}
                    {patient.address && (
                      <div>
                        <Label className="text-sm text-slate-500">Address</Label>
                        <a href={`https://maps.apple.com/?q=${encodeURIComponent(`${patient.address} ${patient.city || ""} ${patient.state || ""} ${patient.zip || ""}`.trim())}`} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-600 hover:underline block">
                          {patient.address}{patient.city ? `, ${patient.city}` : ""}{patient.state ? `, ${patient.state}` : ""}
                        </a>
                      </div>
                    )}
                    {patient.phone && (
                      <div>
                        <Label className="text-sm text-slate-500">Phone</Label>
                        <a href={`tel:${patient.phone}`} className="font-medium text-teal-600 hover:underline">{patient.phone}</a>
                      </div>
                    )}
                  </>
                ) : null;
              })()}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialog(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Decline Dialog */}
      {declineDialog && (
        <Dialog open={!!declineDialog} onOpenChange={() => { setDeclineDialog(null); setDeclineRequired(false); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Decline Referral</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm font-medium text-slate-800">{declineDialog.patient_name}</p>
                <p className="text-xs text-slate-500">{declineDialog.therapy_type} · {declineDialog.visit_type === "evaluation" ? "Evaluation" : "Treatment"}</p>
              </div>
              <div>
                <Label className="text-sm text-slate-700 mb-2 block">Reason for Declining <span className="text-red-500">*</span></Label>
                <Textarea
                  value={declineReason}
                  onChange={(e) => { setDeclineReason(e.target.value); setDeclineRequired(false); }}
                  placeholder="e.g., Schedule conflict, outside coverage area, etc."
                  rows={3}
                  className={declineRequired ? "border-red-400" : ""}
                />
                {declineRequired && <p className="text-xs text-red-500 mt-1">A reason is required to decline.</p>}
              </div>
              <p className="text-xs text-slate-400">This referral will be sent back to admin for reassignment.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDeclineDialog(null); setDeclineRequired(false); }}>Cancel</Button>
              <Button onClick={handleDecline} disabled={submitting} variant="destructive">
                {submitting ? "Declining..." : "Decline & Return to Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
