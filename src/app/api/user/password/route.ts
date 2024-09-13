import { hashPassword, validatePassword } from "@/lib/auth/password";
import { ApiError } from "@/lib/errors";
import { parseRequestBody } from "@/lib/parse-request-body";
import { withSession } from "@/lib/with-session";
import { UpdatePasswordSchema } from "@/schema/user";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

// PATCH /api/user/password - updates the user's password
export const PATCH = withSession(async ({ req, session }) => {
  const { currentPassword, newPassword } = UpdatePasswordSchema.parse(
    await parseRequestBody(req),
  );

  const { password: passwordHash } = await db.user.findUniqueOrThrow({
    where: {
      id: session.user.id,
    },
    select: {
      password: true,
    },
  });

  if (!passwordHash) {
    throw new ApiError({
      code: "BAD_REQUEST",
      message: "You don't have a password set. Please set a password first.",
    });
  }

  const passwordMatch = await validatePassword({
    password: currentPassword,
    passwordHash,
  });

  if (!passwordMatch) {
    throw new ApiError({
      code: "UNAUTHORIZED",
      message: "The password you entered is incorrect.",
    });
  }

  await db.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      password: await hashPassword(newPassword),
    },
  });

  return NextResponse.json({ ok: true });
});
