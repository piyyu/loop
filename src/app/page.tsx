import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { IPodShell } from "@/components/ipod/IPodShell";
import { AudioEngine } from "@/components/player/AudioEngine";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="flex-1 bg-[#1a1a1a] min-h-screen flex flex-col justify-center items-center">
      <IPodShell />
      <AudioEngine />
    </main>
  );
}
