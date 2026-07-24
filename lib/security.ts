/**
 * Input sanitization & security utilities for MusicFlow
 */

export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export function isValidQuery(query: string): boolean {
  if (!query || typeof query !== "string") return false;
  // Maximum search query length check
  return query.trim().length > 0 && query.length <= 200;
}
