import { MAX_LOGIN_ATTEMPTS } from "@/constants/main";
import { db } from "@/server/db";
import { type User } from "@prisma/client";

export const incrementLoginAttempts = async (
  user: Pick<User, "id" | "email">,
) => {
  const { invalidLoginAttempts, lockedAt } = await db.user.update({
    where: { id: user.id },
    data: {
      invalidLoginAttempts: {
        increment: 1,
      },
    },
    select: {
      lockedAt: true,
      invalidLoginAttempts: true,
    },
  });

  if (!lockedAt && invalidLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    await db.user.update({
      where: { id: user.id },
      data: {
        lockedAt: new Date(),
      },
    });
  }

  return {
    invalidLoginAttempts,
    lockedAt,
  };
};

export const exceededLoginAttemptsThreshold = (
  user: Pick<User, "invalidLoginAttempts">,
) => {
  return user.invalidLoginAttempts >= MAX_LOGIN_ATTEMPTS;
};

export const resetLoginAttempts = async (user: Pick<User, "id">) => {
  await db.user.update({
    where: { id: user.id },
    data: {
      invalidLoginAttempts: 0,
      lockedAt: null,
    },
  });
};
