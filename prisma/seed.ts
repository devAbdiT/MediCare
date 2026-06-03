import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt-ts";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("🌱 Starting database seeding...\n");

  // ──────────────────────────────────────────────
  // 1. Clean existing data (child → parent order)
  // ──────────────────────────────────────────────
  console.log("🗑️  Cleaning existing data...");
  await prisma.labResult.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.labTestCatalogue.deleteMany();
  await prisma.drugDispensing.deleteMany();
  await prisma.drugStock.deleteMany();
  await prisma.drug.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.vitalSigns.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.service.deleteMany();
  await prisma.allergy.deleteMany();
  await prisma.medicalCondition.deleteMany();
  await prisma.appointmentPayment.deleteMany();
  await prisma.appointmentHistory.deleteMany();
  await prisma.appointmentReminder.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorAvailability.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.receptionist.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.department.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Existing data cleaned\n");

  // Hash password for all users
  const hashedPassword = await hash("password123@", 10);

  // ──────────────────────────────────────────────
  // 2. Create Departments (with consultation fees)
  // ──────────────────────────────────────────────
  console.log("🏥 Creating departments...");
  const departmentData = [
    { name: "General Medicine", fee: 200 },
    { name: "Cardiology", fee: 500 },
    { name: "Pediatrics", fee: 300 },
    { name: "Orthopedics", fee: 400 },
    { name: "Neurology", fee: 600 },
    { name: "Dermatology", fee: 350 },
    { name: "Radiology", fee: 450 },
    { name: "Emergency Medicine", fee: 800 },
    { name: "Gynecology", fee: 400 },
    { name: "Ophthalmology", fee: 350 },
    { name: "ENT", fee: 300 },
    { name: "Psychiatry", fee: 500 },
    { name: "Urology", fee: 400 },
    { name: "Dentistry", fee: 350 },
  ];

  const departments: Record<string, string> = {};
  for (const d of departmentData) {
    const dept = await prisma.department.create({
      data: {
        name: d.name,
        description: `${d.name} Department`,
        consultationFee: d.fee,
      },
    });
    departments[d.name] = dept.id;
  }
  console.log(`✅ Created ${departmentData.length} departments\n`);

  // ──────────────────────────────────────────────
  // 3. Create Admin User
  // ──────────────────────────────────────────────
  console.log("👤 Creating admin user...");
  const adminUser = await prisma.user.create({
    data: {
      name: "Biruk Tadesse",
      email: "admin@medicare.com",
      phone: "+251911000001",
      role: "ADMIN",
      emailVerified: true,
      accounts: {
        create: {
          accountId: "admin-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
      admin: { create: {} },
    },
  });
  console.log(`✅ Admin: ${adminUser.email}\n`);

  // ──────────────────────────────────────────────
  // 4. Create Receptionists
  // ──────────────────────────────────────────────
  console.log("👤 Creating receptionists...");
  const receptionistNames = [
    "Azeb Hailu",
    "Mekdes Alemu",
    "Henok Belay",
    "Tigist Worku",
    "Samuel Girmay",
  ];

  const receptionists = [];
  let phoneCounter = 2;
  for (const name of receptionistNames) {
    const email = `${name.toLowerCase().replace(" ", ".")}@medicare.com`;
    const rec = await prisma.user.create({
      data: {
        name,
        email,
        phone: `+25191100000${phoneCounter}`,
        role: "RECEPTIONIST",
        emailVerified: true,
        accounts: {
          create: {
            accountId: `rec-${phoneCounter}-account`,
            providerId: "credential",
            password: hashedPassword,
          },
        },
        receptionist: { create: {} },
      },
    });
    receptionists.push(rec);
    phoneCounter++;
  }
  console.log(`✅ Created ${receptionistNames.length} receptionists\n`);

  // ──────────────────────────────────────────────
  // 5. Create Pharmacist & LabTech users
  // ──────────────────────────────────────────────
  console.log("💊 Creating pharmacist & lab tech users...");
  const pharmacist = await prisma.user.create({
    data: {
      name: "Kedir Mohammed",
      email: "pharmacist@medicare.com",
      phone: "+251911000050",
      role: "PHARMACIST",
      emailVerified: true,
      accounts: {
        create: {
          accountId: "pharmacist-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
    },
  });

  const labtech = await prisma.user.create({
    data: {
      name: "Rahel Assefa",
      email: "labtech@medicare.com",
      phone: "+251911000051",
      role: "LABTECH",
      emailVerified: true,
      accounts: {
        create: {
          accountId: "labtech-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
    },
  });
  console.log(`✅ Pharmacist: ${pharmacist.email}`);
  console.log(`✅ Lab Tech:   ${labtech.email}\n`);

  // ──────────────────────────────────────────────
  // 6. Create Doctors (with consultation fees & availability)
  // ──────────────────────────────────────────────
  console.log("👨‍⚕️ Creating doctors...");
  const doctorsData = [
    { name: "Dr. Abebech Demissie", dept: "General Medicine", fee: 250 },
    { name: "Dr. Tekle Berhan", dept: "General Medicine", fee: 200 },
    { name: "Dr. Meseret Asfaw", dept: "General Medicine", fee: 200 },
    { name: "Dr. Yonas Desta", dept: "Cardiology", fee: 600 },
    { name: "Dr. Hiwot Mulugeta", dept: "Cardiology", fee: 550 },
    { name: "Dr. Selam Tesfaye", dept: "Pediatrics", fee: 350 },
    { name: "Dr. Dawit Mekonnen", dept: "Pediatrics", fee: 300 },
    { name: "Dr. Frehiwot Gebre", dept: "Orthopedics", fee: 450 },
    { name: "Dr. Solomon Ayele", dept: "Orthopedics", fee: 400 },
    { name: "Dr. Eden Wondimu", dept: "Neurology", fee: 650 },
    { name: "Dr. Elias Kebede", dept: "Neurology", fee: 600 },
    { name: "Dr. Mahlet Girma", dept: "Dermatology", fee: 400 },
    { name: "Dr. Betelhem Abraham", dept: "Dermatology", fee: 350 },
    { name: "Dr. Tsehaynesh Tsegaye", dept: "Gynecology", fee: 450 },
    { name: "Dr. Liya Fikre", dept: "Gynecology", fee: 400 },
  ];

  const doctors = [];
  phoneCounter = 10;
  for (const doc of doctorsData) {
    const cleanName = doc.name.replace("Dr. ", "").toLowerCase().replace(" ", ".");
    const email = `${cleanName}@medicare.com`;

    const createdDoc = await prisma.user.create({
      data: {
        name: doc.name,
        email,
        phone: `+2519110000${phoneCounter}`,
        role: "DOCTOR",
        emailVerified: true,
        accounts: {
          create: {
            accountId: `doc-${phoneCounter}-account`,
            providerId: "credential",
            password: hashedPassword,
          },
        },
        doctor: {
          create: {
            specialization: doc.dept,
            departmentId: departments[doc.dept],
            consultationFee: doc.fee,
          },
        },
      },
    });
    doctors.push(createdDoc);
    phoneCounter++;
  }

  // Add availability for each doctor (Mon-Fri, 9am-5pm)
  const doctorRecords = await prisma.doctor.findMany();
  for (const dr of doctorRecords) {
    for (let day = 1; day <= 5; day++) {
      await prisma.doctorAvailability.create({
        data: {
          doctorId: dr.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
          isActive: true,
        },
      });
    }
  }
  console.log(`✅ Created ${doctorsData.length} doctors with availability\n`);

  // ──────────────────────────────────────────────
  // 7. Create Patients (with address, emergency, insurance)
  // ──────────────────────────────────────────────
  console.log("🏥 Creating patients...");
  const patientNames = [
    { name: "Almaz Bekele", gender: "FEMALE" },
    { name: "Tamirat Mengistu", gender: "MALE" },
    { name: "Birtukan Kassa", gender: "FEMALE" },
    { name: "Gashaw Assefa", gender: "MALE" },
    { name: "Meron Haile", gender: "FEMALE" },
    { name: "Nahom Daniel", gender: "MALE" },
    { name: "Hiwot Tekle", gender: "FEMALE" },
    { name: "Yonas Alemu", gender: "MALE" },
    { name: "Ruth Desta", gender: "FEMALE" },
    { name: "Henok Tesfaye", gender: "MALE" },
    { name: "Eden Gebreyesus", gender: "FEMALE" },
    { name: "Mikiyas Belay", gender: "MALE" },
    { name: "Sara Mohammed", gender: "FEMALE" },
    { name: "Dagim Worku", gender: "MALE" },
    { name: "Meklit Ayele", gender: "FEMALE" },
    { name: "Abel Tadesse", gender: "MALE" },
    { name: "Hanna Gebre", gender: "FEMALE" },
    { name: "Natnael Berhanu", gender: "MALE" },
    { name: "Selamawit Girmay", gender: "FEMALE" },
    { name: "Robel Tekle", gender: "MALE" },
  ];

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const regions = ["Addis Ababa", "Oromia", "Amhara", "SNNPR", "Tigray", "Dire Dawa"];
  const insuranceProviders = ["CBHI", "United Insurance", "Nyala Insurance", "Ethio Life", null];
  const emergencyRelations = ["Spouse", "Parent", "Sibling", "Child", "Friend"];

  const patients = [];
  phoneCounter = 1;
  for (let i = 0; i < patientNames.length; i++) {
    const pt = patientNames[i];
    const email = `${pt.name.toLowerCase().replace(" ", ".")}@email.com`;
    const formattedPhone = phoneCounter < 10 ? `0${phoneCounter}` : `${phoneCounter}`;

    const year = Math.floor(Math.random() * (2000 - 1975 + 1)) + 1975;
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;
    const dob = new Date(year, month, day);
    const age = new Date().getFullYear() - year;
    const bloodType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const insProvider = insuranceProviders[Math.floor(Math.random() * insuranceProviders.length)];

    const createdPt = await prisma.user.create({
      data: {
        name: pt.name,
        email,
        phone: `+2519120000${formattedPhone}`,
        role: "PATIENT",
        gender: pt.gender,
        emailVerified: true,
        accounts: {
          create: {
            accountId: `pat-${phoneCounter}-account`,
            providerId: "credential",
            password: hashedPassword,
          },
        },
        patient: {
          create: {
            dateOfBirth: dob,
            age,
            bloodType,
            cardNumber: `BK-P-2026-${String(phoneCounter).padStart(4, "0")}`,
            address: `Kebele ${Math.floor(Math.random() * 20) + 1}, House ${Math.floor(Math.random() * 500) + 1}`,
            city: "Jimma",
            region,
            emergencyName: `Emergency Contact ${i + 1}`,
            emergencyPhone: `+25191200${String(50 + i).padStart(4, "0")}`,
            emergencyRelation: emergencyRelations[i % emergencyRelations.length],
            patientStatus: "ACTIVE",
            insuranceProvider: insProvider,
            insurancePolicyNo: insProvider ? `POL-${String(1000 + i)}` : null,
            insuranceCoverage: insProvider ? `${[50, 75, 80, 100][i % 4]}%` : null,
            insuranceExpiry: insProvider ? new Date(2027, Math.floor(Math.random() * 12), 1) : null,
          },
        },
      },
    });
    patients.push(createdPt);
    phoneCounter++;
  }
  console.log(`✅ Created ${patientNames.length} patients\n`);

  // ──────────────────────────────────────────────
  // 8. Seed Allergies & Medical Conditions
  // ──────────────────────────────────────────────
  console.log("🩺 Seeding allergies & medical conditions...");
  const patientRecords = await prisma.patient.findMany();

  const allergens = [
    { allergen: "Penicillin", severity: "SEVERE" as const, reaction: "Anaphylaxis" },
    { allergen: "Peanuts", severity: "LIFE_THREATENING" as const, reaction: "Swelling, difficulty breathing" },
    { allergen: "Latex", severity: "MODERATE" as const, reaction: "Skin rash, itching" },
    { allergen: "Aspirin", severity: "MILD" as const, reaction: "Hives" },
    { allergen: "Sulfa drugs", severity: "SEVERE" as const, reaction: "Stevens-Johnson syndrome" },
    { allergen: "Dust mites", severity: "MILD" as const, reaction: "Sneezing, runny nose" },
    { allergen: "Ibuprofen", severity: "MODERATE" as const, reaction: "GI upset, rash" },
  ];

  const conditions = [
    { name: "Type 2 Diabetes Mellitus", icdCode: "E11" },
    { name: "Essential Hypertension", icdCode: "I10" },
    { name: "Asthma", icdCode: "J45" },
    { name: "Hypothyroidism", icdCode: "E03" },
    { name: "Chronic Kidney Disease", icdCode: "N18" },
    { name: "Major Depressive Disorder", icdCode: "F33" },
    { name: "Iron Deficiency Anemia", icdCode: "D50" },
  ];

  let allergyCount = 0;
  let conditionCount = 0;

  for (let i = 0; i < patientRecords.length; i++) {
    const p = patientRecords[i];

    // ~60% of patients have at least one allergy
    if (Math.random() < 0.6) {
      const numAllergies = Math.floor(Math.random() * 2) + 1;
      for (let j = 0; j < numAllergies; j++) {
        const a = allergens[(i + j) % allergens.length];
        await prisma.allergy.create({
          data: {
            patientId: p.id,
            allergen: a.allergen,
            severity: a.severity,
            reaction: a.reaction,
            confirmedAt: new Date(),
          },
        });
        allergyCount++;
      }
    }

    // ~50% of patients have a chronic condition
    if (Math.random() < 0.5) {
      const c = conditions[i % conditions.length];
      await prisma.medicalCondition.create({
        data: {
          patientId: p.id,
          name: c.name,
          icdCode: c.icdCode,
          diagnosedAt: new Date(2023, Math.floor(Math.random() * 12), 1),
          isActive: true,
          notes: "Managed with medication",
        },
      });
      conditionCount++;
    }
  }
  console.log(`✅ Created ${allergyCount} allergies, ${conditionCount} conditions\n`);

  // ──────────────────────────────────────────────
  // 9. Create Services (fee catalogue)
  // ──────────────────────────────────────────────
  console.log("💰 Creating service catalogue...");
  const servicesData = [
    { name: "General Consultation", code: "SVC-CONS-001", category: "CONSULTATION" as const, unitPrice: 200 },
    { name: "Specialist Consultation", code: "SVC-CONS-002", category: "CONSULTATION" as const, unitPrice: 500 },
    { name: "Follow-up Visit", code: "SVC-CONS-003", category: "CONSULTATION" as const, unitPrice: 100 },
    { name: "Complete Blood Count (CBC)", code: "SVC-LAB-001", category: "LAB" as const, unitPrice: 150 },
    { name: "Urinalysis", code: "SVC-LAB-002", category: "LAB" as const, unitPrice: 80 },
    { name: "Blood Glucose (FBS)", code: "SVC-LAB-003", category: "LAB" as const, unitPrice: 100 },
    { name: "Liver Function Test", code: "SVC-LAB-004", category: "LAB" as const, unitPrice: 250 },
    { name: "Thyroid Panel (TSH, T3, T4)", code: "SVC-LAB-005", category: "LAB" as const, unitPrice: 350 },
    { name: "Drug Dispensing Fee", code: "SVC-PHAR-001", category: "PHARMACY" as const, unitPrice: 30 },
    { name: "IV Infusion", code: "SVC-PROC-001", category: "PROCEDURE" as const, unitPrice: 300 },
    { name: "Wound Dressing", code: "SVC-PROC-002", category: "PROCEDURE" as const, unitPrice: 150 },
    { name: "X-Ray", code: "SVC-PROC-003", category: "PROCEDURE" as const, unitPrice: 400 },
    { name: "Ultrasound", code: "SVC-PROC-004", category: "PROCEDURE" as const, unitPrice: 500 },
    { name: "ECG", code: "SVC-PROC-005", category: "PROCEDURE" as const, unitPrice: 200 },
  ];

  for (const s of servicesData) {
    await prisma.service.create({ data: s });
  }
  console.log(`✅ Created ${servicesData.length} services\n`);

  // ──────────────────────────────────────────────
  // 10. Create Lab Test Catalogue
  // ──────────────────────────────────────────────
  console.log("🔬 Creating lab test catalogue...");
  const labTests = [
    { name: "Complete Blood Count", code: "LAB-CBC", category: "Hematology", referenceRange: "4.5-11.0 x10^9/L", unit: "x10^9/L", turnaroundHrs: 2, price: 150 },
    { name: "Fasting Blood Sugar", code: "LAB-FBS", category: "Biochemistry", referenceRange: "70-100 mg/dL", unit: "mg/dL", turnaroundHrs: 1, price: 100 },
    { name: "Urinalysis", code: "LAB-UA", category: "Urinalysis", referenceRange: "Normal", unit: null, turnaroundHrs: 1, price: 80 },
    { name: "Liver Function Test", code: "LAB-LFT", category: "Biochemistry", referenceRange: "ALT 7-56 U/L", unit: "U/L", turnaroundHrs: 4, price: 250 },
    { name: "Renal Function Test", code: "LAB-RFT", category: "Biochemistry", referenceRange: "Creatinine 0.7-1.3 mg/dL", unit: "mg/dL", turnaroundHrs: 4, price: 200 },
    { name: "Thyroid Panel", code: "LAB-TSH", category: "Endocrinology", referenceRange: "0.4-4.0 mIU/L", unit: "mIU/L", turnaroundHrs: 6, price: 350 },
    { name: "Lipid Profile", code: "LAB-LIPID", category: "Biochemistry", referenceRange: "TC < 200 mg/dL", unit: "mg/dL", turnaroundHrs: 3, price: 200 },
    { name: "HIV Screening", code: "LAB-HIV", category: "Serology", referenceRange: "Non-reactive", unit: null, turnaroundHrs: 1, price: 120 },
    { name: "Malaria Smear", code: "LAB-MAL", category: "Parasitology", referenceRange: "Negative", unit: null, turnaroundHrs: 1, price: 60 },
    { name: "ESR", code: "LAB-ESR", category: "Hematology", referenceRange: "0-20 mm/hr", unit: "mm/hr", turnaroundHrs: 2, price: 80 },
  ];

  for (const t of labTests) {
    await prisma.labTestCatalogue.create({ data: t });
  }
  console.log(`✅ Created ${labTests.length} lab test catalogue entries\n`);

  // ──────────────────────────────────────────────
  // 11. Create Drug Catalogue & Stock
  // ──────────────────────────────────────────────
  console.log("💊 Creating drug catalogue & stock...");
  const drugsData = [
    { name: "Amoxicillin 500mg", genericName: "Amoxicillin", category: "Antibiotic", form: "CAPSULE" as const, strength: "500mg", unit: "capsule", reorderLevel: 50 },
    { name: "Metformin 500mg", genericName: "Metformin HCL", category: "Antidiabetic", form: "TABLET" as const, strength: "500mg", unit: "tablet", reorderLevel: 100 },
    { name: "Lisinopril 10mg", genericName: "Lisinopril", category: "Antihypertensive", form: "TABLET" as const, strength: "10mg", unit: "tablet", reorderLevel: 80 },
    { name: "Omeprazole 20mg", genericName: "Omeprazole", category: "GI", form: "CAPSULE" as const, strength: "20mg", unit: "capsule", reorderLevel: 60 },
    { name: "Ibuprofen 400mg", genericName: "Ibuprofen", category: "NSAID", form: "TABLET" as const, strength: "400mg", unit: "tablet", reorderLevel: 100 },
    { name: "Paracetamol 500mg", genericName: "Acetaminophen", category: "Analgesic", form: "TABLET" as const, strength: "500mg", unit: "tablet", reorderLevel: 200 },
    { name: "Azithromycin 250mg", genericName: "Azithromycin", category: "Antibiotic", form: "TABLET" as const, strength: "250mg", unit: "tablet", reorderLevel: 40 },
    { name: "Salbutamol Inhaler", genericName: "Salbutamol", category: "Bronchodilator", form: "INHALER" as const, strength: "100mcg", unit: "puff", reorderLevel: 20 },
    { name: "Hydrocortisone 1% Cream", genericName: "Hydrocortisone", category: "Corticosteroid", form: "CREAM" as const, strength: "1%", unit: "tube", reorderLevel: 30 },
    { name: "Ceftriaxone 1g", genericName: "Ceftriaxone", category: "Antibiotic", form: "INJECTION" as const, strength: "1g", unit: "vial", reorderLevel: 25 },
    { name: "Loratadine 10mg", genericName: "Loratadine", category: "Antihistamine", form: "TABLET" as const, strength: "10mg", unit: "tablet", reorderLevel: 60 },
    { name: "ORS Sachets", genericName: "Oral Rehydration Salts", category: "Rehydration", form: "LIQUID" as const, strength: "1L", unit: "sachet", reorderLevel: 100 },
  ];

  for (const drug of drugsData) {
    const createdDrug = await prisma.drug.create({ data: drug });

    // Add initial stock (2 batches per drug)
    await prisma.drugStock.create({
      data: {
        drugId: createdDrug.id,
        batchNumber: `BATCH-${createdDrug.id.slice(-4).toUpperCase()}-A`,
        quantity: Math.floor(Math.random() * 400) + 100,
        expiryDate: new Date(2027, Math.floor(Math.random() * 12), 1),
        receivedById: pharmacist.id,
      },
    });
    await prisma.drugStock.create({
      data: {
        drugId: createdDrug.id,
        batchNumber: `BATCH-${createdDrug.id.slice(-4).toUpperCase()}-B`,
        quantity: Math.floor(Math.random() * 200) + 50,
        expiryDate: new Date(2026, Math.floor(Math.random() * 6) + 6, 1),
        receivedById: pharmacist.id,
      },
    });
  }
  console.log(`✅ Created ${drugsData.length} drugs with stock batches\n`);

  // ──────────────────────────────────────────────
  // 12. Create Appointments
  // ──────────────────────────────────────────────
  console.log("📅 Creating appointments...");
  const reasons = [
    "General checkup",
    "Follow-up visit",
    "Fever and chills",
    "Joint pain consultation",
    "Routine physical examination",
    "Skin rash evaluation",
    "Headache and dizziness",
    "Consultation for test results",
  ];

  const receptionistRecords = await prisma.receptionist.findMany();
  const appointments = [];

  for (const patient of patientRecords) {
    const numAppts = Math.floor(Math.random() * 2) + 2;

    for (let i = 0; i < numAppts; i++) {
      const randomDoctor = doctorRecords[Math.floor(Math.random() * doctorRecords.length)];
      const randomReceptionist = receptionistRecords[Math.floor(Math.random() * receptionistRecords.length)];

      const daysOffset = Math.floor(Math.random() * 45) - 30;
      const apptDate = new Date();
      apptDate.setDate(apptDate.getDate() + daysOffset);
      apptDate.setHours(Math.floor(Math.random() * 8) + 9, 0, 0, 0);

      let status = "SCHEDULED";
      const isWalkIn = Math.random() < 0.15;

      if (daysOffset < -7) {
        const r = Math.random();
        if (r < 0.7) status = "COMPLETED";
        else if (r < 0.85) status = "CANCELLED";
        else status = "NO_SHOW";
      } else if (daysOffset < 0) {
        status = Math.random() > 0.3 ? "COMPLETED" : "SCHEDULED";
      }

      const createdAppt = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: randomDoctor.id,
          receptionistId: randomReceptionist.id,
          dateTime: apptDate,
          status: status as any,
          reason: reasons[Math.floor(Math.random() * reasons.length)],
          walkIn: isWalkIn,
          chiefComplaint: status === "COMPLETED" ? reasons[Math.floor(Math.random() * reasons.length)] : null,
          checkedInAt: status === "COMPLETED" ? new Date(apptDate.getTime() - 15 * 60000) : null,
          queueNumber: status === "COMPLETED" || status === "CHECKED_IN" ? Math.floor(Math.random() * 30) + 1 : null,
          noShowAt: status === "NO_SHOW" ? apptDate : null,
        },
      });
      appointments.push(createdAppt);
    }
  }
  console.log(`✅ Created ${appointments.length} appointments\n`);

  // ──────────────────────────────────────────────
  // 13. Create Medical Records + Vital Signs + Prescriptions
  // ──────────────────────────────────────────────
  console.log("📋 Creating medical records, vitals & prescriptions...");
  const completedAppointments = appointments.filter((a) => a.status === "COMPLETED");

  const diagnoses = [
    { text: "Acute viral pharyngitis", icd: "J02.9" },
    { text: "Essential hypertension", icd: "I10" },
    { text: "Type 2 diabetes mellitus", icd: "E11.9" },
    { text: "Allergic rhinitis", icd: "J30.9" },
    { text: "Gastroesophageal reflux disease", icd: "K21.0" },
    { text: "Vitamin D deficiency", icd: "E55.9" },
    { text: "Migraine without aura", icd: "G43.0" },
    { text: "Contact dermatitis", icd: "L25.9" },
  ];

  const prescriptionDrugs = [
    { drugName: "Amoxicillin", dose: "500mg", frequency: "TID", duration: "7 days", route: "Oral", quantity: 21 },
    { drugName: "Lisinopril", dose: "10mg", frequency: "OD", duration: "30 days", route: "Oral", quantity: 30 },
    { drugName: "Metformin", dose: "500mg", frequency: "BID", duration: "30 days", route: "Oral", quantity: 60 },
    { drugName: "Loratadine", dose: "10mg", frequency: "OD", duration: "14 days", route: "Oral", quantity: 14 },
    { drugName: "Omeprazole", dose: "20mg", frequency: "OD", duration: "14 days", route: "Oral", quantity: 14 },
    { drugName: "Paracetamol", dose: "500mg", frequency: "TID PRN", duration: "5 days", route: "Oral", quantity: 15 },
    { drugName: "Ibuprofen", dose: "400mg", frequency: "TID", duration: "5 days", route: "Oral", quantity: 15 },
    { drugName: "Hydrocortisone Cream", dose: "1%", frequency: "BID", duration: "7 days", route: "Topical", quantity: 1 },
  ];

  let recordCount = 0;
  let vitalsCount = 0;
  let rxCount = 0;

  for (const appt of completedAppointments) {
    if (Math.random() > 0.15) {
      const diagIdx = Math.floor(Math.random() * diagnoses.length);
      const d = diagnoses[diagIdx];

      // Create medical record linked to appointment
      const record = await prisma.medicalRecord.create({
        data: {
          patientId: appt.patientId,
          doctorId: appt.doctorId,
          appointmentId: appt.id,
          diagnosis: d.text,
          icdCode: d.icd,
          prescription: `${prescriptionDrugs[diagIdx].drugName} ${prescriptionDrugs[diagIdx].dose}`,
          notes: "Patient advised to follow up in 2 weeks if symptoms persist.",
          date: appt.dateTime,
        },
      });
      recordCount++;

      // Create 1-2 structured prescriptions per record
      const numRx = Math.floor(Math.random() * 2) + 1;
      for (let r = 0; r < numRx; r++) {
        const rx = prescriptionDrugs[(diagIdx + r) % prescriptionDrugs.length];
        await prisma.prescription.create({
          data: {
            medicalRecordId: record.id,
            drugName: rx.drugName,
            dose: rx.dose,
            frequency: rx.frequency,
            duration: rx.duration,
            route: rx.route,
            quantity: rx.quantity,
            instructions: r === 0 ? "Take after meals" : "Take as directed",
          },
        });
        rxCount++;
      }

      // Create vital signs for this appointment
      await prisma.vitalSigns.create({
        data: {
          appointmentId: appt.id,
          patientId: appt.patientId,
          bloodPressureSys: Math.floor(Math.random() * 40) + 100,
          bloodPressureDia: Math.floor(Math.random() * 20) + 60,
          temperature: parseFloat((Math.random() * 2 + 36).toFixed(1)),
          weight: parseFloat((Math.random() * 40 + 50).toFixed(1)),
          height: parseFloat((Math.random() * 30 + 155).toFixed(1)),
          pulseRate: Math.floor(Math.random() * 30) + 60,
          oxygenSaturation: parseFloat((Math.random() * 3 + 95).toFixed(1)),
          respiratoryRate: Math.floor(Math.random() * 8) + 14,
          recordedById: appt.doctorId,
        },
      });
      vitalsCount++;
    }
  }
  console.log(`✅ Created ${recordCount} medical records`);
  console.log(`✅ Created ${vitalsCount} vital sign entries`);
  console.log(`✅ Created ${rxCount} prescriptions\n`);

  // ──────────────────────────────────────────────
  // 14. Summary
  // ──────────────────────────────────────────────
  console.log("✨ Seeding completed successfully!\n");
  console.log("📊 Summary:");
  console.log(`   - Departments:       ${departmentData.length}`);
  console.log(`   - Admins:            1`);
  console.log(`   - Receptionists:     ${receptionistNames.length}`);
  console.log(`   - Doctors:           ${doctorsData.length}`);
  console.log(`   - Pharmacists:       1`);
  console.log(`   - Lab Techs:         1`);
  console.log(`   - Patients:          ${patientNames.length}`);
  console.log(`   - Allergies:         ${allergyCount}`);
  console.log(`   - Conditions:        ${conditionCount}`);
  console.log(`   - Services:          ${servicesData.length}`);
  console.log(`   - Lab Catalogue:     ${labTests.length}`);
  console.log(`   - Drugs:             ${drugsData.length}`);
  console.log(`   - Appointments:      ${appointments.length}`);
  console.log(`   - Medical Records:   ${recordCount}`);
  console.log(`   - Vital Signs:       ${vitalsCount}`);
  console.log(`   - Prescriptions:     ${rxCount}`);
  console.log("\n🔑 Login Credentials (all users):");
  console.log("   Password: password123@\n");
  console.log("   Admin:        admin@medicare.com");
  console.log("   Receptionist:  azeb.hailu@medicare.com");
  console.log("   Doctor:        abebech.demissie@medicare.com");
  console.log("   Patient:       almaz.bekele@email.com");
  console.log("   Pharmacist:    pharmacist@medicare.com");
  console.log("   Lab Tech:      labtech@medicare.com");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
