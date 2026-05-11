import { PrismaClient, Role, AppointmentStatus } from "@prisma/client";
import { hash } from "bcrypt-ts";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Clear existing data in correct dependency order
  console.log("🧹 Clearing existing data...");
  await prisma.department.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.receptionist.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();

  // Common password hash for everyone except admin
  const defaultPasswordHash = await hash("password123", 10);
  const adminPasswordHash = await hash("Admin123!", 10);

  // 2. Create Admin
  console.log("👑 Creating Admin user...");
  const adminUser = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@hospital.com",
      phone: "+251911111100",
      role: Role.ADMIN,
      admin: {
        create: {}
      }
    }
  });
  
  await prisma.account.create({
    data: {
      userId: adminUser.id,
      accountId: adminUser.id,
      providerId: "credential",
      password: adminPasswordHash
    }
  });

  // 3. Create Receptionists
  console.log("📞 Creating Receptionists...");
  const receptionistsData = [
    { name: "Sarah Wilson", email: "sarah@hospital.com", phone: "+251911111111" },
    { name: "Mike Tefera", email: "mike@hospital.com", phone: "+251911111112" },
    { name: "Helen Girma", email: "helen@hospital.com", phone: "+251911111113" },
  ];

  const receptionists = [];
  for (const rep of receptionistsData) {
    const user = await prisma.user.create({
      data: {
        name: rep.name,
        email: rep.email,
        phone: rep.phone,
        role: Role.RECEPTIONIST,
        receptionist: {
          create: {}
        }
      },
      include: { receptionist: true }
    });
    
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: defaultPasswordHash
      }
    });
    
    receptionists.push(user);
  }

  // 4. Create Departments & Doctors
  console.log("🩺 Creating Departments & Doctors...");
  const departments = [
    "Cardiology", "Pediatrics", "Orthopedics", "Neurology", "Dermatology", 
    "Radiology", "Emergency Medicine", "General Surgery", "Obstetrics & Gynecology", 
    "Ophthalmology", "Urology", "Psychiatry"
  ];

  const doctors = [];
  for (const dept of departments) {
    // Create the department
    const departmentRecord = await prisma.department.create({
      data: {
        name: dept,
        description: `${dept} Department`
      }
    });

    for (let i = 1; i <= 2; i++) {
      const formattedDept = dept.toLowerCase().replace(/[^a-z0-9]/g, "");
      const user = await prisma.user.create({
        data: {
          name: `Dr. ${dept} Specialist ${i}`,
          email: `doctor${i}.${formattedDept}@hospital.com`,
          phone: `+2519200000${doctors.length < 10 ? '0' + doctors.length : doctors.length}`,
          role: Role.DOCTOR,
          doctor: {
            create: {
              specialization: dept,
              departmentId: departmentRecord.id
            }
          }
        },
        include: { doctor: true }
      });
      
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: defaultPasswordHash
        }
      });
      
      doctors.push(user);
    }
  }

  // 5. Create Patients
  console.log("🩻 Creating Patients...");
  const patientsData = [
    { name: "Abebe Kebede", email: "abebe@email.com", phone: "0912345678", dob: "1985-03-15", blood: "A+" },
    { name: "Tigist Haile", email: "tigist@email.com", phone: "0912345679", dob: "1990-07-22", blood: "O+" },
    { name: "Lemma Bekele", email: "lemma@email.com", phone: "0912345680", dob: "1978-11-05", blood: "B+" },
    { name: "Sara Mohammed", email: "sara@email.com", phone: "0912345681", dob: "1995-01-30", blood: "AB-" },
    { name: "Girma Assefa", email: "girma@email.com", phone: "0912345682", dob: "1982-06-18", blood: "A-" },
    { name: "Meron Daniel", email: "meron@email.com", phone: "0912345683", dob: "2000-09-12", blood: "O-" },
    { name: "Tesfaye Alemu", email: "tesfaye@email.com", phone: "0912345684", dob: "1975-04-25", blood: "B-" },
    { name: "Hiwot Negash", email: "hiwot@email.com", phone: "0912345685", dob: "1988-12-03", blood: "AB+" },
    { name: "Yonas Desta", email: "yonas@email.com", phone: "0912345686", dob: "1992-08-14", blood: "A+" },
    { name: "Frehiwot Tsegaye", email: "frehiwot@email.com", phone: "0912345687", dob: "1980-10-09", blood: "O+" },
  ];

  const patients = [];
  let cardCounter = 1000;
  for (const pat of patientsData) {
    const user = await prisma.user.create({
      data: {
        name: pat.name,
        email: pat.email,
        phone: pat.phone,
        role: Role.PATIENT,
        patient: {
          create: {
            dateOfBirth: new Date(pat.dob),
            bloodType: pat.blood,
            cardNumber: `PT-${cardCounter++}`
          }
        }
      },
      include: { patient: true }
    });
    
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: defaultPasswordHash
      }
    });
    
    patients.push(user);
  }

  // 6. Create Appointments & Medical Records
  console.log("📅 Creating Appointments & Medical Records...");
  
  const now = new Date();
  const appointmentConfigs = [
    // Past completed appointments
    { dayOffset: -10, status: AppointmentStatus.COMPLETED, diag: "Seasonal Flu", presc: "Paracetamol 500mg twice daily for 5 days" },
    { dayOffset: -8, status: AppointmentStatus.COMPLETED, diag: "Hypertension", presc: "Lisinopril 10mg daily" },
    { dayOffset: -5, status: AppointmentStatus.COMPLETED, diag: "Asthma", presc: "Albuterol inhaler as needed" },
    { dayOffset: -3, status: AppointmentStatus.COMPLETED, diag: "Mild sprain", presc: "Rest, ice, and Ibuprofen 400mg" },
    { dayOffset: -2, status: AppointmentStatus.COMPLETED, diag: "Allergic Rhinitis", presc: "Cetirizine 10mg daily" },
    
    // Past cancelled appointments
    { dayOffset: -4, status: AppointmentStatus.CANCELLED },
    { dayOffset: -1, status: AppointmentStatus.CANCELLED },

    // Upcoming scheduled appointments
    { dayOffset: 1, status: AppointmentStatus.SCHEDULED },
    { dayOffset: 2, status: AppointmentStatus.SCHEDULED },
    { dayOffset: 2, status: AppointmentStatus.SCHEDULED },
    { dayOffset: 3, status: AppointmentStatus.SCHEDULED },
    { dayOffset: 4, status: AppointmentStatus.SCHEDULED },
    { dayOffset: 5, status: AppointmentStatus.SCHEDULED },
    { dayOffset: 6, status: AppointmentStatus.SCHEDULED },
    { dayOffset: 7, status: AppointmentStatus.SCHEDULED },
  ];

  for (let i = 0; i < appointmentConfigs.length; i++) {
    const config = appointmentConfigs[i];
    
    // Pick a random patient and doctor
    const patient = patients[i % patients.length].patient!;
    const doctor = doctors[i % doctors.length].doctor!;
    const receptionist = receptionists[i % receptionists.length].receptionist!;

    const aptDate = new Date(now);
    aptDate.setDate(now.getDate() + config.dayOffset);
    aptDate.setHours(9 + (i % 8), 0, 0, 0); // Stagger hours between 9am and 4pm

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        receptionistId: receptionist.id,
        dateTime: aptDate,
        status: config.status,
        reason: "General consultation checkup"
      }
    });

    // Create medical record if completed
    if (config.status === AppointmentStatus.COMPLETED && config.diag && config.presc) {
      await prisma.medicalRecord.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          diagnosis: config.diag,
          prescription: config.presc,
          notes: "Routine follow-up completed successfully.",
          date: aptDate
        }
      });
    }
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
