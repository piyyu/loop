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

function createPrismaClient(): PrismaClient {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Cannot create Prisma client without a database connection."
    );
  }
  connectionString = getNativeConnectionString(connectionString);

  const pool = new pg.Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // SSL required for most cloud Postgres providers
    ssl:
      !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1")
        ? { rejectUnauthorized: false }
        : undefined,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/**
 * Lazy Prisma client singleton.
 *
 * Uses a Proxy so that PrismaClient is only instantiated when a property is
 * first accessed (i.e. at request time), NOT at module-import time.
 * This prevents build-time crashes on platforms like Vercel where DATABASE_URL
 * is unavailable during static page collection.
 */
function getLazyPrisma(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // Return a Proxy that defers construction until first use
  const handler: ProxyHandler<object> = {
    get(_target, prop, receiver) {
      // Construct the real client on first property access
      if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = createPrismaClient();
      }
      return Reflect.get(globalForPrisma.prisma, prop, receiver);
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Proxy({} as any, handler);
}

export const prisma = getLazyPrisma();
