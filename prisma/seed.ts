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
    {
      name: "Dr. Alex Johnson",
      email: "dr.alex@hospital.com",
      role: "DOCTOR",
      phone: "+251933222222",
      specialization: "Cardiology",
    },
    {
      name: "Sara Reception",
      email: "reception@hospital.com",
      role: "RECEPTIONIST",
      phone: "+251922111111",
    },
    {
      name: "John Patient",
      email: "patient@hospital.com",
      role: "PATIENT",
      phone: "+251944333333",
      bloodType: "O+",
      dateOfBirth: new Date("1990-01-01"),
      cardNumber: "BK-P-2026-0001",
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
