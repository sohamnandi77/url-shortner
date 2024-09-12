import { db } from "@/server/db";
import { type IWorkspace } from "@/types";

export async function deleteWorkspace(
  workspace: Pick<IWorkspace, "id" | "slug" | "logo">,
) {
  const response = await db.workspaceUsers.deleteMany({
    where: {
      workspaceId: workspace.id,
    },
  });

  await Promise.all([
    // delete the workspace
    db.workspace.delete({
      where: {
        slug: workspace.slug,
      },
    }),
    db.user.updateMany({
      where: {
        defaultWorkspace: workspace.slug,
      },
      data: {
        defaultWorkspace: null,
      },
    }),
  ]);

  return response;
}
