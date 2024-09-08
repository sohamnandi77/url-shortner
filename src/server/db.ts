import { env } from "@/env";
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// Extend the global interface to include the prisma property
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const connectionString = `${env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);

export const db: PrismaClient =
  globalThis.prisma ?? new PrismaClient({ adapter, log: ["query"] });

if (env.NODE_ENV !== "production") globalThis.prisma = db;
