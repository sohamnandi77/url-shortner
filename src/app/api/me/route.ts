import { withSession } from "@/lib/with-session";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

// GET /api/me - get the current user
export const GET = withSession(async ({ session }) => {
  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      email: true,
      id: true,
      name: true,
    },
  });
  return NextResponse.json(user);
});
