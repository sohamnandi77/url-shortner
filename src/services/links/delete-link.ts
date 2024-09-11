import { db } from "@/server/db";

export async function deleteLink(linkId: string) {
  const link = await db.link.delete({
    where: {
      id: linkId,
    },
    include: {
      tags: true,
    },
  });

  if (link.workspaceId) {
    await db.workspace.update({
      where: {
        id: link.workspaceId,
      },
      data: {
        linksUsage: {
          decrement: 1,
        },
      },
    });
  }

  return link;
}
