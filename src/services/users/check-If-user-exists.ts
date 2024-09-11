import { db } from "@/server/db";

export const checkIfUserExists = async (userId: string) => {
  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
  });
  return !!user;
};
