import { db } from "@/server/db";

export const getLinksBasedOnDomainAndKey = async (
  domain: string,
  key: string,
) => {
  try {
    const response = await db.link.findFirstOrThrow({
      where: {
        domain,
        keyword: key,
      },
    });

    return response;
  } catch {
    return null;
  }
};
