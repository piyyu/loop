import { NextResponse } from "next/server";

/**
 * GET /api/time — server clock for client drift correction.
 */
export async function GET() {
  return NextResponse.json(
    { t: Date.now() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
