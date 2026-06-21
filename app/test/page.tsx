import { getArtistInfo } from "@/lib/lastfm";

export default async function TestPage() {
  const artist =
    await getArtistInfo("Arijit Singh");

  return (
    <div className="p-10 text-white">
      <pre>
        {JSON.stringify(
          artist,
          null,
          2
        )}
      </pre>
    </div>
  );
}