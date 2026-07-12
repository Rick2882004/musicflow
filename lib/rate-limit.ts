interface RateLimitOptions {
  limit: number;     // Maximum number of requests allowed in the window
  windowMs: number;  // Window duration in milliseconds
}

const rateLimitCache = new Map<string, { requests: number[]; expires: number }>();

export function isRateLimited(key: string, options: RateLimitOptions): boolean {
  const now = Date.now();
  const entry = rateLimitCache.get(key);

  // If entry does not exist or has expired, initialize a new window
  if (!entry || entry.expires < now) {
    rateLimitCache.set(key, {
      requests: [now],
      expires: now + options.windowMs,
    });
    return false;
  }

  // Filter request timestamps falling inside the current active window
  const activeRequests = entry.requests.filter((time) => now - time < options.windowMs);
  
  if (activeRequests.length >= options.limit) {
    return true; // Rate limit threshold exceeded
  }

  activeRequests.push(now);
  entry.requests = activeRequests;
  rateLimitCache.set(key, entry);
  return false;
}
