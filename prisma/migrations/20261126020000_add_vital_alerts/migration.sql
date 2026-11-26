ALTER TABLE "communication_notes"
  ADD COLUMN "vital_visit_id" TEXT,
  ADD COLUMN "resolved_at" TIMESTAMP(3),
  ADD COLUMN "resolution" TEXT;

CREATE UNIQUE INDEX "communication_notes_vital_visit_id_key" ON "communication_notes"("vital_visit_id");
ALTER TABLE "communication_notes" ADD CONSTRAINT "communication_notes_vital_visit_id_fkey"
  FOREIGN KEY ("vital_visit_id") REFERENCES "visit_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
