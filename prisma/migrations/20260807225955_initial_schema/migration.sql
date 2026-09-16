-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'SUPERUSER');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('SUPERUSER', 'ADMIN', 'THERAPIST', 'COORDINATOR', 'HR', 'GUEST', 'CLIENT');

-- CreateEnum
CREATE TYPE "Discipline" AS ENUM ('PT', 'OT', 'ST');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('ACTIVE', 'DISCHARGED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "TherapistStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TherapyType" AS ENUM ('PHYSICAL_THERAPY', 'OCCUPATIONAL_THERAPY', 'SPEECH_THERAPY');

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('EVALUATION', 'TREATMENT', 'RE_EVALUATION', 'RECERTIFICATION', 'DISCHARGE_WITH_VISIT', 'DISCHARGE_WITHOUT_VISIT', 'EVAL_REFUSED', 'MISSED_VISIT');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'COMPLETED', 'SIGNED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'PARTIAL_PAID', 'VOID');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'SIGN', 'LOGIN', 'LOGOUT');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('GENERAL', 'CLINICAL', 'BILLING', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COMMUNICATION_NOTE', 'TASK', 'GENERAL', 'HR_ALERT');

-- CreateEnum
CREATE TYPE "ReferralSourceType" AS ENUM ('MANUAL', 'PDF_IMPORT');

