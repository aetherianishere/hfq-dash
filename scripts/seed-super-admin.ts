import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generatePublicId } from "../src/lib/user-id";

const prisma = new PrismaClient();

async function main() {
  const email = (
    process.env.SUPER_ADMIN_EMAIL ?? "navidhuadeesha25@gmail.com"
  ).toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!password || password.length < 12) {
    throw new Error(
      "Set SUPER_ADMIN_PASSWORD to at least 12 characters before seeding the super admin.",
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: Role.SUPER_ADMIN,
        isFounder: true,
        emailVerified: true,
        isSuspended: false,
      },
    });
    console.log(`Updated ${email} to SUPER_ADMIN (${existing.publicId}).`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      publicId: generatePublicId(),
      email,
      passwordHash,
      role: Role.SUPER_ADMIN,
      isFounder: true,
      emailVerified: true,
      profile: {
        create: {
          firstName: "HFQ",
          lastName: "Admin",
          displayName: "HFQ Admin",
          setupStep: 4,
        },
      },
    },
  });

  console.log(`Created ${email} as SUPER_ADMIN with id ${user.publicId}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
