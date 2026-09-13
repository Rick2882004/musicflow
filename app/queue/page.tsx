"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QueuePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/now-playing");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-zinc-500 text-sm font-semibold animate-pulse">
        Opening Now Playing...
      </div>
    </div>
  );
}