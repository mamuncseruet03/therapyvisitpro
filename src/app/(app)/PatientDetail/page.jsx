"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPatientById } from "@/lib/api-client/patients";
import { getPatientVisits } from "@/lib/api-client/visit-notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Activity,
  Phone,
  Shield,
  Clock,
  User,
  ClipboardList,
  MessageSquare,
  Pencil,
  BadgeCheck,
  ChevronRight,
  Printer,
  Plus,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CommunicationNotes from "@/components/patients/CommunicationNotes";
import { format } from "date-fns";

export default function PatientDetailPage() {
  return <Suspense fallback={<div className="py-12 text-center text-slate-400">Loading...</div>}><PatientDetail /></Suspense>;
}

function PatientDetail() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const [showCommNotes, setShowCommNotes] = useState(false);

  const [patient, setPatient] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [visitNotes, setVisitNotes] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(true);

  const loadPatient = useCallback(async () => {
    if (!patientId) { setLoadingPatient(false); setLoadingVisits(false); return; }
    try {
      const [patientData, visitsData] = await Promise.all([
        getPatientById(patientId),
        getPatientVisits(patientId),
      ]);
      setPatient(patientData);
      setVisitNotes(visitsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPatient(false);
      setLoadingVisits(false);
    }
  }, [patientId]);

  useEffect(() => { loadPatient(); }, [loadPatient]);

  if (loadingPatient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading patient...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-slate-400 mb-4">Patient not found</div>
        <Link href="/Patients">
          <Button variant="outline">Back to Patients</Button>
        </Link>
      </div>
    );
  }

  const statusColors = {
    active: "bg-green-100 text-green-800",
    discharged: "bg-slate-100 text-slate-800",
    on_hold: "bg-yellow-100 text-yellow-800",
  };

  const therapyColors = {
    "Physical Therapy": "bg-blue-100 text-blue-800",
    "Occupational Therapy": "bg-purple-100 text-purple-800",
    "Speech Therapy": "bg-orange-100 text-orange-800",
  };

  const visitStatusColors = {
    draft: "bg-yellow-100 text-yellow-800",
    completed: "bg-blue-100 text-blue-800",
    signed: "bg-green-100 text-green-800",
  };

  const totalVisits = visitNotes.length;
  const completedVisits = visitNotes.filter(v => v.status === "completed" || v.status === "signed").length;

  const patientTherapies = patient?.therapy_types || [];
  const allTherapies = ["Physical Therapy", "Occupational Therapy", "Speech Therapy"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/Patients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-sm text-slate-500">Patient Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/NewVisitNote?patientId=${patientId}`}>
            <Button className="bg-teal-600 hover:bg-teal-700 gap-2"><Plus className="w-4 h-4" /> New Visit Note</Button>
          </Link>
          <Badge className={statusColors[patient.status]}>{patient.status?.replace("_", " ")}</Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <FileText className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{totalVisits}</div>
                <div className="text-xs text-slate-500">Total Visits</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{completedVisits}</div>
                <div className="text-xs text-slate-500">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {patient.authorized_visits || "—"}
                </div>
                <div className="text-xs text-slate-500">Authorized</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {patient.insurance || "—"}
                </div>
                <div className="text-xs text-slate-500">Insurance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Therapy Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {allTherapies.map((therapy) => {
                const isActive = patientTherapies.includes(therapy);
                return isActive ? (
                  <Link
                    key={therapy}
                    href={`/PatientTherapyDetail?patientId=${patientId}&therapyType=${therapy}`}
                    className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all bg-slate-50 text-slate-700 hover:bg-teal-50 hover:text-teal-700 border border-transparent hover:border-teal-200"
                  >
                    {therapy.replace(" Therapy", "")}
                  </Link>
                ) : (
                  <div
                    key={therapy}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium bg-slate-50 text-slate-300 cursor-not-allowed"
                  >
                    {therapy.replace(" Therapy", "")}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Action Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {[
                  { label: "Referral Detail", icon: ClipboardList, href: `/Patients?referral=${patientId}` },
                  { label: "Edit Patient Detail", icon: Pencil, href: `/Patients?edit=${patientId}` },
                  { label: "Authorizations", icon: BadgeCheck, href: `/Patients?auth=${patientId}` },
                ].map(({ label, icon: Icon, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center justify-between px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-50" />
                  </Link>
                ))}
                <button
                  onClick={() => setShowCommNotes(true)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4" />
                    <span>Communication Notes</span>
                  </div>
                  <ChevronRight className="w-3 h-3 opacity-50" />
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Printer className="w-4 h-4" />
                    <span>Print Chart</span>
                  </div>
                  <ChevronRight className="w-3 h-3 opacity-50" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Information */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Demographics */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-500 mb-1">Date of Birth</div>
                <div className="text-sm font-medium">
                  {patient.date_of_birth ? format(new Date(patient.date_of_birth), "MMM d, yyyy") : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Sex</div>
                <div className="text-sm font-medium capitalize">{patient.sex || "—"}</div>
              </div>
            </div>

            {(patient.ssn || patient.medicare_number) && (
              <div className="grid grid-cols-2 gap-3">
                {patient.ssn && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">SSN</div>
                    <div className="text-sm font-mono">***-**-{patient.ssn.slice(-4)}</div>
                  </div>
                )}
                {patient.medicare_number && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Medicare #</div>
                    <div className="text-sm font-mono">{patient.medicare_number}</div>
                  </div>
                )}
              </div>
            )}

            {/* Contact */}
            <div className="border-t pt-3">
              <div className="text-xs font-semibold text-slate-600 mb-2">Contact</div>
              <div className="grid grid-cols-2 gap-3">
                {patient.phone && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Phone</div>
                    <a href={`tel:${patient.phone}`} className="flex items-center gap-1 text-sm text-teal-600 hover:underline"><Phone className="w-3 h-3" />{patient.phone}</a>
                  </div>
                )}
                {patient.email && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Email</div>
                    <div className="text-sm">{patient.email}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            {(patient.address || patient.city) && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Address</div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([patient.address, patient.city, patient.state, patient.zip].filter(Boolean).join(", "))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-teal-600 hover:underline"
                >
                  {patient.address && <div>{patient.address}</div>}
                  {(patient.city || patient.state || patient.zip) && (
                    <div>{[patient.city, patient.state, patient.zip].filter(Boolean).join(", ")}</div>
                  )}
                </a>
              </div>
            )}

            {/* Responsible Party */}
            {patient.responsible_party_name && (
              <div className="border-t pt-3">
                <div className="text-xs font-semibold text-slate-600 mb-2">Responsible Party</div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">{patient.responsible_party_name}</div>
                  {patient.responsible_party_relationship && <div className="text-xs text-slate-500">{patient.responsible_party_relationship}</div>}
                  {patient.responsible_party_phone && (
                    <a href={`tel:${patient.responsible_party_phone}`} className="flex items-center gap-1 text-sm text-teal-600 hover:underline"><Phone className="w-3 h-3" />{patient.responsible_party_phone}</a>
                  )}
                </div>
              </div>
            )}

            {/* Physicians */}
            {(patient.primary_physician || patient.referring_physician) && (
              <div className="border-t pt-3">
                <div className="text-xs font-semibold text-slate-600 mb-2">Physicians</div>
                <div className="space-y-2">
                  {patient.primary_physician && (
                    <div>
                      <div className="text-xs text-slate-500">Primary Physician</div>
                      <div className="text-sm font-medium">{patient.primary_physician}</div>
                      {patient.primary_physician_phone && <a href={`tel:${patient.primary_physician_phone}`} className="flex items-center gap-1 text-xs text-teal-600 hover:underline"><Phone className="w-3 h-3" />{patient.primary_physician_phone}</a>}
                    </div>
                  )}
                  {patient.referring_physician && (
                    <div>
                      <div className="text-xs text-slate-500">Referring Physician</div>
                      <div className="text-sm font-medium">{patient.referring_physician}</div>
                      {patient.referring_physician_phone && <a href={`tel:${patient.referring_physician_phone}`} className="flex items-center gap-1 text-xs text-teal-600 hover:underline"><Phone className="w-3 h-3" />{patient.referring_physician_phone}</a>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Agency & Insurance */}
            <div className="border-t pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Agency</div>
                  <div className="text-sm font-medium">{patient.agency || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Insurance</div>
                  <div className="text-sm font-medium">{patient.insurance || "—"}</div>
                </div>
              </div>
            </div>

            {/* Therapy Types */}
            <div>
              <div className="text-xs text-slate-500 mb-1">Therapy Types</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {(patient.therapy_types || []).map((type, idx) => (
                  <Badge key={idx} variant="outline" className={therapyColors[type]}>{type}</Badge>
                ))}
                {(!patient.therapy_types || patient.therapy_types.length === 0) && <span className="text-sm text-slate-400">—</span>}
              </div>
            </div>

            {/* Therapists */}
            {(patient.evaluating_therapist_pt || patient.treating_therapist_pt || patient.evaluating_therapist_ot || patient.treating_therapist_ot || patient.evaluating_therapist_st || patient.treating_therapist_st) && (
              <div className="border-t pt-3">
                <div className="text-xs font-semibold text-slate-600 mb-2">Assigned Therapists</div>
                <div className="space-y-2">
                  {(patient.evaluating_therapist_pt || patient.treating_therapist_pt) && (
                    <div>
                      <div className="text-xs text-blue-600 font-medium mb-1">Physical Therapy</div>
                      {patient.evaluating_therapist_pt && <div className="text-xs text-slate-500">Eval: <span className="text-slate-700">{patient.evaluating_therapist_pt}</span></div>}
                      {patient.treating_therapist_pt && <div className="text-xs text-slate-500">Treating: <span className="text-slate-700">{patient.treating_therapist_pt}</span></div>}
                    </div>
                  )}
                  {(patient.evaluating_therapist_ot || patient.treating_therapist_ot) && (
                    <div>
                      <div className="text-xs text-purple-600 font-medium mb-1">Occupational Therapy</div>
                      {patient.evaluating_therapist_ot && <div className="text-xs text-slate-500">Eval: <span className="text-slate-700">{patient.evaluating_therapist_ot}</span></div>}
                      {patient.treating_therapist_ot && <div className="text-xs text-slate-500">Treating: <span className="text-slate-700">{patient.treating_therapist_ot}</span></div>}
                    </div>
                  )}
                  {(patient.evaluating_therapist_st || patient.treating_therapist_st) && (
                    <div>
                      <div className="text-xs text-orange-600 font-medium mb-1">Speech Therapy</div>
                      {patient.evaluating_therapist_st && <div className="text-xs text-slate-500">Eval: <span className="text-slate-700">{patient.evaluating_therapist_st}</span></div>}
                      {patient.treating_therapist_st && <div className="text-xs text-slate-500">Treating: <span className="text-slate-700">{patient.treating_therapist_st}</span></div>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Diagnoses */}
            {patient.diagnoses && patient.diagnoses.length > 0 && (
              <div className="border-t pt-3">
                <div className="text-xs text-slate-500 mb-1">Diagnoses</div>
                <div className="space-y-1">
                  {patient.diagnoses.map((d, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">{d.diagnosis}</span>
                      {d.icd10_code && <span className="text-slate-500 ml-2">({d.icd10_code})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Episode */}
            {(patient.cert_period_start || patient.cert_period_end || patient.authorization_number) && (
              <div className="border-t pt-3">
                <div className="text-xs font-semibold text-slate-600 mb-2">Current Episode</div>
                <div className="space-y-2">
                  {(patient.cert_period_start || patient.cert_period_end) && (
                    <div>
                      <div className="text-xs text-slate-500">Cert Period</div>
                      <div className="text-sm">
                        {patient.cert_period_start && format(new Date(patient.cert_period_start), "MMM d, yyyy")}
                        {" – "}
                        {patient.cert_period_end && format(new Date(patient.cert_period_end), "MMM d, yyyy")}
                      </div>
                    </div>
                  )}
                  {patient.authorization_number && (
                    <div>
                      <div className="text-xs text-slate-500">Authorization #</div>
                      <div className="text-sm font-mono">{patient.authorization_number}</div>
                    </div>
                  )}
                  {patient.authorized_visits && (
                    <div>
                      <div className="text-xs text-slate-500">Authorized Visits</div>
                      <div className="text-sm">{completedVisits} of {patient.authorized_visits} completed</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Visit Breakdown */}
            {(patient.pt_eval_visits || patient.pt_treatment_visits || patient.ot_eval_visits || patient.ot_treatment_visits || patient.st_eval_visits || patient.st_treatment_visits) && (
              <div className="border-t pt-3">
                <div className="text-xs font-semibold text-slate-600 mb-2">Visit Breakdown</div>
                <div className="space-y-1">
                  {(patient.pt_eval_visits || patient.pt_treatment_visits) && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">PT</span>
                      <span>Eval: {patient.pt_eval_visits || 0} | Tx: {patient.pt_treatment_visits || 0}</span>
                    </div>
                  )}
                  {(patient.ot_eval_visits || patient.ot_treatment_visits) && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">OT</span>
                      <span>Eval: {patient.ot_eval_visits || 0} | Tx: {patient.ot_treatment_visits || 0}</span>
                    </div>
                  )}
                  {(patient.st_eval_visits || patient.st_treatment_visits) && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">ST</span>
                      <span>Eval: {patient.st_eval_visits || 0} | Tx: {patient.st_treatment_visits || 0}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {patient.notes && (
              <div className="border-t pt-3">
                <div className="text-xs text-slate-500 mb-1">Notes</div>
                <div className="text-sm text-slate-600 whitespace-pre-wrap">{patient.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visit History */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Recent Visit History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVisits ? (
              <div className="text-sm text-slate-400 py-8 text-center">Loading visits...</div>
            ) : visitNotes.length === 0 ? (
              <div className="text-sm text-slate-400 py-8 text-center">No visit notes yet</div>
            ) : (
              <div className="space-y-3">
                {visitNotes.slice(0, 10).map((visit) => (
                  <Link
                    key={visit.id}
                    href={`/VisitNoteDetail?id=${visit.id}`}
                    className="block border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={therapyColors[visit.therapy_type]}>
                          {visit.therapy_type}
                        </Badge>
                        <Badge variant="outline" className={visitStatusColors[visit.status]}>
                          {visit.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(visit.visit_date), "MMM d, yyyy")}
                      </div>
                    </div>

                    <div className="text-sm font-medium text-slate-900 mb-1">
                      {visit.visit_type?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </div>

                    <div className="text-xs text-slate-500">
                      Therapist: {visit.therapist_name || "—"}
                    </div>

                    {visit.duration_minutes && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <Clock className="w-3 h-3" />
                        {visit.duration_minutes} minutes
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Communication Notes Dialog */}
      <Dialog open={showCommNotes} onOpenChange={setShowCommNotes}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              Communication Notes — {patient?.first_name} {patient?.last_name}
            </DialogTitle>
          </DialogHeader>
          <CommunicationNotes
            patientId={patientId}
            patientName={`${patient.first_name} ${patient.last_name}`}
            coordinatorEmail={patient.coordinator_email}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
