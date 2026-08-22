import { LoopShell } from "@/components/ipod/LoopShell";
import { AudioEngine } from "@/components/player/AudioEngine";

export default async function HomePage() {
  return (
    <main className="flex-1 bg-[#1a1a1a] min-h-screen flex flex-col justify-center items-center">
      <LoopShell />
      <AudioEngine />
    </main>
  );
}
