import { db } from "@/server/db";

export async function createDefaultWorkspace(
  userId?: string,
  slug?: string,
  inviteCode?: string,
) {
  try {
    if (!userId || !slug || !inviteCode) return null;

    // Create a default workspace for the user
    const workspace = await db.workspace.create({
      data: {
        name: "Personal",
        slug,
        inviteCode: inviteCode,
        createdBy: userId,
        updatedBy: userId,
        users: {
          create: {
            userId: userId,
            role: "ADMIN",
          },
        },
      },
    });

    // Optionally, update the user's default workspace
    await db.user.update({
      where: { id: userId },
      data: { defaultWorkspace: workspace.slug },
    });

    return workspace;
  } catch (error) {
    console.error(error);
    return null;
  }
}
