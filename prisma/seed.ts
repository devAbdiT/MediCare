// prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt-ts";
import { longFormatters } from "date-fns";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("🌱 Starting database seeding...\n");

  // Clear existing data (optional - comment out if you want to keep existing data)
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
  const hashedPassword = await hash("password123", 10);

  // 1. Create Departments
  console.log("🏥 Creating departments...");
  const departmentData = [
    {
      name: "Cardiology",
      description: "Heart and cardiovascular system care",
    },
    {
      name: "Pediatrics",
      description: "Medical care for infants, children, and adolescents",
    },
    {
      name: "Orthopedics",
      description: "Musculoskeletal system treatment",
    },
    {
      name: "Neurology",
      description: "Nervous system disorders treatment",
    },
    {
      name: "Dermatology",
      description: "Skin, hair, and nail conditions",
    },
    {
      name: "General Medicine",
      description: "General health and wellness care",
    },
  ];

  const departments = [];
  for (const data of departmentData) {
    const dept = await prisma.department.upsert({
      where: { name: data.name },
      update: { description: data.description },
      create: data,
    });
    departments.push(dept);
  }
  console.log(`✅ Created/verified ${departments.length} departments\n`);

  // 2. Create Admin User
  console.log("👤 Creating admin user...");
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@hospital.com",
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
  console.log(`✅ Admin created: ${adminUser.email} / password123\n`);

  // 3. Create Receptionist Users
  console.log("👤 Creating receptionist users...");
  const receptionistData = [
    {
      name: "Sarah Johnson",
      email: "receptionist1@hospital.com",
      phone: "+251911000002",
      role: "RECEPTIONIST" as const,
      emailVerified: true,
      accounts: {
        create: {
          accountId: "receptionist1-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
      receptionist: {
        create: {},
      },
    },
    {
      name: "Emily Davis",
      email: "receptionist2@hospital.com",
      phone: "+251911000003",
      role: "RECEPTIONIST" as const,
      emailVerified: true,
      accounts: {
        create: {
          accountId: "receptionist2-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
      receptionist: {
        create: {},
      },
    },
  ];

  const receptionists = [];
  for (const data of receptionistData) {
    const rec = await prisma.user.create({ data });
    receptionists.push(rec);
  }
  console.log(`✅ Created ${receptionists.length} receptionists\n`);

  // 4. Create Doctor Users
  console.log("👨‍⚕️ Creating doctor users...");
  const doctorData = [
    {
      name: "Dr. Michael Chen",
      email: "doctor1@hospital.com",
      phone: "+251911000010",
      role: "DOCTOR" as const,
      emailVerified: true,
      accounts: {
        create: {
          accountId: "doctor1-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
      doctor: {
        create: {
          specialization: "Cardiologist",
          departmentId: departments[0].id, // Cardiology
        },
      },
    },
    {
      name: "Dr. Sarah Williams",
      email: "doctor2@hospital.com",
      phone: "+251911000011",
      role: "DOCTOR" as const,
      emailVerified: true,
      accounts: {
        create: {
          accountId: "doctor2-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
      doctor: {
        create: {
          specialization: "Pediatrician",
          departmentId: departments[1].id, // Pediatrics
        },
      },
    },
    {
      name: "Dr. James Anderson",
      email: "doctor3@hospital.com",
      phone: "+251911000012",
      role: "DOCTOR" as const,
      emailVerified: true,
      accounts: {
        create: {
          accountId: "doctor3-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
      doctor: {
        create: {
          specialization: "Orthopedic Surgeon",
          departmentId: departments[2].id, // Orthopedics
        },
      },
    },
    {
      name: "Dr. Lisa Martinez",
      email: "doctor4@hospital.com",
      phone: "+251911000013",
      role: "DOCTOR" as const,
      emailVerified: true,
      accounts: {
        create: {
          accountId: "doctor4-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
      doctor: {
        create: {
          specialization: "Neurologist",
          departmentId: departments[3].id, // Neurology
        },
      },
    },
    {
      name: "Dr. Robert Taylor",
      email: "doctor5@hospital.com",
      phone: "+251911000014",
      role: "DOCTOR" as const,
      emailVerified: true,
      accounts: {
        create: {
          accountId: "doctor5-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
      doctor: {
        create: {
          specialization: "Dermatologist",
          departmentId: departments[4].id, // Dermatology
        },
      },
    },
    {
      name: "Dr. Amanda White",
      email: "doctor6@hospital.com",
      phone: "+251911000015",
      role: "DOCTOR" as const,
      emailVerified: true,
      accounts: {
        create: {
          accountId: "doctor6-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
      doctor: {
        create: {
          specialization: "General Practitioner",
          departmentId: departments[5].id, // General Medicine
        },
      },
    },
  ];

  const doctors = [];
  for (const data of doctorData) {
    const doc = await prisma.user.create({ data });
    doctors.push(doc);
  }
  console.log(`✅ Created ${doctors.length} doctors\n`);

  // 5. Create Patient Users
  console.log("🏥 Creating patient users...");
  const patientData = [
    {
      name: "John Smith",
      email: "patient1@example.com",
      phone: "+251911000100",
      role: "PATIENT" as const,
      emailVerified: true,
      accounts: {
        create: {
          accountId: "patient1-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
      patient: {
        create: {
          dateOfBirth: new Date("1990-05-15"),
          bloodType: "O+",
          cardNumber: "BK-P-2026-0001",
        },
      },
    },
    {
      name: "Emma Brown",
      email: "patient2@example.com",
      phone: "+251911000101",
      role: "PATIENT" as const,
      emailVerified: true,
      accounts: {
        create: {
          accountId: "patient2-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
      patient: {
        create: {
          dateOfBirth: new Date("1985-08-22"),
          bloodType: "A+",
          cardNumber: "BK-P-2026-0002",
        },
      },
    },
    {
      name: "David Wilson",
      email: "patient3@example.com",
      phone: "+251911000102",
      role: "PATIENT" as const,
      emailVerified: true,
      accounts: {
        create: {
          accountId: "patient3-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
      patient: {
        create: {
          dateOfBirth: new Date("1995-03-10"),
          bloodType: "B+",
          cardNumber: "BK-P-2026-0003",
        },
      },
    },
    {
      name: "Sophia Garcia",
      email: "patient4@example.com",
      phone: "+251911000103",
      role: "PATIENT" as const,
      emailVerified: true,
      accounts: {
        create: {
          accountId: "patient4-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
      patient: {
        create: {
          dateOfBirth: new Date("2000-11-30"),
          bloodType: "AB+",
          cardNumber: "BK-P-2026-0004",
        },
      },
    },
    {
      name: "Oliver Martinez",
      email: "patient5@example.com",
      phone: "+251911000104",
      role: "PATIENT" as const,
      emailVerified: true,
      accounts: {
        create: {
          accountId: "patient5-account",
          providerId: "credential",
          password: hashedPassword,
        },
      },
      patient: {
        create: {
          dateOfBirth: new Date("1988-07-18"),
          bloodType: "O-",
          cardNumber: "BK-P-2026-0005",
        },
      },
    },
  ];

  const patients = [];
  for (const data of patientData) {
    const pat = await prisma.user.create({ data });
    patients.push(pat);
  }
  console.log(`✅ Created ${patients.length} patients\n`);

  // 6. Get patient and doctor IDs for appointments
  const patientRecords = await prisma.patient.findMany({
    include: { user: true },
  });
  const doctorRecords = await prisma.doctor.findMany({
    include: { user: true },
  });
  const receptionistRecords = await prisma.receptionist.findMany();

  // 7. Create Appointments
  console.log("📅 Creating appointments...");
  const appointmentData = [
    {
      patientId: patientRecords[0].id,
      doctorId: doctorRecords[0].id,
      receptionistId: receptionistRecords[0].id,
      dateTime: new Date("2026-05-20T10:00:00"),
      status: "SCHEDULED" as const,
      reason: "Regular checkup for heart condition",
    },
    {
      patientId: patientRecords[1].id,
      doctorId: doctorRecords[1].id,
      receptionistId: receptionistRecords[0].id,
      dateTime: new Date("2026-05-21T14:00:00"),
      status: "SCHEDULED" as const,
      reason: "Child vaccination",
    },
    {
      patientId: patientRecords[2].id,
      doctorId: doctorRecords[2].id,
      receptionistId: receptionistRecords[1].id,
      dateTime: new Date("2026-05-22T09:00:00"),
      status: "SCHEDULED" as const,
      reason: "Knee pain consultation",
    },
    {
      patientId: patientRecords[3].id,
      doctorId: doctorRecords[3].id,
      receptionistId: receptionistRecords[1].id,
      dateTime: new Date("2026-05-15T11:00:00"),
      status: "COMPLETED" as const,
      reason: "Headache and dizziness",
    },
    {
      patientId: patientRecords[4].id,
      doctorId: doctorRecords[4].id,
      receptionistId: receptionistRecords[0].id,
      dateTime: new Date("2026-05-16T15:30:00"),
      status: "COMPLETED" as const,
      reason: "Skin rash examination",
    },
  ];

  const appointments = [];
  for (const data of appointmentData) {
    const appt = await prisma.appointment.create({ data });
    appointments.push(appt);
  }
  console.log(`✅ Created ${appointments.length} appointments\n`);

  // 8. Create Medical Records (for completed appointments)
  console.log("📋 Creating medical records...");
  const medicalRecordData = [
    {
      patientId: patientRecords[3].id,
      doctorId: doctorRecords[3].id,
      diagnosis: "Tension headache",
      prescription: "Ibuprofen 400mg, twice daily for 5 days",
      notes: "Patient advised to reduce screen time and get adequate rest",
      date: new Date("2026-05-15T11:30:00"),
    },
    {
      patientId: patientRecords[4].id,
      doctorId: doctorRecords[4].id,
      diagnosis: "Contact dermatitis",
      prescription: "Hydrocortisone cream 1%, apply twice daily",
      notes:
        "Avoid contact with suspected allergen. Follow up in 2 weeks if no improvement",
      date: new Date("2026-05-16T16:00:00"),
    },
  ];

  const medicalRecords = [];
  for (const data of medicalRecordData) {
    const rec = await prisma.medicalRecord.create({ data });
    medicalRecords.push(rec);
  }
  console.log(`✅ Created ${medicalRecords.length} medical records\n`);

  // Summary
  console.log("✨ Seeding completed successfully!\n");
  console.log("📊 Summary:");
  console.log(`   - Departments: ${departments.length}`);
  console.log(`   - Admins: 1`);
  console.log(`   - Receptionists: ${receptionists.length}`);
  console.log(`   - Doctors: ${doctors.length}`);
  console.log(`   - Patients: ${patients.length}`);
  console.log(`   - Appointments: ${appointments.length}`);
  console.log(`   - Medical Records: ${medicalRecords.length}`);
  console.log("\n🔑 Login Credentials (all users):");
  console.log("   Password: password123\n");
  console.log("   Admin: admin@hospital.com");
  console.log("   Receptionist 1: receptionist1@hospital.com");
  console.log("   Receptionist 2: receptionist2@hospital.com");
  console.log("   Doctor 1: doctor1@hospital.com (Cardiologist)");
  console.log("   Doctor 2: doctor2@hospital.com (Pediatrician)");
  console.log("   Doctor 3: doctor3@hospital.com (Orthopedic Surgeon)");
  console.log("   Doctor 4: doctor4@hospital.com (Neurologist)");
  console.log("   Doctor 5: doctor5@hospital.com (Dermatologist)");
  console.log("   Doctor 6: doctor6@hospital.com (General Practitioner)");
  console.log("   Patient 1: patient1@example.com");
  console.log("   Patient 2: patient2@example.com");
  console.log("   Patient 3: patient3@example.com");
  console.log("   Patient 4: patient4@example.com");
  console.log("   Patient 5: patient5@example.com");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
