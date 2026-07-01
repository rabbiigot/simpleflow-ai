import { flowmoTextToSpeech } from "@/lib/backend-api";

// FlowMo voice preference is mirrored to localStorage so the chat UIs can read
// it synchronously without re-fetching the user profile. The settings page is
// the source of truth and keeps these in sync with the backend.
const ENABLED_KEY = "simpleflow_flowmo_voice_enabled";
const VOICE_KEY = "simpleflow_flowmo_voice";

export function getFlowmoVoicePref(): { enabled: boolean; voice: string } {
  if (typeof window === "undefined") return { enabled: false, voice: "alloy" };
  return {
    enabled: localStorage.getItem(ENABLED_KEY) === "true",
    voice: localStorage.getItem(VOICE_KEY) || "alloy",
  };
}

export function setFlowmoVoicePref(enabled: boolean, voice = "alloy") {
  if (typeof window === "undefined") return;
  localStorage.setItem(ENABLED_KEY, String(enabled));
  localStorage.setItem(VOICE_KEY, voice);
}

let currentAudio: HTMLAudioElement | null = null;

export function stopFlowmoAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

/** Speak a FlowMo reply aloud when voice is enabled. No-op otherwise. */
export async function speakFlowmo(text: string) {
  const { enabled, voice } = getFlowmoVoicePref();
  const clean = (text || "").trim();
  if (!enabled || !clean) return;
  try {
    const { audioBase64, mimeType } = await flowmoTextToSpeech(clean, voice);
    stopFlowmoAudio();
    const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
    currentAudio = audio;
    await audio.play().catch(() => {
      /* autoplay may be blocked until a user gesture; ignore */
    });
  } catch {
    /* TTS failures should never break the chat */
  }
}
