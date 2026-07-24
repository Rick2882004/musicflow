"use client";

import { motion } from "framer-motion";

interface AudioVisualizerProps {
  isPlaying?: boolean;
  bars?: number;
  className?: string;
  barColor?: string;
}

export function AudioVisualizer({
  isPlaying = false,
  bars = 16,
  className = "",
  barColor = "bg-purple-400",
}: AudioVisualizerProps) {
  return (
    <div className={`flex items-end justify-center gap-1.5 h-10 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={`viz-bar-${i}`}
          className={`w-1 rounded-full ${barColor}`}
          animate={{
            height: isPlaying ? ["15%", "90%", "30%", "100%", "20%"] : "15%",
          }}
          transition={{
            duration: isPlaying ? 0.6 + (i % 5) * 0.15 : 0.3,
            repeat: isPlaying ? Infinity : 0,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: (i % 4) * 0.1,
          }}
        />
      ))}
    </div>
  );
}
