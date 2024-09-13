import { PASSWORD_RESET_TOKEN_EXPIRY } from "@/constants/main";
import { env } from "@/env";
import { ApiError } from "@/lib/errors";
import { withSession } from "@/lib/with-session";
import { db } from "@/server/db";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

// POST /api/user/set-password - set account password (for users who signed up with a OAuth provider)
export const POST = withSession(async ({ session }) => {
  if (!session.user.email) {
    throw new ApiError({
      code: "BAD_REQUEST",
      message: "You must be logged in to set your password.",
    });
  }

  const user = await db.user.findFirst({
    where: {
      id: session.user.id,
      password: null,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new ApiError({
      code: "BAD_REQUEST",
      message:
        "You already have a password set. You can change it in your account settings.",
    });
  }

  const { token } = await db.verificationToken.create({
    data: {
      identifier: session.user.email,
      token: randomBytes(32).toString("hex"),
      expires: new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY * 1000),
    },
  });

  // Send email with password reset link
  // await sendEmail({
  //   subject: `${process.env.NEXT_PUBLIC_APP_NAME}: Password reset instructions`,
  //   email: session.user.email,
  //   react: ResetPasswordLink({
  //     email: session.user.email,
  //     url: `${process.env.NEXTAUTH_URL}/auth/reset-password/${token}`,
  //   }),
  // });

  if (env.NODE_ENV === "development") {
    console.info(
      "Password reset URL:",
      `${env.NEXTAUTH_URL}/auth/reset-password/${token}`,
    );
  }

  return NextResponse.json({ ok: true });
});
