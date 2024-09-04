import { db } from "@/server/db";

export const getTwoFactorConfirmationByUserId = async (userId?: string) => {
  try {
    if (!userId) return null;

    const twoFactorConfirmation = await db.twoFactorConfirmation.findUnique({
      where: { userId },
    });

    return twoFactorConfirmation;
  } catch {
    return null;
  }
};

export const deleteTwoFactorConfirmation = async (id: string) => {
  try {
    await db.twoFactorConfirmation.delete({ where: { id } });
  } catch {
    return null;
  }
};
