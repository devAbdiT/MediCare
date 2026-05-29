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

  // 1. Clear existing data
  console.log("🗑️  Cleaning existing data...");
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
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

  // 2. Create Departments
  console.log("🏥 Creating departments...");
  const departmentNames = [
    "General Medicine",
    "Cardiology",
    "Pediatrics",
    "Orthopedics",
    "Neurology",
    "Dermatology",
    "Radiology",
    "Emergency Medicine",
    "Gynecology",
    "Ophthalmology",
    "ENT",
    "Psychiatry",
    "Urology",
    "Dentistry",
  ];

  const departments: Record<string, string> = {};
  for (const name of departmentNames) {
    const dept = await prisma.department.create({
      data: { name, description: `${name} Department` },
    });
    departments[name] = dept.id;
  }
  console.log(`✅ Created 14 departments\n`);

  // 3. Create Admin User
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
      admin: {
        create: {},
      },
    },
  });
  console.log(`✅ Admin created: ${adminUser.name} (${adminUser.email})\n`);

  // 4. Create Receptionist Users
  console.log("👤 Creating receptionist users...");
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
        receptionist: {
          create: {},
        },
      },
    });
    receptionists.push(rec);
    phoneCounter++;
  }
  console.log(`✅ Created 5 receptionists\n`);

  // 5. Create Doctor Users
  console.log("👨‍⚕️ Creating doctor users...");
  const doctorsData = [
    // General Medicine
    { name: "Dr. Abebech Demissie", dept: "General Medicine" },
    { name: "Dr. Tekle Berhan", dept: "General Medicine" },
    { name: "Dr. Meseret Asfaw", dept: "General Medicine" },
    // Cardiology
    { name: "Dr. Yonas Desta", dept: "Cardiology" },
    { name: "Dr. Hiwot Mulugeta", dept: "Cardiology" },
    // Pediatrics
    { name: "Dr. Selam Tesfaye", dept: "Pediatrics" },
    { name: "Dr. Dawit Mekonnen", dept: "Pediatrics" },
    // Orthopedics
    { name: "Dr. Frehiwot Gebre", dept: "Orthopedics" },
    { name: "Dr. Solomon Ayele", dept: "Orthopedics" },
    // Neurology
    { name: "Dr. Eden Wondimu", dept: "Neurology" },
    { name: "Dr. Elias Kebede", dept: "Neurology" },
    // Dermatology
    { name: "Dr. Mahlet Girma", dept: "Dermatology" },
    { name: "Dr. Betelhem Abraham", dept: "Dermatology" },
    // Gynecology
    { name: "Dr. Tsehaynesh Tsegaye", dept: "Gynecology" },
    { name: "Dr. Liya Fikre", dept: "Gynecology" },
  ];

  const doctors = [];
  phoneCounter = 10;
  for (const doc of doctorsData) {
    const cleanName = doc.name
      .replace("Dr. ", "")
      .toLowerCase()
      .replace(" ", ".");
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
          },
        },
      },
    });
    doctors.push(createdDoc);
    phoneCounter++;
  }
  console.log(`✅ Created 15 doctors\n`);

  // 6. Create Patient Users
  // 6. Create Patient Users

  console.log("🏥 Creating patient users...");
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
    { name: "Biruk Tadesse", gender: "MALE" },
    { name: "Hanna Gebre", gender: "FEMALE" },
    { name: "Natnael Berhanu", gender: "MALE" },
    { name: "Selamawit Girmay", gender: "FEMALE" },
    { name: "Robel Tekle", gender: "MALE" },
  ];

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const patients = [];
  phoneCounter = 1;
  for (let i = 0; i < patientNames.length; i++) {
    const pt = patientNames[i];
    const email = `${pt.name.toLowerCase().replace(" ", ".")}@email.com`;
    const formattedPhone =
      phoneCounter < 10 ? `0${phoneCounter}` : `${phoneCounter}`;

    // Random DOB between 1975 and 2000
    const year = Math.floor(Math.random() * (2000 - 1975 + 1)) + 1975;
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;
    const dob = new Date(year, month, day);

    // Random blood type
    const bloodType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];

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
            bloodType,
            cardNumber: `BK-P-2026-${String(phoneCounter).padStart(4, "0")}`,
          },
        },
      },
    });
    patients.push(createdPt);
    phoneCounter++;
  }
  console.log(`✅ Created 20 patients\n`);

  // 7. Create Appointments
  console.log("📅 Creating appointments...");
  const appointmentStatuses = [
    "SCHEDULED",
    "COMPLETED",
    "CANCELLED",
    "RESCHEDULED",
  ];
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

  // Fetch the actual patient, doctor, and receptionist records to get their role IDs
  const patientRecords = await prisma.patient.findMany();
  const doctorRecords = await prisma.doctor.findMany();
  const receptionistRecords = await prisma.receptionist.findMany();

  const appointments = [];
  // Create 2-3 appointments per patient
  for (const patient of patientRecords) {
    const numAppts = Math.floor(Math.random() * 2) + 2; // 2 or 3

    for (let i = 0; i < numAppts; i++) {
      // Pick a random doctor
      const randomDoctor =
        doctorRecords[Math.floor(Math.random() * doctorRecords.length)];
      // Pick a random receptionist
      const randomReceptionist =
        receptionistRecords[
          Math.floor(Math.random() * receptionistRecords.length)
        ];

      // Random date within the last 30 days or next 15 days
      const daysOffset = Math.floor(Math.random() * 45) - 30;
      const apptDate = new Date();
      apptDate.setDate(apptDate.getDate() + daysOffset);

      // Set time between 9 AM and 4 PM
      apptDate.setHours(Math.floor(Math.random() * 8) + 9, 0, 0, 0);

      // Determine status based on date
      let status = "SCHEDULED";
      if (daysOffset < 0) {
        status = Math.random() > 0.2 ? "COMPLETED" : "CANCELLED";
      }

      const createdAppt = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: randomDoctor.id,
          receptionistId: randomReceptionist.id,
          dateTime: apptDate,
          status: status as any,
          reason: reasons[Math.floor(Math.random() * reasons.length)],
        },
      });
      appointments.push(createdAppt);
    }
  }
  console.log(`✅ Created ${appointments.length} appointments\n`);

  // 8. Create Medical Records
  console.log("📋 Creating medical records...");
  const medicalRecords = [];
  const completedAppointments = appointments.filter(
    (a) => a.status === "COMPLETED",
  );

  const diagnoses = [
    "Acute viral pharyngitis",
    "Essential hypertension",
    "Type 2 diabetes mellitus",
    "Allergic rhinitis",
    "Gastroesophageal reflux disease",
    "Vitamin D deficiency",
    "Migraine without aura",
    "Contact dermatitis",
  ];

  const prescriptions = [
    "Amoxicillin 500mg, 1 tablet TID for 7 days",
    "Lisinopril 10mg, 1 tablet daily",
    "Metformin 500mg, 1 tablet BID",
    "Loratadine 10mg, 1 tablet daily",
    "Omeprazole 20mg, 1 capsule daily before breakfast",
    "Cholecalciferol 1000 IU, 1 tablet daily",
    "Sumatriptan 50mg as needed for pain",
    "Hydrocortisone 1% cream, apply BID to affected area",
  ];

  // Create a medical record for about 80% of completed appointments
  for (const appt of completedAppointments) {
    if (Math.random() > 0.2) {
      const randomIndex = Math.floor(Math.random() * diagnoses.length);

      const record = await prisma.medicalRecord.create({
        data: {
          patientId: appt.patientId,
          doctorId: appt.doctorId,
          diagnosis: diagnoses[randomIndex],
          prescription: prescriptions[randomIndex],
          notes: "Patient advised to follow up in 2 weeks if symptoms persist.",
          date: appt.dateTime,
        },
      });
      medicalRecords.push(record);
    }
  }
  console.log(`✅ Created ${medicalRecords.length} medical records\n`);

  // Summary
  console.log("✨ Seeding completed successfully!\n");
  console.log("📊 Summary:");
  console.log(`   - Departments: 14`);
  console.log(`   - Admins: 1`);
  console.log(`   - Receptionists: 5`);
  console.log(`   - Doctors: 15`);
  console.log(`   - Patients: 20`);
  console.log(`   - Appointments: ${appointments.length}`);
  console.log(`   - Medical Records: ${medicalRecords.length}`);
  console.log("\n🔑 Login Credentials (all users):");
  console.log("   Password: password123@\n");
  console.log("   Admin: admin@medicare.com");
  console.log("   Receptionist (e.g.): azeb.hailu@medicare.com");
  console.log("   Doctor (e.g.): abebech.demissie@medicare.com");
  console.log("   Patient (e.g.): almaz.bekele@email.com");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
