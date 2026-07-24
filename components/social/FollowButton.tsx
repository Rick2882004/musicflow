"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

interface FollowButtonProps {
  targetUserId?: string;
  initialFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  className?: string;
}

export function FollowButton({
  initialFollowing = false,
  onFollowChange,
  className = "",
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggleFollow = async () => {
    const nextState = !following;
    setFollowing(nextState); // Optimistic UI
    if (onFollowChange) onFollowChange(nextState);

    setLoading(true);
    try {
      // Simulate server follow sync
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      console.error("Failed to update follow status:", err);
      setFollowing(!nextState); // Rollback
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleFollow}
      disabled={loading}
      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
        following
          ? "bg-white/[0.06] text-zinc-200 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
          : "bg-purple-550 text-white hover:bg-purple-500 shadow-md shadow-purple-550/20"
      } ${className}`}
    >
      {following ? (
        <>
          <UserCheck size={14} /> Following
        </>
      ) : (
        <>
          <UserPlus size={14} /> Follow
        </>
      )}
    </motion.button>
  );
}
