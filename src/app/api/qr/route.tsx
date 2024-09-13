import { handleAndReturnErrorResponse } from "@/lib/errors";
import { getSearchParams } from "@/lib/get-search-params";
import { QRCodeSVG } from "@/lib/qr";
import { getQRCodeQuerySchema } from "@/schema/qr";
import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const params = getSearchParams(req.url);
    const { url, size, level, fgColor, bgColor, includeMargin } =
      getQRCodeQuerySchema.parse(params);

    // const logo = req.nextUrl.searchParams.get("logo")

    return new ImageResponse(
      QRCodeSVG({
        value: url as string,
        size: size as number,
        level: level as "L" | "M" | "Q" | "H",
        includeMargin: includeMargin as boolean,
        fgColor: fgColor as string | undefined,
        bgColor: bgColor as string | undefined,
        // imageSettings: {
        //   src: logo,
        //   height: size / 4,
        //   width: size / 4,
        //   excavate: true,
        // },
      }),
      {
        width: size as number,
        height: size as number,
      },
    );
  } catch (error) {
    return handleAndReturnErrorResponse(error);
  }
}
