import { getArtistPhoto } from "@/lib/wiki";

export default async function Page() {
  const artist =
    await getArtistPhoto(
      "Arijit Singh"
    );

  return (
    <pre className="text-white p-10">
      {JSON.stringify(
        artist,
        null,
        2
      )}
    </pre>
  );
}