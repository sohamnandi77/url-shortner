import { db } from "@/server/db";

export async function getDefaultWorkspaceByEmail(email?: string) {
  try {
    if (!email) return null;
    const user = await db.user.findFirst({
      where: { email },
      select: { defaultWorkspace: true },
    });

    return user?.defaultWorkspace;
  } catch {
    return null;
  }
}
