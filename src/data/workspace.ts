import { db } from "@/server/db";

export async function getDefaultWorkspaceByEmail(email?: string) {
  try {
    if (!email) return null;

    const user = await db.user.findFirst({
      where: { email },
    });

    return user?.defaultWorkspace ?? null;
  } catch (error) {
    console.error("Failed to get default workspace", error);
    return null;
  }
}
