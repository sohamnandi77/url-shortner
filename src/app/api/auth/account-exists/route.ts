import { getUserByEmail } from "@/data/user";
import { NextResponse, type NextRequest } from "next/server";

// POST /api/auth/account-exists - check if an account exists for a given email
export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email: string };

  const user = await getUserByEmail(email);

  if (user) {
    return NextResponse.json({
      accountExists: true,
      hasPassword: !!user.password,
    });
  }

  return NextResponse.json({ accountExists: false, hasPassword: false });
}