-- CreateEnum
CREATE TYPE "PatientAction" AS ENUM ('CREATED', 'UPDATED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "DeletionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AnnouncementColor" AS ENUM ('BLUE', 'AMBER', 'GREEN', 'RED');

-- CreateEnum
CREATE TYPE "AgencyDocMode" AS ENUM ('THERADOCS', 'AGENCY_DOCS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "user_type" "UserType" NOT NULL,
    "therapist_id" TEXT,
    "credentials" TEXT,
    "license_number" TEXT,
    "discipline" "Discipline",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" DATE,
    "sex" "Sex",
    "ssn_encrypted" TEXT,
    "medicare_number" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "agency_id" TEXT,
    "insurance" TEXT,
    "coordinator_email" TEXT,
    "cert_period_start" DATE,
    "cert_period_end" DATE,
    "authorization_number" TEXT,
    "authorized_visits" INTEGER,
    "therapy_types" "TherapyType"[],
    "notes" TEXT,
    "status" "PatientStatus" NOT NULL DEFAULT 'ACTIVE',
    "visit_counts" JSONB,
    "assigned_therapists" JSONB,
    "responsible_party" JSONB,
    "physicians" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_diagnoses" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "icd10_code" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "patient_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapists" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "credentials" TEXT,
    "license_number" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "hire_date" DATE,
    "annual_review_date" DATE,
    "status" "TherapistStatus" NOT NULL DEFAULT 'ACTIVE',
    "facilities" TEXT[],
    "rates" JSONB,
    "personal_files" JSONB,
    "disciplinary_actions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_notes" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "therapist_id" TEXT NOT NULL,
    "therapist_name" TEXT NOT NULL,
    "visit_date" DATE NOT NULL,
    "therapy_type" "TherapyType" NOT NULL,
    "visit_type" "VisitType",
    "agency_id" TEXT,
    "status" "VisitStatus" NOT NULL DEFAULT 'DRAFT',
    "duration_minutes" INTEGER,
    "time_in" TEXT,
    "time_out" TEXT,
    "non_billable" BOOLEAN NOT NULL DEFAULT false,
    "special_price" DECIMAL(10,2),
    "cpt_codes" TEXT[],
    "include_soc_oasis" BOOLEAN NOT NULL DEFAULT false,
    "include_roc_oasis" BOOLEAN NOT NULL DEFAULT false,
    "require_discharge_oasis" BOOLEAN NOT NULL DEFAULT false,
    "include_nomnc" BOOLEAN NOT NULL DEFAULT false,
    "treatment_approved" BOOLEAN,
    "treatment_approved_date" TIMESTAMP(3),
    "vitals" JSONB,
    "pain_assessment" JSONB,
    "subjective_data" JSONB,
    "objective_data" JSONB,
    "mobility_data" JSONB,
    "adl_data" JSONB,
    "soap_notes" JSONB,
    "assessment_data" JSONB,
    "goals_plan" JSONB,
    "therapy_orders" JSONB,
    "dc_plan_education" JSONB,
    "nomnc_data" JSONB,
    "discharge_data" JSONB,
    "reeval_data" JSONB,
    "signatures" JSONB,
    "time_tracking" JSONB,
    "documents" JSONB,
    "visit_diagnoses" JSONB,
    "patient_id_method" JSONB,
    "oasis_data" JSONB,
    "pta_supervision" JSONB,
    "missed_visit_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "agency_name" TEXT NOT NULL,
    "date_from" DATE NOT NULL,
    "date_to" DATE NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "check_details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "visit_note_id" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "visit_date" DATE NOT NULL,
    "therapy_type" TEXT NOT NULL,
    "visit_type" TEXT NOT NULL,
    "therapist_name" TEXT NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agencies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "document_mode" "AgencyDocMode" NOT NULL DEFAULT 'THERADOCS',
    "assistants_allowed" BOOLEAN NOT NULL DEFAULT true,
    "supervisory_visit_frequency" INTEGER,
    "work_week_start_day" INTEGER NOT NULL DEFAULT 0,
    "documentation_setup" JSONB,
    "required_visit_documents" TEXT[],
    "agency_documents" JSONB,
    "notes" TEXT,
    "status" "TherapistStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_contacts" (
    "id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "phone" TEXT,
    "email" TEXT,

    CONSTRAINT "agency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_rates" (
    "id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "therapy_type" TEXT NOT NULL,
    "visit_type" TEXT NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "agency_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" DATE,
    "phone" TEXT,
    "referral_date" DATE,
    "source_type" "ReferralSourceType",
    "patient_id" TEXT,
    "patient_action" "PatientAction",
    "clinical_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_assignments" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "therapist_id" TEXT,
    "therapist_name" TEXT,
    "supervising_therapist_id" TEXT,
    "supervising_therapist_name" TEXT,
    "therapy_type" "Discipline" NOT NULL,
    "visit_type" TEXT NOT NULL,
    "agency" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "eval_visit_note_id" TEXT,
    "approved_weekly_visits" JSONB,
    "assignment_history" JSONB,
    "declined_by" TEXT,
    "declined_reason" TEXT,
    "recalled_from" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigned_to" TEXT NOT NULL,
    "assigned_to_name" TEXT,
    "due_date" DATE,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "is_daily_recurring" BOOLEAN NOT NULL DEFAULT false,
    "completed_date" DATE,
    "notes" TEXT,
    "escalation_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_name" TEXT,
    "user_email" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "resource_label" TEXT,
    "details" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_info" (
    "id" TEXT NOT NULL,
    "company_name" TEXT,
    "logo_url" TEXT,
    "tagline" TEXT,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" JSONB,
    "business_hours" JSONB,
    "menu_permissions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_notes" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "author_id" TEXT,
    "author_name" TEXT,
    "author_email" TEXT,
    "note" TEXT NOT NULL,
    "note_type" "NoteType" NOT NULL DEFAULT 'GENERAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "color" "AnnouncementColor" NOT NULL DEFAULT 'BLUE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordinator_time_logs" (
    "id" TEXT NOT NULL,
    "coordinator_id" TEXT NOT NULL,
    "coordinator_name" TEXT NOT NULL,
    "coordinator_email" TEXT,
    "clock_in" TIMESTAMP(3) NOT NULL,
    "clock_out" TIMESTAMP(3),
    "log_date" DATE NOT NULL,
    "duration_minutes" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coordinator_time_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_requests" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "patient_snapshot" JSONB,
    "requested_by" TEXT NOT NULL,
    "requested_by_name" TEXT,
    "reason" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_by_name" TEXT,
    "approved_at" TIMESTAMP(3),
    "status" "DeletionStatus" NOT NULL DEFAULT 'PENDING',
    "visit_notes_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "recipient_id" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "type" "NotificationType" NOT NULL DEFAULT 'GENERAL',
    "related_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_library" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "file_url" TEXT,
    "file_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_library_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_therapist_id_key" ON "users"("therapist_id");

-- CreateIndex
CREATE INDEX "patients_last_name_first_name_idx" ON "patients"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "patients_status_idx" ON "patients"("status");

-- CreateIndex
CREATE INDEX "patients_agency_id_idx" ON "patients"("agency_id");

-- CreateIndex
CREATE INDEX "patient_diagnoses_patient_id_idx" ON "patient_diagnoses"("patient_id");

-- CreateIndex
CREATE INDEX "therapists_discipline_idx" ON "therapists"("discipline");

-- CreateIndex
CREATE INDEX "therapists_status_idx" ON "therapists"("status");

-- CreateIndex
CREATE INDEX "visit_notes_patient_id_idx" ON "visit_notes"("patient_id");

-- CreateIndex
CREATE INDEX "visit_notes_therapist_id_idx" ON "visit_notes"("therapist_id");

-- CreateIndex
CREATE INDEX "visit_notes_visit_date_idx" ON "visit_notes"("visit_date");

-- CreateIndex
CREATE INDEX "visit_notes_status_idx" ON "visit_notes"("status");

-- CreateIndex
CREATE INDEX "visit_notes_therapy_type_idx" ON "visit_notes"("therapy_type");

-- CreateIndex
CREATE INDEX "visit_notes_visit_type_idx" ON "visit_notes"("visit_type");

-- CreateIndex
CREATE INDEX "visit_notes_agency_id_idx" ON "visit_notes"("agency_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_agency_id_idx" ON "invoices"("agency_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoice_line_items_invoice_id_idx" ON "invoice_line_items"("invoice_id");

-- CreateIndex
CREATE INDEX "agency_contacts_agency_id_idx" ON "agency_contacts"("agency_id");

-- CreateIndex
CREATE UNIQUE INDEX "agency_rates_agency_id_therapy_type_visit_type_key" ON "agency_rates"("agency_id", "therapy_type", "visit_type");

-- CreateIndex
CREATE INDEX "referrals_patient_id_idx" ON "referrals"("patient_id");

-- CreateIndex
CREATE INDEX "referral_assignments_patient_id_idx" ON "referral_assignments"("patient_id");

-- CreateIndex
CREATE INDEX "referral_assignments_therapist_id_idx" ON "referral_assignments"("therapist_id");

-- CreateIndex
CREATE INDEX "referral_assignments_status_idx" ON "referral_assignments"("status");

-- CreateIndex
CREATE INDEX "tasks_assigned_to_idx" ON "tasks"("assigned_to");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "communication_notes_patient_id_idx" ON "communication_notes"("patient_id");

-- CreateIndex
CREATE INDEX "coordinator_time_logs_coordinator_id_idx" ON "coordinator_time_logs"("coordinator_id");

-- CreateIndex
CREATE INDEX "coordinator_time_logs_log_date_idx" ON "coordinator_time_logs"("log_date");

-- CreateIndex
CREATE INDEX "deletion_requests_status_idx" ON "deletion_requests"("status");

-- CreateIndex
CREATE INDEX "notifications_recipient_email_idx" ON "notifications"("recipient_email");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_idx" ON "notifications"("recipient_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_diagnoses" ADD CONSTRAINT "patient_diagnoses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_notes" ADD CONSTRAINT "visit_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_notes" ADD CONSTRAINT "visit_notes_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_visit_note_id_fkey" FOREIGN KEY ("visit_note_id") REFERENCES "visit_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_contacts" ADD CONSTRAINT "agency_contacts_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_rates" ADD CONSTRAINT "agency_rates_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_assignments" ADD CONSTRAINT "referral_assignments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_assignments" ADD CONSTRAINT "referral_assignments_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_assignments" ADD CONSTRAINT "referral_assignments_supervising_therapist_id_fkey" FOREIGN KEY ("supervising_therapist_id") REFERENCES "therapists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_notes" ADD CONSTRAINT "communication_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
