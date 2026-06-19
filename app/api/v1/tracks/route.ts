import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const tracks = await prisma.track.findMany({
    include: {
      artist: true,
    },
  });

  return NextResponse.json(tracks);
}