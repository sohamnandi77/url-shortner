import { handleAndReturnErrorResponse } from "@/lib/errors";
import { UrlQuerySchema } from "@/schema/links";
import { NextResponse, type NextRequest } from "next/server";
import { getMetaTags } from "./utils";

export async function GET(req: NextRequest) {
  try {
    const { url } = UrlQuerySchema.parse({
      url: req.nextUrl.searchParams.get("url"),
    });

    const metatags = await getMetaTags(url);
    return NextResponse.json(
      {
        ...metatags,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    return handleAndReturnErrorResponse(error);
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
