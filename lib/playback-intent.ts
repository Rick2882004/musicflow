/**
 * Playback Intent Tracker
 * Distinguishes between intentional user pauses (UI button / lockscreen pause)
 * and background lifecycle pauses (Chrome Android visibilitychange / screen lock).
 */

let intentionalUserPause = false;
let bgResumeAttempts = 0;
const MAX_BG_RESUME_ATTEMPTS = 2;

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
  return bgResumeAttempts;
}

export function canAttemptBgResume(): boolean {
  return !intentionalUserPause && bgResumeAttempts < MAX_BG_RESUME_ATTEMPTS;
}
