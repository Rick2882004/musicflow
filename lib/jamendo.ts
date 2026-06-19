const CLIENT_ID = process.env.JAMENDO_CLIENT_ID!;

export async function fetchJamendoTracks(limit = 20) {
  const url =
    `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}` +
    `&format=jsonpretty` +
    `&limit=${limit}` +
    `&include=musicinfo` +
    `&audioformat=mp32`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch Jamendo tracks");
  }

  const data = await response.json();

  return data.results;
}