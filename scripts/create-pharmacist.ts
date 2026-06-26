import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt-ts";

const prisma = new PrismaClient();

async function main() {
  const email = "pharmacist@medicare.com";
  
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    console.log("Pharmacist account already exists:", existingUser.email);
    return;
  }

  const hashedPassword = await hash("password123@", 10);

  const user = await prisma.user.create({
    data: {
      name: "John Doe (Pharmacist)",
      email,
      phone: "+251911000004",
      role: "PHARMACIST",
      emailVerified: true,
      accounts: {
        create: {
          providerId: "credential",
          accountId: email, // Based on how better-auth credential provider was configured
          password: hashedPassword,
        },
      },
    },
  });

  console.log("Successfully created Pharmacist account!");
  console.log("Email:", email);
  console.log("Password: password123@");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
