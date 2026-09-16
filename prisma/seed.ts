import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL ?? "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data in dependency order
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.visitNote.deleteMany();
  await prisma.referralAssignment.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.communicationNote.deleteMany();
  await prisma.deletionRequest.deleteMany();
  await prisma.patientDiagnosis.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.agencyRate.deleteMany();
  await prisma.agencyContact.deleteMany();
  await prisma.agency.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.coordinatorTimeLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.documentLibrary.deleteMany();
  await prisma.companyInfo.deleteMany();
  await prisma.user.deleteMany();
  await prisma.therapist.deleteMany();

  // Seed therapists
  const ptTherapist = await prisma.therapist.create({
    data: {
      fullName: "Sarah Johnson, PT, DPT",
      discipline: "PT",
      credentials: "DPT",
      licenseNumber: "PT-2024-001",
      email: "sarah.johnson@therapyvisit.com",
      phone: "555-0101",
      hireDate: new Date("2023-01-15"),
      annualReviewDate: new Date("2025-01-15"),
      status: "ACTIVE",
      facilities: ["Main Office", "North Branch"],
      rates: {
        peds: { eval: 150, returnVisit: 100, supervisory: 120, recert: 130, discharge: 110 },
        geriatrics: {
          eval: 140,
          returnVisit: 95,
          supervisory: 115,
          recert: 125,
          discharge: 105,
        },
      },
    },
  });

  const otTherapist = await prisma.therapist.create({
    data: {
      fullName: "Michael Chen, OT, OTR/L",
      discipline: "OT",
      credentials: "OTR/L",
      licenseNumber: "OT-2024-002",
      email: "michael.chen@therapyvisit.com",
      phone: "555-0102",
      hireDate: new Date("2023-06-01"),
      status: "ACTIVE",
      facilities: ["Main Office"],
      rates: {
        peds: { eval: 155, returnVisit: 105 },
        geriatrics: { eval: 145, returnVisit: 100 },
      },
    },
  });

  await prisma.therapist.create({
    data: {
      fullName: "Emily Davis, SLP, CCC-SLP",
      discipline: "ST",
      credentials: "CCC-SLP",
      licenseNumber: "ST-2024-003",
      email: "emily.davis@therapyvisit.com",
      phone: "555-0103",
      hireDate: new Date("2024-01-10"),
      status: "ACTIVE",
      facilities: ["Main Office", "South Branch"],
      rates: {
        geriatrics: { eval: 160, returnVisit: 110 },
      },
    },
  });

  // bcrypt hash of "demo123" — for development only
  const demoPasswordHash = "$2b$12$OrQTrjc9HrcCxgRMMq6QbuT2aMxDG4xkrluwr5AM1BRU2ygiIJTmW";

  await prisma.user.create({
    data: {
      email: "superadmin@therapyvisit.com",
      passwordHash: demoPasswordHash,
      fullName: "Super Admin",
      role: "SUPERUSER",
      userType: "SUPERUSER",
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@therapyvisit.com",
      passwordHash: demoPasswordHash,
      fullName: "Admin User",
      role: "ADMIN",
      userType: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      email: "sarah.johnson@therapyvisit.com",
      passwordHash: demoPasswordHash,
      fullName: "Sarah Johnson, PT, DPT",
      role: "USER",
      userType: "THERAPIST",
      therapistId: ptTherapist.id,
      discipline: "PT",
      credentials: "DPT",
      licenseNumber: "PT-2024-001",
    },
  });

  await prisma.user.create({
    data: {
      email: "coordinator@therapyvisit.com",
      passwordHash: demoPasswordHash,
      fullName: "Lisa Martinez",
      role: "USER",
      userType: "COORDINATOR",
    },
  });

  await prisma.user.create({
    data: {
      email: "hr@therapyvisit.com",
      passwordHash: demoPasswordHash,
      fullName: "Robert Wilson",
      role: "USER",
      userType: "HR",
    },
  });

  // Seed agencies
  const agency1 = await prisma.agency.create({
    data: {
      name: "Sunshine Home Health",
      address: "100 Healthcare Blvd",
      city: "Miami",
      state: "FL",
      zip: "33101",
      phone: "305-555-0100",
      email: "admin@sunshinehh.com",
      documentMode: "THERADOCS",
      assistantsAllowed: true,
      supervisoryVisitFrequency: 8,
      workWeekStartDay: 1,
      contacts: {
        create: [
          {
            name: "Maria Garcia",
            title: "Director of Nursing",
            phone: "305-555-0101",
            email: "maria@sunshinehh.com",
          },
          { name: "Tom Brown", title: "Billing Coordinator", phone: "305-555-0102" },
        ],
      },
      rates: {
        create: [
          { therapyType: "PHYSICAL_THERAPY", visitType: "EVALUATION", rate: 150 },
          { therapyType: "PHYSICAL_THERAPY", visitType: "TREATMENT", rate: 100 },
          { therapyType: "OCCUPATIONAL_THERAPY", visitType: "EVALUATION", rate: 155 },
          { therapyType: "OCCUPATIONAL_THERAPY", visitType: "TREATMENT", rate: 105 },
          { therapyType: "SPEECH_THERAPY", visitType: "EVALUATION", rate: 160 },
          { therapyType: "SPEECH_THERAPY", visitType: "TREATMENT", rate: 110 },
        ],
      },
    },
  });

  await prisma.agency.create({
    data: {
      name: "Comfort Care Services",
      address: "200 Wellness Way",
      city: "Orlando",
      state: "FL",
      zip: "32801",
      phone: "407-555-0200",
      email: "info@comfortcare.com",
      documentMode: "AGENCY_DOCS",
      assistantsAllowed: false,
      supervisoryVisitFrequency: 6,
      contacts: {
        create: [{ name: "Susan Lee", title: "Operations Manager", phone: "407-555-0201" }],
      },
      rates: {
        create: [
          { therapyType: "PHYSICAL_THERAPY", visitType: "EVALUATION", rate: 145 },
          { therapyType: "PHYSICAL_THERAPY", visitType: "TREATMENT", rate: 95 },
        ],
      },
    },
  });

  // Seed patients
  await prisma.patient.create({
    data: {
      firstName: "Robert",
      lastName: "Anderson",
      dateOfBirth: new Date("1945-03-20"),
      sex: "MALE",
      phone: "555-0201",
      email: "robert.anderson@email.com",
      address: "789 Elm Street",
      city: "Miami",
      state: "FL",
      zip: "33102",
      agencyId: agency1.id,
      insurance: "Medicare Part A",
      medicareNumber: "1EG4-TE5-MK72",
      certPeriodStart: new Date("2025-06-01"),
      certPeriodEnd: new Date("2025-08-01"),
      authorizationNumber: "AUTH-2025-001",
      authorizedVisits: 24,
      therapyTypes: ["PHYSICAL_THERAPY", "OCCUPATIONAL_THERAPY"],
      status: "ACTIVE",
      visitCounts: {
        ptEval: 1,
        ptTreatment: 8,
        otEval: 1,
        otTreatment: 4,
        stEval: 0,
        stTreatment: 0,
      },
      assignedTherapists: {
        evaluatingPt: ptTherapist.fullName,
        treatingPt: ptTherapist.fullName,
        evaluatingOt: otTherapist.fullName,
        treatingOt: otTherapist.fullName,
      },
      responsibleParty: { name: "Mary Anderson", phone: "555-0202", relationship: "Spouse" },
      physicians: {
        primary: { name: "Dr. James White", phone: "555-0301" },
        referring: { name: "Dr. Patricia Green", phone: "555-0302" },
      },
      diagnoses: {
        create: [
          { diagnosis: "Total knee replacement, right", icd10Code: "Z96.651", isPrimary: true },
          { diagnosis: "Muscle weakness", icd10Code: "M62.81", isPrimary: false },
        ],
      },
    },
  });

  await prisma.patient.create({
    data: {
      firstName: "Dorothy",
      lastName: "Williams",
      dateOfBirth: new Date("1938-11-05"),
      sex: "FEMALE",
      phone: "555-0203",
      address: "321 Pine Road",
      city: "Orlando",
      state: "FL",
      zip: "32802",
      insurance: "Medicare Part A",
      therapyTypes: ["SPEECH_THERAPY"],
      status: "ACTIVE",
      diagnoses: {
        create: [{ diagnosis: "Dysphagia", icd10Code: "R13.10", isPrimary: true }],
      },
    },
  });

  // Seed company info
  await prisma.companyInfo.create({
    data: {
      companyName: "TherapyVisit Pro",
      tagline: "Home Health Therapy Management",
      phone: "1-800-555-THER",
      email: "support@therapyvisit.com",
      address: { street: "500 Corporate Dr", city: "Tampa", state: "FL", zip: "33601" },
      businessHours: { weekdays: "8:00 AM - 6:00 PM", weekends: "Closed" },
      menuPermissions: {},
    },
  });

  // Seed announcements
  await prisma.announcement.create({
    data: {
      message: "Welcome to TherapyVisit Pro! System is in demo mode.",
      isActive: true,
      color: "BLUE",
    },
  });

  // Seed document library
  await prisma.documentLibrary.create({
    data: {
      name: "HIPAA Privacy Policy",
      description: "Required privacy policy document",
      category: "Compliance",
      isActive: true,
    },
  });

  await prisma.documentLibrary.create({
    data: {
      name: "Patient Intake Form",
      description: "Standard intake form template",
      category: "Form",
      isActive: true,
    },
  });

  // Seed tasks
  await prisma.task.create({
    data: {
      title: "Review patient documentation",
      description: "Review all pending patient documentation for compliance",
      assignedTo: "admin@therapyvisit.com",
      assignedToName: "Admin User",
      priority: "HIGH",
      status: "PENDING",
      dueDate: new Date("2025-08-15"),
    },
  });

  console.log("Seed completed successfully:");
  console.log("  - 3 therapists");
  console.log("  - 5 users");
  console.log("  - 2 agencies (with contacts and rates)");
  console.log("  - 2 patients (with diagnoses)");
  console.log("  - 1 company info");
  console.log("  - 1 announcement");
  console.log("  - 2 documents");
  console.log("  - 1 task");
  console.log("\nLogin credentials:");
  console.log("  superadmin@therapyvisit.com / demo123");
  console.log("  admin@therapyvisit.com / demo123");
  console.log("  sarah.johnson@therapyvisit.com / demo123");
  console.log("  coordinator@therapyvisit.com / demo123");
  console.log("  hr@therapyvisit.com / demo123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
