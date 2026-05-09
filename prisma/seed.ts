// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt-ts";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await hash("password123", 10);

  // Create Admin
  await prisma.user.upsert({
    where: { email: "admin@hospital.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@hospital.com",
      phone: "+251911000000",
      role: "ADMIN",
      password: hashedPassword,
      admin: { create: {} },
    },
  });

  // Create Doctor
  await prisma.user.upsert({
    where: { email: "dr.alex@hospital.com" },
    update: {},
    create: {
      name: "Dr. Alex Johnson",
      email: "dr.alex@hospital.com",
      phone: "+251933222222",
      role: "DOCTOR",
      password: hashedPassword,
      doctor: {
        create: { specialization: "Cardiology" },
      },
    },
  });

  // Create Receptionist
  await prisma.user.upsert({
    where: { email: "reception@hospital.com" },
    update: {},
    create: {
      name: "Sara Reception",
      email: "reception@hospital.com",
      phone: "+251922111111",
      role: "RECEPTIONIST",
      password: hashedPassword,
      receptionist: { create: {} },
    },
  });

  console.log("✅ Seed data created successfully!");
  console.log("\nDefault Credentials:");
  console.log("Admin        → admin@hospital.com / password123");
  console.log("Doctor       → dr.alex@hospital.com / password123");
  console.log("Receptionist → reception@hospital.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
