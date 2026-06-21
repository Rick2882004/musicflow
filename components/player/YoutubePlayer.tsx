"use client";

import YouTube from "react-youtube";
import {
  useRef,
  useEffect,
} from "react";
import { usePlayerStore } from "@/store/player-store";

type Props = {
  videoId: string;
};

export default function YoutubePlayer({
  videoId,
}: Props) {
  const playerRef = useRef<any>(null);

const {
  setPlayer,
  setCurrentTime,
  setDuration,
  nextTrack,
} = usePlayerStore();
  const onReady = (event: any) => {
  playerRef.current = event.target;

  setPlayer(event.target);

  setDuration(
    event.target.getDuration()
  );
};
const onStateChange = (event: any) => {
  if (event.data === 0) {
    const { isRepeat } =
      usePlayerStore.getState();

    if (isRepeat) {
      event.target.playVideo();
    } else {
      nextTrack();
    }
  }
};
useEffect(() => {
  const interval =
    setInterval(() => {
      if (
        playerRef.current
      ) {
        setCurrentTime(
          playerRef.current.getCurrentTime()
        );

        setDuration(
          playerRef.current.getDuration()
        );
      }
    }, 1000);

  return () =>
    clearInterval(
      interval
    );
}, []);
  return (
    <YouTube
      videoId={videoId}
      onReady={onReady}
      onStateChange={onStateChange}
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