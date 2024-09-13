import { hashPassword } from "@/lib/auth/password";
import { ApiError, handleAndReturnErrorResponse } from "@/lib/errors";
import { parseRequestBody } from "@/lib/parse-request-body";
import { ResetPasswordSchema } from "@/schema/user";
import { db } from "@/server/db";
import { type NextRequest, NextResponse } from "next/server";

// POST /api/auth/reset-password - reset password using the reset token
export async function POST(req: NextRequest) {
  try {
    const { token, password } = ResetPasswordSchema.parse(
      await parseRequestBody(req),
    );

    // Find the token
    const tokenFound = await db.verificationToken.findFirst({
      where: {
        token,
        expires: {
          gte: new Date(),
        },
      },
      select: {
        identifier: true,
      },
    });

    if (!tokenFound) {
      throw new ApiError({
        code: "NOT_FOUND",
        message:
          "Password reset token not found or expired. Please request a new one.",
      });
    }

    const { identifier } = tokenFound;

    await db.$transaction([
      // Delete the token
      db.verificationToken.deleteMany({
        where: {
          token,
        },
      }),

      // Update the user's password
      db.user.update({
        where: {
          email: identifier,
        },
        data: {
          password: await hashPassword(password),
          lockedAt: null, // Unlock the account after a successful password reset
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAndReturnErrorResponse(error);
  }
}
