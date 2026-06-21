export async function getArtistPhoto(
  artist: string
) {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      artist
    )}`
  );

  const data = await res.json();

  return {
    image:
      data.thumbnail?.source ||
      null,

    title:
      data.title,

    description:
      data.description,
  };
}