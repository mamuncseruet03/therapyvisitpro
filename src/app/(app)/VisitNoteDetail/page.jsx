"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getVisitNoteById, updateVisitNoteField, getPatientVisits } from "@/lib/api-client/visit-notes";
import { getPatientById } from "@/lib/api-client/patients";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Badge as BadgeIcon, Calendar, Clock, Download, Edit, Lock, MapPin, Stethoscope, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PDFTemplateFiller from "@/components/visits/PDFTemplateFiller";
import TherapyOrdersApproval from "@/components/visits/TherapyOrdersApproval";
import SendPdfDialog from "@/components/shared/SendPdfDialog";

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
const funcLabels = {
  independent: "Independent",
  modified_independent: "Modified Independent",
  supervision: "Supervision",
  minimal_assist: "Minimal Assist",
  moderate_assist: "Moderate Assist",
  maximal_assist: "Maximal Assist",
  dependent: "Dependent",
};

function VisitNoteDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [isDownloading, setIsDownloading] = useState(false);
  const [visitData, setVisitData] = useState(null);
  const [editingVisitType, setEditingVisitType] = useState(false);
  const effectiveUser = useCurrentUser();
  const isAdmin = ["admin", "superuser"].includes(effectiveUser?.role) || ["admin", "superuser"].includes(effectiveUser?.user_type);

  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [visitRaw, setVisitRaw] = useState(null);
  const [patient, setPatient] = useState(null);
  const [allVisits, setAllVisits] = useState([]);

  const loadVisit = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getVisitNoteById(id);
      setVisitRaw(data);
      if (data?.patient_id) {
        const [patientData, pVisits] = await Promise.all([
          getPatientById(data.patient_id),
          getPatientVisits(data.patient_id),
        ]);
        setPatient(patientData);
        setAllVisits(pVisits);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { loadVisit(); }, [loadVisit]);

  const visit = visitData || visitRaw;

  const handleUpdateVisitType = async (newType) => {
    try {
      const result = await updateVisitNoteField(id, "visit_type", newType);
      if (result?.success) {
        setVisitData((prev) => ({ ...(prev || visit), visit_type: newType }));
        setEditingVisitType(false);
        toast.success("Visit type updated");
      }
    } catch (err) {
      toast.error("Failed to update visit type");
    }
  };

  const handleUnlock = async () => {
    try {
      const result = await updateVisitNoteField(id, "status", "draft");
      if (result?.success) {
        setVisitData((prev) => ({ ...(prev || visit), status: "draft" }));
        toast.success("Visit note unlocked and returned to draft status");
      }
    } catch (err) {
      toast.error("Failed to unlock visit note");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      toast.info("PDF generation is not yet implemented");
    } catch (error) {
      toast.error('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20 text-slate-400">Loading…</div>;
  }

  if (!visit) {
    return <div className="flex justify-center py-20 text-slate-400">Visit note not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/VisitNotes">
          <Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Visit Note</h1>
          <p className="text-slate-500 text-sm mt-0.5">{visit.patient_name}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/EditVisitNote?id=${id}`)}
          disabled={visit.status === "completed" || visit.status === "signed"}
          className="gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? 'Downloading...' : 'Download PDF'}
        </Button>
        <SendPdfDialog
          documentName={`visit note for ${visit.patient_name}`}
          defaultSubject={`Visit Note - ${visit.patient_name}`}
        />
        {isAdmin && (visit.status === "completed" || visit.status === "signed") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUnlock()}
            className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
          >
            <Lock className="w-4 h-4" />
            Unlock
          </Button>
        )}
        <Badge className={`text-sm ${statusColor[visit.status] || ""}`}>{visit.status}</Badge>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-6 max-w-4xl">
          {/* Patient Information */}
          {patient && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Date of Birth</p>
                    <p className="font-medium text-sm">{patient.date_of_birth ? format(new Date(patient.date_of_birth), "MMM d, yyyy") : "—"}</p>
                  </div>
                  {patient.city && (
                    <div>
                      <p className="text-xs text-slate-400">City</p>
                      <p className="font-medium text-sm">{patient.city}</p>
                    </div>
                  )}
                  {patient.phone && (
                    <div>
                      <p className="text-xs text-slate-400">Phone</p>
                      <p className="font-medium text-sm">{patient.phone}</p>
                    </div>
                  )}
                  {patient.insurance && (
                    <div>
                      <p className="text-xs text-slate-400">Insurance</p>
                      <p className="font-medium text-sm">{patient.insurance}</p>
                    </div>
                  )}
                  {(patient.diagnoses && patient.diagnoses.length > 0) && (
                    <div className="col-span-2 md:col-span-3">
                      <p className="text-xs text-slate-400">Diagnosis</p>
                      <div className="space-y-1 mt-1">
                        {patient.diagnoses.map((d, i) => (
                          <div key={i} className="text-sm">
                            {d.diagnosis} {d.icd10_code && <span className="text-slate-500">({d.icd10_code})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Episode Information */}
          {patient && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Episode Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {patient.cert_period_start && (
                    <div>
                      <p className="text-xs text-slate-400">Cert Period Start</p>
                      <p className="font-medium text-sm">{format(new Date(patient.cert_period_start), "MMM d, yyyy")}</p>
                    </div>
                  )}
                  {patient.cert_period_end && (
                    <div>
                      <p className="text-xs text-slate-400">Cert Period End</p>
                      <p className="font-medium text-sm">{format(new Date(patient.cert_period_end), "MMM d, yyyy")}</p>
                    </div>
                  )}
                  {patient.authorization_number && (
                    <div>
                      <p className="text-xs text-slate-400">Authorization #</p>
                      <p className="font-medium text-sm">{patient.authorization_number}</p>
                    </div>
                  )}
                  {patient.authorized_visits && (
                    <div>
                      <p className="text-xs text-slate-400">Authorized Visits</p>
                      <p className="font-medium text-sm">{patient.authorized_visits}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-400">Completed Visits</p>
                    <p className="font-medium text-sm">{allVisits.filter(v => v.status !== 'draft').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visit Info */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Patient</p>
                    <p className="font-medium text-sm">{visit.patient_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Therapist</p>
                    <p className="font-medium text-sm">{visit.therapist_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Date</p>
                    <p className="font-medium text-sm">{visit.visit_date ? format(new Date(visit.visit_date), "MMMM d, yyyy") : "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={therapyColor[visit.therapy_type]}>{visit.therapy_type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-xs text-slate-400">Visit Type</p>
                    {isAdmin && editingVisitType ? (
                      <select
                        autoFocus
                        className="text-sm border rounded px-2 py-1 mt-0.5"
                        defaultValue={visit.visit_type}
                        onChange={(e) => handleUpdateVisitType(e.target.value)}
                        onBlur={() => setEditingVisitType(false)}
                      >
                        <option value="evaluation">Evaluation</option>
                        <option value="treatment">Treatment</option>
                        <option value="re_evaluation">Re-evaluation</option>
                        <option value="recertification">Recertification</option>
                        <option value="discharge_with_visit">Discharge with Visit</option>
                        <option value="discharge_without_visit">Discharge without Visit</option>
                        <option value="eval_refused">Eval Refused</option>
                        <option value="missed_visit">Missed Visit</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-1">
                        <p className="font-medium text-sm capitalize">{(visit.visit_type || "—").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
                        {isAdmin && (
                          <button onClick={() => setEditingVisitType(true)} className="text-slate-400 hover:text-teal-600 text-xs underline ml-1">edit</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Duration</p>
                    <p className="font-medium text-sm">{visit.duration_minutes} min</p>
                  </div>
                </div>
                {(visit.agency || patient?.agency) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400">Agency</p>
                      <p className="font-medium text-sm">{visit.agency || patient?.agency}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SOAP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Subjective", value: visit.subjective, color: "border-l-teal-500" },
              { label: "Objective", value: visit.objective, color: "border-l-blue-500" },
              { label: "Assessment", value: visit.assessment, color: "border-l-amber-500" },
              { label: "Plan", value: visit.plan, color: "border-l-violet-500" },
            ].map((s) => (
              <Card key={s.label} className={`border-l-4 ${s.color}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">{s.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{s.value || "—"}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Goals, Interventions, CPT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(visit.goals_addressed || []).length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Goals Addressed</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {visit.goals_addressed.map((g, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {(visit.interventions || []).length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Interventions</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {visit.interventions.map((g, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {(visit.cpt_codes || []).length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">CPT Codes</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {visit.cpt_codes.map((c) => (
                      <Badge key={c} variant="outline" className="font-mono text-xs">{c}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Vitals */}
          {visit.vitals && Object.values(visit.vitals).some(v => v) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Vital Signs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {visit.vitals.blood_pressure && (
                    <div>
                      <p className="text-xs text-slate-400">Blood Pressure</p>
                      <p className="font-medium text-sm">{visit.vitals.blood_pressure}</p>
                    </div>
                  )}
                  {visit.vitals.heart_rate && (
                    <div>
                      <p className="text-xs text-slate-400">Heart Rate</p>
                      <p className="font-medium text-sm">{visit.vitals.heart_rate} bpm</p>
                    </div>
                  )}
                  {visit.vitals.respiratory_rate && (
                    <div>
                      <p className="text-xs text-slate-400">Respiratory Rate</p>
                      <p className="font-medium text-sm">{visit.vitals.respiratory_rate} rpm</p>
                    </div>
                  )}
                  {visit.vitals.temperature && (
                    <div>
                      <p className="text-xs text-slate-400">Temperature</p>
                      <p className="font-medium text-sm">{visit.vitals.temperature}°F</p>
                    </div>
                  )}
                  {visit.vitals.oxygen_saturation && (
                    <div>
                      <p className="text-xs text-slate-400">O₂ Saturation</p>
                      <p className="font-medium text-sm">{visit.vitals.oxygen_saturation}%</p>
                    </div>
                  )}
                  {visit.vitals.pain_level !== undefined && visit.vitals.pain_level !== null && visit.vitals.pain_level !== "" && (
                    <div>
                      <p className="text-xs text-slate-400">Pain Level</p>
                      <p className="font-medium text-sm">{visit.vitals.pain_level}/10</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* PDF Template Filler */}
          {visit && (
            <PDFTemplateFiller
              visit={visit}
              onUpdate={(updated) => {
                setVisitData(updated);
              }}
            />
          )}

          {/* Additional Info */}
          {(visit.patient_response || visit.functional_status) && (
            <Card>
              <CardContent className="p-6 space-y-3">
                {visit.patient_response && (
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Patient Response</p>
                    <p className="text-sm text-slate-600 mt-1">{visit.patient_response}</p>
                  </div>
                )}
                {visit.functional_status && (
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Functional Status</p>
                    <Badge variant="outline" className="mt-1">{funcLabels[visit.functional_status] || visit.functional_status}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Episode Calendar Sidebar */}
        {patient && patient.cert_period_start && (
          <div className="w-full shrink-0 xl:w-80">
            <Card className="sticky top-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Episode Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-xs text-slate-500">
                    {patient.cert_period_start && patient.cert_period_end && (
                      <p>
                        {format(new Date(patient.cert_period_start), "MMM d")} - {format(new Date(patient.cert_period_end), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {allVisits
                      .filter(v => v.visit_date)
                      .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))
                      .map((v) => (
                        <Link
                          key={v.id}
                          href={`/VisitNoteDetail?id=${v.id}`}
                          className={`block p-2 rounded-lg border transition-colors ${
                            v.id === id
                              ? "bg-teal-50 border-teal-200"
                              : "bg-white hover:bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-900">
                                {format(new Date(v.visit_date), "MMM d, yyyy")}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">{v.therapy_type}</p>
                              {v.visit_type && (
                                <p className="text-[11px] text-slate-400">
                                  {v.visit_type
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (character) => character.toUpperCase())}
                                </p>
                              )}
                              </div>
                              <Badge
                              variant="outline"
                              className={`text-[10px] ${statusColor[v.status] || ""}`}
                              >
                              {v.status}
                              </Badge>
                              </div>
                              </Link>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Therapy Orders panel - only for evaluations */}
            {visit.visit_type === "evaluation" && (
              <TherapyOrdersApproval visit={visit} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VisitNoteDetail() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20 text-slate-400">Loading…</div>}>
      <VisitNoteDetailContent />
    </Suspense>
  );
}
