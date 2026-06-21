"use client";

import { useEffect, useState } from "react";

export default function ArtistAvatar({
  artist,
}: {
  artist: string;
}) {
  const [image, setImage] =
    useState<string | null>(null);

  useEffect(() => {
    fetch(
      `/api/artist-image?artist=${encodeURIComponent(
        artist
      )}`
    )
      .then((r) => r.json())
      .then((d) => {
        setImage(d.image);
      });
  }, [artist]);

  return (
    <img
      src={
        image ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          artist
        )}`
      }
      alt={artist}
      className="
        w-24
        h-24
        rounded-full
        object-cover
        mx-auto
        mb-4
      "
    />
  );
}