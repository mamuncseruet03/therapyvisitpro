"use server";

import { createVitalAlert } from "@/lib/vital-alerts";
import { NO_THERA_DOCS_MESSAGE } from "@/lib/agency-preferences";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/audit/logger";
import { CPT_REQUIRED_MESSAGE, hasCptCode, requiresCptCode } from "@/lib/visit-billing";

const THERAPY_DISPLAY = {
  PHYSICAL_THERAPY: "Physical Therapy",
  OCCUPATIONAL_THERAPY: "Occupational Therapy",
  SPEECH_THERAPY: "Speech Therapy",
};

const THERAPY_ENUM = {
  "Physical Therapy": "PHYSICAL_THERAPY",
  "Occupational Therapy": "OCCUPATIONAL_THERAPY",
  "Speech Therapy": "SPEECH_THERAPY",
};

const VISIT_TYPE_MAP = {
  evaluation: "EVALUATION",
  treatment: "TREATMENT",
  re_evaluation: "RE_EVALUATION",
  recertification: "RECERTIFICATION",
  // Existing Base44-style notes expose both discharge enum variants as the
  // generic UI value "discharge". Preserve the common with-visit variant when
  // those notes are edited or autosaved.
  discharge: "DISCHARGE_WITH_VISIT",
  discharge_with_visit: "DISCHARGE_WITH_VISIT",
  discharge_without_visit: "DISCHARGE_WITHOUT_VISIT",
  eval_refused: "EVAL_REFUSED",
  missed_visit: "MISSED_VISIT",
};

const VISIT_TYPE_DISPLAY = {
  ...Object.fromEntries(Object.entries(VISIT_TYPE_MAP).map(([k, v]) => [v, k])),
  DISCHARGE_WITH_VISIT: "discharge",
  DISCHARGE_WITHOUT_VISIT: "discharge",
};

