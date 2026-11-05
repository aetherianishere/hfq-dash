import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateUniquePublicId } from "@/lib/user-id";

type Input = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
};

/**
 * Creates the user and profile in one transaction, retrying if the random
 * 15-character public id collides with an existing row.
 */
export async function createUserWithPublicId(input: Input) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const publicId = await generateUniquePublicId(async (id) => {
      const found = await prisma.user.findUnique({
        where: { publicId: id },
        select: { id: true },
      });
      return found !== null;
    });

    try {
      return await prisma.user.create({
        data: {
          publicId,
          email: input.email,
          passwordHash: input.passwordHash,
          emailVerified: true,
          profile: {
            create: {
              firstName: input.firstName,
              lastName: input.lastName,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = String(error.meta?.target ?? "");
        if (target.includes("public_id") || target.includes("publicId")) {
          continue;
        }
      }
      throw error;
    }
  }

  throw new Error("Could not allocate a unique public id");
}
