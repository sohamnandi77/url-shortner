import { Logger } from "next-axiom";
import { type NextRequest } from "next/server";

export default async function AxiomMiddleware(req: NextRequest) {
  const logger = new Logger({ source: "middleware" }); // traffic, request
  logger.middleware(req);
  await logger.flush();
}