function toSnakeCase(note) {
  const storedDocuments = note.documents && typeof note.documents === "object" && !Array.isArray(note.documents)
    ? note.documents
    : {};
  const formSnapshot = storedDocuments.formSnapshot && typeof storedDocuments.formSnapshot === "object"
    ? storedDocuments.formSnapshot
    : {};
  const { formSnapshot: _storedSnapshot, ...publicDocuments } = storedDocuments;
  return {
    ...formSnapshot,
    id: note.id,
    patient_id: note.patientId,
    patient_name: note.patientName,
    therapist_id: note.therapistId,
    therapist_name: note.therapistName,
    visit_date: note.visitDate?.toISOString?.().split("T")[0] ?? note.visitDate,
    therapy_type: THERAPY_DISPLAY[note.therapyType] || note.therapyType,
    visit_type: VISIT_TYPE_DISPLAY[note.visitType] || note.visitType?.toLowerCase() || null,
    agency_id: note.agencyId,
    status: note.status?.toLowerCase(),
    duration_minutes: note.durationMinutes ?? formSnapshot.duration_minutes ?? null,
    time_in: note.timeTracking?.timeIn || formSnapshot.time_in || null,
    time_out: note.timeTracking?.timeOut || formSnapshot.time_out || null,
    non_billable: note.nonBillable,
    special_price: note.specialPrice ? Number(note.specialPrice) : null,
    cpt_codes: note.cptCodes || [],
    include_soc_oasis: note.includeSocOasis,
    include_roc_oasis: note.includeRocOasis,
    require_discharge_oasis: note.requireDischargeOasis,
    include_nomnc: note.includeNomnc,
    treatment_approved: note.treatmentApproved,
    treatment_approved_date: note.treatmentApprovedDate?.toISOString?.() || null,
    vitals: note.vitals || null,
    pain_assessment: note.painAssessment || null,
    subjective_data: note.subjectiveData || null,
    objective_data: note.objectiveData || null,
    mobility_data: note.mobilityData || null,
    adl_data: note.adlData || null,
    soap_notes: note.soapNotes || null,
    assessment_data: note.assessmentData || null,
    goals_plan: note.goalsPlan || null,
    therapy_orders: formSnapshot.therapy_orders ?? note.therapyOrders ?? null,
    dc_plan_education: note.dcPlanEducation || null,
    nomnc_data: note.nomncData || null,
    discharge_data: note.dischargeData || null,
    reeval_data: note.reevalData || null,
    signatures: note.signatures || null,
    time_tracking: note.timeTracking || null,
    documents: Object.keys(publicDocuments).length > 0 ? publicDocuments : null,
    visit_diagnoses: note.visitDiagnoses || null,
    medical_diagnoses: formSnapshot.medical_diagnoses ?? note.visitDiagnoses?.medicalDiagnoses ?? note.visitDiagnoses?.medical_diagnoses ?? [],
    treatment_diagnoses: formSnapshot.treatment_diagnoses ?? note.visitDiagnoses?.treatmentDiagnoses ?? note.visitDiagnoses?.treatment_diagnoses ?? [],
    patient_id_method: note.patientIdMethod || null,
    patient_identification: formSnapshot.patient_identification ?? note.patientIdMethod ?? null,
    adl_grid: formSnapshot.adl_grid || note.adlData?.adlGrid || note.adlData?.adl_grid || {},
    condition_notes: formSnapshot.condition_notes || note.adlData?.conditionNotes || note.adlData?.condition_notes || "",
    mobility_bed: formSnapshot.mobility_bed ?? note.mobilityData?.bedMobility ?? {},
    mobility_transfers: formSnapshot.mobility_transfers ?? note.mobilityData?.transfers ?? {},
    ambulation_level: formSnapshot.ambulation_level ?? note.mobilityData?.ambulationLevel ?? "",
    ambulation_device: formSnapshot.ambulation_device ?? note.mobilityData?.ambulationDevice ?? "",
    ambulation_distance: formSnapshot.ambulation_distance ?? note.mobilityData?.ambulationDistance ?? "",
    weight_bearing: formSnapshot.weight_bearing ?? note.mobilityData?.weightBearing ?? {},
    weight_bearing_notes: formSnapshot.weight_bearing_notes ?? note.mobilityData?.weightBearingNotes ?? "",
    ambulation_notes: formSnapshot.ambulation_notes ?? note.mobilityData?.ambulationNotes ?? "",
    balance_assessment: formSnapshot.balance_assessment ?? note.mobilityData?.balanceAssessment ?? {},
    mobility_notes: formSnapshot.mobility_notes ?? note.mobilityData?.mobilityNotes ?? "",
    oasis_data: note.oasisData || null,
    pta_supervision: note.ptaSupervision || null,
    missed_visit_data: note.missedVisitData || null,
    subjective: formSnapshot.subjective ?? note.subjectiveData?.subjective ?? note.soapNotes?.subjective ?? "",
    objective: formSnapshot.objective ?? note.objectiveData?.objective ?? note.soapNotes?.objective ?? "",
    assessment: formSnapshot.assessment ?? note.soapNotes?.assessment ?? "",
    plan: formSnapshot.plan ?? note.soapNotes?.plan ?? "",
    medical_history: formSnapshot.medical_history ?? note.subjectiveData?.medicalHistory ?? "",
    past_surgical_history: formSnapshot.past_surgical_history ?? note.subjectiveData?.pastSurgicalHistory ?? "",
    prior_function: formSnapshot.prior_function ?? note.subjectiveData?.priorFunction ?? "",
    living_environment: formSnapshot.living_environment ?? note.subjectiveData?.livingEnvironment ?? "",
    homebound_reasons: formSnapshot.homebound_reasons ?? note.subjectiveData?.homeboundReasons ?? [],
    homebound_other: formSnapshot.homebound_other ?? note.subjectiveData?.homeboundOther ?? null,
    therapy_objective_patient_goals: formSnapshot.therapy_objective_patient_goals ?? note.subjectiveData?.therapyObjectivePatientGoals ?? "",
    precautions: formSnapshot.precautions ?? note.subjectiveData?.precautions ?? "",
    medication_changes: formSnapshot.medication_changes ?? note.subjectiveData?.medicationChanges ?? "",
    rom_evaluation: formSnapshot.rom_evaluation ?? note.objectiveData?.romEvaluation ?? {},
    strength_evaluation: formSnapshot.strength_evaluation ?? note.objectiveData?.strengthEvaluation ?? {},
    gait_analysis: formSnapshot.gait_analysis ?? note.objectiveData?.gaitAnalysis ?? "",
    standardized_testing: formSnapshot.standardized_testing ?? note.assessmentData?.standardizedTesting ?? "",
    standardized_tests: formSnapshot.standardized_tests ?? note.assessmentData?.standardizedTests ?? [],
    goals_addressed: formSnapshot.goals_addressed ?? note.goalsPlan?.goalsAddressed ?? [],
    interventions: formSnapshot.interventions ?? note.goalsPlan?.interventions ?? [],
    patient_response: formSnapshot.patient_response ?? note.goalsPlan?.patientResponse ?? "",
    functional_status: formSnapshot.functional_status ?? note.goalsPlan?.functionalStatus ?? "",
    eval_treatment_goals: formSnapshot.eval_treatment_goals ?? note.goalsPlan?.evalTreatmentGoals ?? [{ goal: "", interventions: [], functional_status: "" }],
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  };
}

