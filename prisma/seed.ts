// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt-ts";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up database...");
  await prisma.appointment.deleteMany({});
  await prisma.medicalRecord.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.receptionist.deleteMany({});
  await prisma.admin.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedPassword = await hash("password123", 10);

  const seedData: {
    name: string;
    email: string;
    role: string;
    phone: string;
    specialization?: string;
    bloodType?: string;
    dateOfBirth?: Date;
    cardNumber?: string;
  }[] = [
    {
      name: "System Admin",
      email: "admin@hospital.com",
      role: "ADMIN",
      phone: "+251911000000",
    },
    // --- DOCTORS ---
    {
      name: "Dr. Alex Johnson",
      email: "dr.alex@hospital.com",
      role: "DOCTOR",
      phone: "+251933222222",
      specialization: "Cardiology",
    },
    {
      name: "Dr. Fatuma Abdi",
      email: "dr.fatuma@hospital.com",
      role: "DOCTOR",
      phone: "+251933444455",
      specialization: "Pediatrics",
    },
    {
      name: "Dr. Megersa Bekele",
      email: "dr.megersa@hospital.com",
      role: "DOCTOR",
      phone: "+251933667788",
      specialization: "Internal Medicine",
    },
    // --- RECEPTIONISTS ---
    {
      name: "Sara Reception",
      email: "reception@hospital.com",
      role: "RECEPTIONIST",
      phone: "+251922111111",
    },
    {
      name: "Chaltu Gemechu",
      email: "chaltu@hospital.com",
      role: "RECEPTIONIST",
      phone: "+251922999888",
    },
    // --- PATIENTS ---
    {
      name: "John Patient",
      email: "patient@hospital.com",
      role: "PATIENT",
      phone: "+251944333333",
      bloodType: "O+",
      dateOfBirth: new Date("1990-01-01"),
      cardNumber: "BK-P-2026-0001",
    },
    {
      name: "Amina Hassan",
      email: "amina.hassan@gmail.com",
      role: "PATIENT",
      phone: "+251911223344",
      bloodType: "A+",
      dateOfBirth: new Date("1995-06-15"),
      cardNumber: "BK-P-2026-0002",
    },
    {
      name: "Tesfaye Girma",
      email: "tesfaye.girma@gmail.com",
      role: "PATIENT",
      phone: "+251922334455",
      bloodType: "B+",
      dateOfBirth: new Date("1982-11-20"),
      cardNumber: "BK-P-2026-0003",
    },
    {
      name: "Hana Tadesse",
      email: "hana.tadesse@gmail.com",
      role: "PATIENT",
      phone: "+251933445566",
      bloodType: "AB-",
      dateOfBirth: new Date("2001-03-08"),
      cardNumber: "BK-P-2026-0004",
    },
    {
      name: "Bekele Worku",
      email: "bekele.worku@gmail.com",
      role: "PATIENT",
      phone: "+251944556677",
      bloodType: "O-",
      dateOfBirth: new Date("1975-09-25"),
      cardNumber: "BK-P-2026-0005",
    },
    {
      name: "Liya Solomon",
      email: "liya.solomon@gmail.com",
      role: "PATIENT",
      phone: "+251955667788",
      bloodType: "A-",
      dateOfBirth: new Date("1998-12-01"),
      cardNumber: "BK-P-2026-0006",
    },
  ];

  console.log("Seeding users...");

  for (const data of seedData) {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role as any,
        password: hashedPassword, 
        
        // Create role-specific record
        ...(data.role === "ADMIN" && { admin: { create: {} } }),
        ...(data.role === "DOCTOR" && { 
          doctor: { create: { specialization: data.specialization || "General Medicine" } } 
        }),
        ...(data.role === "RECEPTIONIST" && { receptionist: { create: {} } }),
        ...(data.role === "PATIENT" && { 
          patient: { 
            create: { 
              bloodType: data.bloodType || "A+", 
              dateOfBirth: data.dateOfBirth || new Date("1985-05-05"),
              cardNumber: data.cardNumber,
            } 
          } 
        }),

        // IMPORTANT: Create the Better Auth Account record
        accounts: {
          create: {
            accountId: data.email,
            providerId: "credential",
            password: hashedPassword,
          }
        }
      },
    });

    console.log(`✅ Created ${data.role}: ${user.email}`);
  }

  console.log("\n🎉 Database seeded successfully!");
  console.log("Credentials for all users:");
  console.log("Password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
