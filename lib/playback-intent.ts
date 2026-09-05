/**
 * Playback Intent Tracker
 * Distinguishes between intentional user pauses (UI button / lockscreen pause)
 * and background lifecycle pauses (Chrome Android visibilitychange / screen lock).
 */

let intentionalUserPause = false;
let bgResumeAttempts = 0;
let lastResumeTime = 0;
const RESUME_THROTTLE_MS = 300;

export function markIntentionalUserPause() {
  intentionalUserPause = true;
  bgResumeAttempts = 0;
}

export function clearIntentionalUserPause() {
  intentionalUserPause = false;
  bgResumeAttempts = 0;
}

export function isIntentionalUserPause(): boolean {
  return intentionalUserPause;
}

export function getBgResumeAttempts(): number {
  return bgResumeAttempts;
}

export function incrementBgResumeAttempts(): number {
  bgResumeAttempts++;
  lastResumeTime = Date.now();
  return bgResumeAttempts;
}

export function canAttemptBgResume(): boolean {
  if (intentionalUserPause) return false;
  const now = Date.now();
  return now - lastResumeTime >= RESUME_THROTTLE_MS;
}
