"use client";

import YouTube from "react-youtube";
import { useRef, useEffect } from "react";
import { usePlayerStore } from "@/store/player-store";
import { useShallow } from "zustand/react/shallow";

type Props = {
  videoId: string;
};

export default function YoutubePlayer({ videoId }: Props) {
  const playerRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const {
    setPlayer,
    setCurrentTime,
    setDuration,
    nextTrack,
  } = usePlayerStore(useShallow((s) => ({
    setPlayer: s.setPlayer,
    setCurrentTime: s.setCurrentTime,
    setDuration: s.setDuration,
    nextTrack: s.nextTrack,
  })));

  const onReady = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    playerRef.current = event.target;
    setPlayer(event.target);
    setDuration(event.target.getDuration());
    
    // Seek to the saved currentTime if any on load
    const savedTime = usePlayerStore.getState().currentTime;
    if (savedTime > 0) {
      event.target.seekTo(savedTime, true);
    }
  };

  const onStateChange = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (event.data === 0) {
      const { isRepeat } = usePlayerStore.getState();
      if (isRepeat) {
        event.target.playVideo();
      } else {
        nextTrack();
      }
    }
  };

  return (
    <YouTube
      videoId={videoId}
      onReady={onReady}
      onStateChange={onStateChange}
      opts={{
        width: "100%",
        height: "500",
        playerVars: {
          autoplay: usePlayerStore.getState().isPlaying ? 1 : 0,
        },
      }}
    />
  );
}
