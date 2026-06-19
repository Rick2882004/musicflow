"use client";

import YouTube from "react-youtube";
import { useRef } from "react";
import { usePlayerStore } from "@/store/player-store";

type Props = {
  videoId: string;
};

export default function YoutubePlayer({
  videoId,
}: Props) {
  const playerRef = useRef<any>(null);

  const { setPlayer } = usePlayerStore();

  const onReady = (event: any) => {
    playerRef.current = event.target;

    setPlayer(event.target);
  };

  return (
    <YouTube
      videoId={videoId}
      onReady={onReady}
      opts={{
        width: "100%",
        height: "500",
        playerVars: {
          autoplay: 1,
        },
      }}
    />
  );
}