import {
  getArtistData,
} from "@/lib/artist-service";

export default async function Page() {
  const artist =
    await getArtistData(
      "Arijit Singh"
    );

  return (
    <main className="p-10 text-white bg-black min-h-screen">

      <img
        src={artist.image}
        alt=""
        className="w-40 h-40 rounded-full"
      />

      <h1 className="text-5xl font-bold mt-5">
        {artist.name}
      </h1>

      <p className="mt-3">
        {artist.description}
      </p>

      <p className="mt-3">
        Listeners:
        {" "}
        {artist.listeners}
      </p>

      <div className="mt-8">
        <h2 className="text-2xl font-bold">
          Similar Artists
        </h2>

        {artist.similar.map(
          (
            item: any,
            index: number
          ) => (
            <div
              key={index}
            >
              {item.name}
            </div>
          )
        )}
      </div>

    </main>
  );
}