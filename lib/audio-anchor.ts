/**
 * Silent Audio Anchor for Chrome Android & Mobile Background Playback.
 * Plays a silent looping audio stream in the main frame so Chromium binds the
 * OS MediaSession notification (Previous, Play/Pause, Next, Seek) to the main page
 * and prevents Android from suspending background playback.
 */

let audioAnchor: HTMLAudioElement | null = null;

function getAudioAnchor(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audioAnchor) {
    try {
      const audio = new Audio("/silence.wav");
      audio.loop = true;
      audio.volume = 0.01; // Non-zero volume: audible to Chromium, inaudible to human ear
      audio.preload = "auto";
      audioAnchor = audio;
    } catch {
      // Ignored in non-browser environments
    }
  }
  return audioAnchor;
}

export function playAudioAnchor() {
  const audio = getAudioAnchor();
  if (audio && audio.paused) {
    audio.play().catch(() => {
      // Ignored if blocked by autoplay policy before user gesture
    });
  }
}

export function pauseAudioAnchor() {
  const audio = getAudioAnchor();
  if (audio && !audio.paused) {
    audio.pause();
  }
}
