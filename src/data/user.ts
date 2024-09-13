import { db } from "@/server/db";

export const getUserByEmail = async (email?: string) => {
  try {
    if (!email) return null;
    const user = await db.user.findUnique({ where: { email } });

    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id?: string) => {
  try {
    if (!id) return null;
    const user = await db.user.findUnique({
      where: { id },
      omit: { password: true },
    });

    return user;
  } catch {
    return null;
  }
};
