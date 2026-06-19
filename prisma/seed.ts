import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const artist = await prisma.artist.create({
    data: {
      name: "Open Music Artist",
      bio: "Demo artist for testing",
      popularity: 100,
    },
  });

  await prisma.track.createMany({
    data: [
      {
        title: "Welcome To MusicFlow",
        audioUrl:
          "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        duration: 180,
        popularity: 90,
        artistId: artist.id,
      },
      {
        title: "Late Night Coding",
        audioUrl:
          "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        duration: 240,
        popularity: 80,
        artistId: artist.id,
      },
    ],
  });

  console.log("Seed completed!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });