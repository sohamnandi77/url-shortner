import { db } from "@/server/db";

export async function updateLinksUsage({
  workspaceId,
  increment,
}: {
  workspaceId: string;
  increment: number;
}) {
  return await db.workspace.update({
    where: {
      id: workspaceId,
    },
    data: {
      linksUsage: {
        increment,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      linksUsage: true,
      linksLimit: true,
      plan: true,
    },
  });
}
