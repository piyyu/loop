import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getNativeConnectionString(url: string): string {
  if (url.startsWith("prisma+postgres://")) {
    try {
      const parsedUrl = new URL(url);
      const apiKey = parsedUrl.searchParams.get("api_key");
      if (apiKey) {
        const decoded = Buffer.from(apiKey, "base64").toString("utf-8");
        const json = JSON.parse(decoded);
        if (json.databaseUrl) {
          return json.databaseUrl;
        }
      }
    } catch (e) {
      console.error("Failed to parse prisma+postgres URL:", e);
    }
  }
  return url;
}

const createPrismaClient = () => {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Return standard client as fallback, Prisma 7 will error if query is executed without options,
    // but this prevents crash during static build page analysis.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new PrismaClient({} as any);
  }
  connectionString = getNativeConnectionString(connectionString);

  const pool = new pg.Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // SSL required for most cloud Postgres providers
    ssl:
      connectionString.includes("supabase.co") ||
      connectionString.includes("neon.tech") ||
      connectionString.includes("railway.app")
        ? { rejectUnauthorized: false }
        : undefined,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