function jsonSafe(data) {
  if (data === null || data === undefined) return undefined;
  return JSON.parse(JSON.stringify(data));
}

export async function getVisitNotes() {
  const user = await requireAuth();

  const notes = await prisma.visitNote.findMany({
    where: user.userType === "THERAPIST"
      ? { therapistId: user.therapistId || "__unlinked_therapist__" }
      : undefined,
    orderBy: { visitDate: "desc" },
    select: {
      id: true,
      patientId: true,
      patientName: true,
      therapistId: true,
      therapistName: true,
      visitDate: true,
      therapyType: true,
      visitType: true,
      status: true,
      durationMinutes: true,
      agencyId: true,
      createdAt: true,
    },
  });

  return notes.map((n) => ({
    id: n.id,
    patient_id: n.patientId,
    patient_name: n.patientName,
    therapist_id: n.therapistId,
    therapist_name: n.therapistName,
    visit_date: n.visitDate?.toISOString?.().split("T")[0],
    therapy_type: THERAPY_DISPLAY[n.therapyType] || n.therapyType,
    visit_type: VISIT_TYPE_DISPLAY[n.visitType] || n.visitType?.toLowerCase() || null,
    status: n.status?.toLowerCase(),
    duration_minutes: n.durationMinutes,
    agency_id: n.agencyId,
    created_at: n.createdAt,
  }));
}

export async function getVisitNoteById(id) {
  const user = await requireAuth();

  const note = await prisma.visitNote.findUnique({ where: { id } });
  if (!note) return null;
  if (user.userType === "THERAPIST" && note.therapistId !== user.therapistId) return null;

  return toSnakeCase(note);
}

