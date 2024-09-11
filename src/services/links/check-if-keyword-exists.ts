import { punyEncode } from "@/lib/vendors";
import { db } from "@/server/db";

export const checkIfKeywordExists = async (domain: string, keyword: string) => {
  try {
    await db.link.findFirst({
      where: {
        domain,
        keyword: punyEncode(decodeURIComponent(keyword)),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "RECORD_NOT_FOUND") {
        return false;
      }
    }
    throw error;
  }
};
