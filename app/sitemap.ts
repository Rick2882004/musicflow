import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://musicflow.io";
  const routes = [
    "",
    "/explore",
    "/library",
    "/liked",
    "/playlists",
    "/recently-played",
    "/search",
    "/profile",
    "/settings",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: route === "" ? 1 : 0.8,
  }));
}
