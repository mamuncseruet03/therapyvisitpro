ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "vital_signs_config" JSONB;

CREATE TABLE IF NOT EXISTS "payers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payer_code" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "authorization_required" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "status" "TherapistStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "payers_name_idx" ON "payers"("name");
CREATE INDEX IF NOT EXISTS "payers_status_idx" ON "payers"("status");