export async function getVisitFormData() {
  const user = await requireAuth();

  const [patients, therapists, agencies] = await Promise.all([
    prisma.patient.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        agencyId: true,
        agency: { select: { name: true } },
        therapyTypes: true,
        diagnoses: true,
        authorizationNumber: true,
        certPeriodStart: true,
        certPeriodEnd: true,
      },
      orderBy: { lastName: "asc" },
    }),
    prisma.therapist.findMany({
      where: {
        status: "ACTIVE",
        ...(user.userType === "THERAPIST"
          ? { id: user.therapistId || "__unlinked_therapist__" }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        discipline: true,
        credentials: true,
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.agency.findMany({
      select: { id: true, name: true, documentMode: true, vitalSignsConfig: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    patients: patients.map((p) => ({
      id: p.id,
      first_name: p.firstName,
      last_name: p.lastName,
      agency_id: p.agencyId,
      agency: p.agency?.name ?? null,
      therapy_types: p.therapyTypes,
      diagnoses: p.diagnoses,
      authorization_number: p.authorizationNumber,
      cert_period_start: p.certPeriodStart?.toISOString?.().split("T")[0] ?? null,
      cert_period_end: p.certPeriodEnd?.toISOString?.().split("T")[0] ?? null,
    })),
    therapists: therapists.map((t) => ({
      id: t.id,
      full_name: t.fullName,
      discipline: THERAPY_DISPLAY[t.discipline] || t.discipline,
      credentials: t.credentials,
    })),
    agencies: agencies.map((a) => ({
      id: a.id,
      name: a.name,
      preferences: a.vitalSignsConfig?.agency_preferences,
      vital_signs_config: a.vitalSignsConfig,
      document_mode: a.documentMode?.toLowerCase() || "theradocs",
    })),
  };
}

export async function saveVisitNote(data) {
  const user = await requireAuth();

  if (!["SUPERUSER", "ADMIN", "THERAPIST"].includes(user.userType)) {
    throw new Error("Forbidden");
  }

  if (user.userType === "THERAPIST") {
    if (!user.therapistId || data.therapist_id !== user.therapistId) {
      throw new Error("Forbidden: therapists can only document their own visits");
    }
    if (data.id) {
      const ownedNote = await prisma.visitNote.findUnique({
        where: { id: data.id },
        select: { therapistId: true },
      });
      if (!ownedNote || ownedNote.therapistId !== user.therapistId) {
        throw new Error("Forbidden: visit note is assigned to another therapist");
      }
    }
  }

  // Dashboard order approval intentionally sends only these fields. Treat it
  // as a narrow patch instead of rebuilding the entire required VisitNote
  // payload with undefined patient/therapist/date values.
  if (data.id && data.treatment_approved !== undefined && !data.patient_id) {
    await prisma.visitNote.update({
      where: { id: data.id },
      data: {
        treatmentApproved: Boolean(data.treatment_approved),
        treatmentApprovedDate: data.treatment_approved_date
          ? new Date(data.treatment_approved_date)
          : data.treatment_approved
            ? new Date()
            : null,
      },
    });

    const h = await headers();
    await logAudit({
      user,
      action: "UPDATE",
      resourceType: "VisitNote",
      resourceId: data.id,
      details: data.treatment_approved ? "Treatment frequency approved" : "Treatment frequency approval removed",
      ipAddress: getClientIp(h),
    });

    return { success: true, id: data.id };
  }

  const therapyEnum = THERAPY_ENUM[data.therapy_type] || data.therapy_type;
  const visitEnum = VISIT_TYPE_MAP[data.visit_type] || data.visit_type?.toUpperCase() || null;
  const statusEnum = (data.status || "draft").toUpperCase();
  if (["COMPLETED", "SIGNED"].includes(statusEnum)) {
    const patient = await prisma.patient.findUnique({
      where: { id: data.patient_id },
      select: { agency: { select: { vitalSignsConfig: true } } },
    });
    if (patient?.agency?.vitalSignsConfig?.agency_preferences?.no_thera_docs === true) {
      return { error: NO_THERA_DOCS_MESSAGE };
    }
  }
  if (["COMPLETED", "SIGNED"].includes(statusEnum) && requiresCptCode(data.billing_payer) && !hasCptCode(data.cpt_codes)) {
    return { error: CPT_REQUIRED_MESSAGE };
  }

  if (visitEnum === "TREATMENT" && Array.isArray(data.follow_up_goals) && data.follow_up_goals.length) {
    const therapist = await prisma.therapist.findUnique({
      where: { id: data.therapist_id },
      select: { credentials: true },
    });
    const credentials = therapist?.credentials?.toUpperCase() || "";
    const canAdd = !/\b(PTA|COTA|SLPA)\b/.test(credentials) && /\b(PT|DPT|OT|OTR|SLP)\b/.test(credentials);
    if (!canAdd) {
      const previous = data.id ? await prisma.visitNote.findUnique({
        where: { id: data.id },
        select: { documents: true },
      }) : null;
      const priorGoals = previous?.documents?.formSnapshot?.follow_up_goals || [];
      if (data.follow_up_goals.some((goal) => !priorGoals.includes(goal))) throw new Error("Forbidden");
    }
  }

  const { id: _snapshotId, documents: _snapshotDocuments, ...formSnapshot } = data;
  const existingDocuments = data.documents && typeof data.documents === "object" && !Array.isArray(data.documents)
    ? data.documents
    : {};

  const visitData = {
    patientId: data.patient_id,
    patientName: data.patient_name,
    therapistId: data.therapist_id,
    therapistName: data.therapist_name,
    visitDate: new Date(data.visit_date),
    therapyType: therapyEnum,
    visitType: visitEnum,
    agencyId: data.agency_id || null,
    status: statusEnum,
    durationMinutes: data.duration_minutes !== undefined && data.duration_minutes !== null && data.duration_minutes !== ""
      ? parseInt(data.duration_minutes, 10)
      : null,
    nonBillable: !!data.non_billable,
    specialPrice: data.special_price || null,
    cptCodes: data.cpt_codes || [],
    includeSocOasis: !!data.include_soc_oasis,
    includeRocOasis: !!data.include_roc_oasis,
    requireDischargeOasis: !!data.require_discharge_oasis,
    includeNomnc: !!data.include_nomnc,
    timeTracking: jsonSafe({
      ...(data.time_tracking || {}),
      timeIn: data.time_in !== undefined ? data.time_in : (data.time_tracking?.timeIn ?? null),
      timeOut: data.time_out !== undefined ? data.time_out : (data.time_tracking?.timeOut ?? null),
    }),
    vitals: jsonSafe(data.vitals),
    // VitalsTab stores the pain fields at the top level of the form. Mirror
    // them into the normalized pain_assessment JSON as well so PDF generation
    // and integrations do not lose the location or the accompanying details.
    painAssessment: jsonSafe({
      ...(data.pain_assessment || {}),
      location: data.pain_location ?? data.pain_assessment?.location ?? "",
      vasPainScore: data.vas_pain_score ?? data.pain_assessment?.vasPainScore ?? null,
      chiefComplaint: data.pain_chief_complaint ?? data.pain_assessment?.chiefComplaint ?? "",
      descriptions: data.pain_descriptions ?? data.pain_assessment?.descriptions ?? [],
      descriptionOther: data.pain_description_other ?? data.pain_assessment?.descriptionOther ?? "",
      precautions: data.pain_precautions ?? data.pain_assessment?.precautions ?? "",
      patientEducation: data.pain_education ?? data.pain_assessment?.patientEducation ?? "",
      frequency: data.pain_frequency ?? data.pain_assessment?.frequency ?? "",
      managementEffectiveness: data.pain_management_effectiveness ?? data.pain_assessment?.managementEffectiveness ?? "",
    }),
    visitDiagnoses: jsonSafe({
      medicalDiagnoses: data.medical_diagnoses || [],
      treatmentDiagnoses: data.treatment_diagnoses || [],
    }),
    patientIdMethod: jsonSafe(data.patient_identification || data.patient_id_method),
    subjectiveData: jsonSafe({
      ...(data.subjective_data || {}),
      subjective: data.subjective ?? data.subjective_data?.subjective ?? "",
      medicalHistory: data.medical_history ?? data.subjective_data?.medicalHistory ?? "",
      pastSurgicalHistory: data.past_surgical_history ?? data.subjective_data?.pastSurgicalHistory ?? "",
      priorFunction: data.prior_function ?? data.subjective_data?.priorFunction ?? "",
      livingEnvironment: data.living_environment ?? data.subjective_data?.livingEnvironment ?? "",
      homeboundReasons: data.homebound_reasons ?? data.subjective_data?.homeboundReasons ?? [],
      homeboundOther: data.homebound_other ?? data.subjective_data?.homeboundOther ?? null,
      therapyObjectivePatientGoals: data.therapy_objective_patient_goals ?? data.subjective_data?.therapyObjectivePatientGoals ?? "",
      precautions: data.precautions ?? data.subjective_data?.precautions ?? "",
      medicationChanges: data.medication_changes ?? data.subjective_data?.medicationChanges ?? "",
    }),
    objectiveData: jsonSafe({
      ...(data.objective_data || {}),
      objective: data.objective ?? data.objective_data?.objective ?? "",
      romEvaluation: data.rom_evaluation ?? data.objective_data?.romEvaluation ?? {},
      strengthEvaluation: data.strength_evaluation ?? data.objective_data?.strengthEvaluation ?? {},
      gaitAnalysis: data.gait_analysis ?? data.objective_data?.gaitAnalysis ?? "",
    }),
    mobilityData: jsonSafe({
      ...(data.mobility_data || {}),
      bedMobility: data.mobility_bed ?? data.mobility_data?.bedMobility ?? {},
      transfers: data.mobility_transfers ?? data.mobility_data?.transfers ?? {},
      ambulationLevel: data.ambulation_level ?? data.mobility_data?.ambulationLevel ?? "",
      ambulationDevice: data.ambulation_device ?? data.mobility_data?.ambulationDevice ?? "",
      ambulationDistance: data.ambulation_distance ?? data.mobility_data?.ambulationDistance ?? "",
      weightBearing: data.weight_bearing ?? data.mobility_data?.weightBearing ?? {},
      weightBearingNotes: data.weight_bearing_notes ?? data.mobility_data?.weightBearingNotes ?? "",
      ambulationNotes: data.ambulation_notes ?? data.mobility_data?.ambulationNotes ?? "",
      balanceAssessment: data.balance_assessment ?? data.mobility_data?.balanceAssessment ?? {},
      mobilityNotes: data.mobility_notes ?? data.mobility_data?.mobilityNotes ?? "",
    }),
    adlData: jsonSafe({
      ...(data.adl_data || {}),
      adlGrid: data.adl_grid ?? data.adl_data?.adlGrid ?? {},
      iadlGridOt: data.iadl_grid_ot ?? data.adl_data?.iadlGridOt ?? {},
      slpAdl: data.slp_adl ?? data.adl_data?.slpAdl ?? {},
      conditionNotes: data.condition_notes ?? data.adl_data?.conditionNotes ?? "",
    }),
    soapNotes: jsonSafe({
      ...(data.soap_notes || {}),
      subjective: data.subjective ?? data.soap_notes?.subjective ?? "",
      objective: data.objective ?? data.soap_notes?.objective ?? "",
      assessment: data.assessment ?? data.soap_notes?.assessment ?? "",
      plan: data.plan ?? data.soap_notes?.plan ?? "",
    }),
    assessmentData: jsonSafe({
      ...(data.assessment_data || {}),
      standardizedTesting: data.standardized_testing ?? data.assessment_data?.standardizedTesting ?? "",
      standardizedTests: data.standardized_tests ?? data.assessment_data?.standardizedTests ?? [],
    }),
    goalsPlan: jsonSafe({
      ...(data.goals_plan || {}),
      goalsAddressed: data.goals_addressed ?? data.goals_plan?.goalsAddressed ?? [],
      interventions: data.interventions ?? data.goals_plan?.interventions ?? [],
      patientResponse: data.patient_response ?? data.goals_plan?.patientResponse ?? "",
      functionalStatus: data.functional_status ?? data.goals_plan?.functionalStatus ?? "",
      evalTreatmentGoals: data.eval_treatment_goals ?? data.goals_plan?.evalTreatmentGoals ?? [],
      skilledServiceNarrative: data.plan ?? data.goals_plan?.skilledServiceNarrative ?? "",
      careCoordination: data.care_coordination ?? data.goals_plan?.careCoordination ?? {},
    }),
    therapyOrders: jsonSafe(data.therapy_orders),
    dcPlanEducation: jsonSafe(data.dc_plan_education),
    nomncData: jsonSafe(data.nomnc_data),
    dischargeData: jsonSafe(data.discharge_data),
    reevalData: jsonSafe(data.reeval_data),
    signatures: jsonSafe(data.signatures),
    // Keep the complete in-progress form so every tab can be restored after
    // navigation. Structured columns remain the source for reports/details.
    documents: jsonSafe({ ...existingDocuments, formSnapshot }),
    oasisData: jsonSafe(data.oasis_data),
    ptaSupervision: jsonSafe(data.pta_supervision),
    missedVisitData: jsonSafe(data.missed_visit_data),
    treatmentApproved: data.treatment_approved ?? null,
    treatmentApprovedDate: data.treatment_approved_date ? new Date(data.treatment_approved_date) : null,
  };

  const noteId = await prisma.$transaction(async (db) => {
    const visit = data.id
      ? await db.visitNote.update({ where: { id: data.id }, data: visitData })
      : await db.visitNote.create({ data: visitData });
    await createVitalAlert(db, visit, user);
    return visit.id;
  });

  const h = await headers();
  await logAudit({
    user,
    action: data.id ? "UPDATE" : "CREATE",
    resourceType: "VisitNote",
    resourceId: noteId,
    resourceLabel: `${data.patient_name} — ${data.visit_type || "draft"}`,
    details: `Visit note ${data.id ? "updated" : "created"} (${data.status})`,
    ipAddress: getClientIp(h),
  });

  return { success: true, id: noteId };
}

export async function getLatestDraftVisitNote({ patientId, therapistId, visitType }) {
  const user = await requireAuth();
  const effectiveTherapistId = user.userType === "THERAPIST"
    ? user.therapistId
    : therapistId;

  if (!patientId || !effectiveTherapistId) return null;

  const note = await prisma.visitNote.findFirst({
    where: {
      patientId,
      therapistId: effectiveTherapistId,
      status: "DRAFT",
      ...(visitType ? { visitType: VISIT_TYPE_MAP[visitType] || visitType.toUpperCase() } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  return note ? toSnakeCase(note) : null;
}

export async function updateVisitNoteField(id, field, value) {
  const user = await requireAuth();

  const fieldMap = {
    visit_type: "visitType",
    status: "status",
  };

  const prismaField = fieldMap[field] || field;
  let prismaValue = value;

  if (field === "visit_type") {
    prismaValue = VISIT_TYPE_MAP[value] || value?.toUpperCase() || null;
  }
  if (field === "status") {
    prismaValue = value?.toUpperCase();
    if (["COMPLETED", "SIGNED"].includes(prismaValue)) {
      const note = await prisma.visitNote.findUnique({ where: { id }, select: { documents: true, cptCodes: true } });
      if (requiresCptCode(note?.documents?.formSnapshot?.billing_payer) && !hasCptCode(note.cptCodes)) {
        return { error: CPT_REQUIRED_MESSAGE };
      }
    }
  }

  await prisma.visitNote.update({
    where: { id },
    data: { [prismaField]: prismaValue },
  });

  const h = await headers();
  await logAudit({
    user,
    action: "UPDATE",
    resourceType: "VisitNote",
    resourceId: id,
    details: `Updated ${field} to ${value}`,
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function deleteVisitNote(id) {
  const user = await requireRole("SUPERUSER", "ADMIN");

  const note = await prisma.visitNote.findUnique({ where: { id } });
  if (!note) throw new Error("Visit note not found");

  await prisma.visitNote.delete({ where: { id } });

  const h = await headers();
  await logAudit({
    user,
    action: "DELETE",
    resourceType: "VisitNote",
    resourceId: id,
    resourceLabel: note.patientName,
    details: `Deleted visit note for ${note.patientName}`,
    ipAddress: getClientIp(h),
  });

  return { success: true };
}

export async function getPatientVisits(patientId) {
  const user = await requireRole("SUPERUSER", "ADMIN", "COORDINATOR", "THERAPIST");
  const canReadGoals = user.userType !== "THERAPIST" || Boolean(user.therapistId && await prisma.patient.findFirst({
    where: { id: patientId, OR: [
      { visitNotes: { some: { therapistId: user.therapistId } } },
      { assignments: { some: { therapistId: user.therapistId, status: { in: ["ACCEPTED", "SCHEDULED"] } } } },
    ] },
    select: { id: true },
  }));

  const visits = await prisma.visitNote.findMany({
    where: { patientId },
    orderBy: { visitDate: "desc" },
    select: {
      id: true,
      visitDate: true,
      therapyType: true,
      visitType: true,
      status: true,
      therapistName: true,
      goalsPlan: true,
    },
  });

  return visits.map((v) => ({
    id: v.id,
    visit_date: v.visitDate?.toISOString?.().split("T")[0],
    therapy_type: THERAPY_DISPLAY[v.therapyType] || v.therapyType,
    visit_type: VISIT_TYPE_DISPLAY[v.visitType] || v.visitType?.toLowerCase() || null,
    status: v.status?.toLowerCase(),
    therapist_name: v.therapistName,
    eval_treatment_goals: canReadGoals && Array.isArray(v.goalsPlan?.evalTreatmentGoals)
      ? v.goalsPlan.evalTreatmentGoals.filter((entry) => typeof entry?.goal === "string").map(({ goal }) => ({ goal }))
      : [],
  }));
}
