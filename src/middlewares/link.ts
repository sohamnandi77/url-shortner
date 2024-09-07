import { parse } from "@/lib/parse";
import { NextResponse, type NextRequest } from "next/server";

export default async function LinkMiddleware(req: NextRequest) {
  const { domain, fullKey: originalKey } = parse(req);

  if (!domain) {
    return NextResponse.next();
  }
}
