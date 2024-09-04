import { env } from "@/env";
import { getToken } from "next-auth/jwt";
import { type NextRequest } from "next/server";

export async function getUserViaToken(req: NextRequest) {
  const secret = env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }

  const session = await getToken({
    req,
    secret,
    salt: "",
  });

  return session?.user;
}
