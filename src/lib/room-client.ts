"use client";

/**
 * Listen Together client helpers — member identity and server clock sync.
 */

const IDENTITY_KEY = "loop.member-identity";
const LAST_ROOM_KEY = "loop.last-room";

export interface MemberIdentity {
  memberId: string;
  name: string;
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `m-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/** Persistent per-browser listener identity */
export function getMemberIdentity(): MemberIdentity {
  if (typeof window === "undefined") {
    return { memberId: "", name: "Listener" };
  }

  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (raw) return JSON.parse(raw) as MemberIdentity;
  } catch {
    // fall through to create
  }

  const identity: MemberIdentity = {
    memberId: randomId(),
    name: `Guest ${Math.floor(Math.random() * 900 + 100)}`,
  };
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  return identity;
}

export function setMemberName(name: string): void {
  const identity = getMemberIdentity();
  localStorage.setItem(
    IDENTITY_KEY,
    JSON.stringify({ ...identity, name })
  );
}

export function rememberRoom(code: string): void {
  localStorage.setItem(LAST_ROOM_KEY, code);
}

export function getRememberedRoom(): string | null {
  return localStorage.getItem(LAST_ROOM_KEY);
}

export function forgetRoom(): void {
  localStorage.removeItem(LAST_ROOM_KEY);
}

/**
 * Clock offset estimation (NTP-style).
 * offset = serverTime - clientTime, so serverNow ≈ Date.now() + offset.
 */
export async function measureClockOffset(): Promise<number> {
  const t0 = performance.now();
  const res = await fetch("/api/time", { cache: "no-store" });
  const t1 = performance.now();
  if (!res.ok) throw new Error("time fetch failed");

  const { t } = (await res.json()) as { t: number };
  const rtt = t1 - t0;
  // Server reported time at roughly the midpoint of our request
  const serverAtMidpoint = t + rtt / 2;
  return serverAtMidpoint - performance.timeOrigin - t1;
}

/**
 * Rolling median of offsets — robust against jitter outliers.
 */
export class ClockSync {
  private samples: number[] = [];
  private readonly maxSamples = 7;
  private timer: ReturnType<typeof setInterval> | null = null;

  /** Start periodic measurement; returns current best offset immediately-ish */
  start(onOffset: (offsetMs: number) => void, intervalMs = 10000): void {
    this.stop();

    const measure = async () => {
      try {
        const offset = await measureClockOffset();
        this.samples.push(offset);
        if (this.samples.length > this.maxSamples) this.samples.shift();
        onOffset(this.median());
      } catch {
        // keep previous offset on failure
      }
    };

    void measure();
    this.timer = setInterval(measure, intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.samples = [];
  }

  private median(): number {
    if (this.samples.length === 0) return 0;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }
}
