import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoopShell } from "@/components/ipod/LoopShell";
import { AudioEngine } from "@/components/player/AudioEngine";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="flex-1 bg-[#1a1a1a] min-h-screen flex flex-col justify-center items-center">
      <LoopShell />
      <AudioEngine />
    </main>
  );
}
