import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { fetchJamendoTracks } from "@/lib/jamendo";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tracks = await fetchJamendoTracks(100);

    let imported = 0;

    for (const track of tracks) {
      let artist = await prisma.artist.findFirst({
        where: {
          name: track.artist_name,
        },
      });

      if (!artist) {
        artist = await prisma.artist.create({
          data: {
            name: track.artist_name,
            image: track.image || null,
            popularity: 0,
          },
        });
      }

      const existingTrack = await prisma.track.findFirst({
        where: {
          title: track.name,
          artistId: artist.id,
        },
      });

      if (!existingTrack) {
        await prisma.track.create({
          data: {
            title: track.name,
            audioUrl: track.audio,
            coverImage: track.image || null,
            duration: track.duration || 0,
            popularity: 0,
            artistId: artist.id,
          },
        });

        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Import failed",
      },
      {
        status: 500,
      }
    );
  }
}