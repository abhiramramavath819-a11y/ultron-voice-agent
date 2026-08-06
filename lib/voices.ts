import type { Attitude } from "./persona";

export type VoiceProfile = {
  /** Playback rate. Below 1 sounds heavier and more deliberate. */
  rate: number;
  /** Pitch. Below 1 deepens; above 1 lightens. */
  pitch: number;
  /**
   * Ordered preference list matched against the browser's installed voices.
   * Availability varies wildly by OS, so this is a ranked wish list, not a guarantee.
   */
  prefer: RegExp[];
  /** Skip voices that would fight the character. */
  avoid?: RegExp;
  /** ElevenLabs voice id, used when a key is configured. */
  elevenLabsId: string;
};

export const VOICES: Record<Attitude, VoiceProfile> = {
  // Female, bright, quick — FRIDAY is the helpful one.
  friday: {
    rate: 1.1,
    pitch: 1.22,
    prefer: [
      /samantha|victoria|karen|moira|tessa|fiona/i,
      /zira|aria|jenny|michelle|clara/i,
      /female|woman/i,
      /google uk english female|google us english/i,
    ],
    avoid: /male|david|george|daniel|alex\b/i,
    elevenLabsId: "EXAVITQu4vr4xnSDxMaL",
  },

  // Soft, measured, British — JARVIS never raises his voice.
  jarvis: {
    rate: 1.08,
    pitch: 1.0,
    prefer: [
      /daniel|oliver|arthur|george/i,
      /google uk english male/i,
      /ryan|thomas|brian/i,
      /male/i,
    ],
    avoid: /female|woman|zira|samantha/i,
    elevenLabsId: "onwK4e9ZLuTAKqWW03F9",
  },

  // Deep, slow, mechanical — the pitch floor is what makes it read as a machine.
  ultron: {
    rate: 0.92,
    pitch: 0.5,
    prefer: [/alex\b|fred|ralph|bruce/i, /david|guy|mark/i, /male/i],
    avoid: /female|woman|zira|samantha|karen/i,
    elevenLabsId: "pNInz6obpgDQGcFmaJgB",
  },
};

/** Best available installed voice for a persona in the requested language. */
export function pickVoice(
  attitude: Attitude,
  langCode: string,
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined;
  const profile = VOICES[attitude] ?? VOICES.ultron;
  const base = langCode.split("-")[0];

  // Prefer an exact locale match, then the same language, then anything at all.
  const tiers = [
    voices.filter((v) => v.lang === langCode),
    voices.filter((v) => v.lang.startsWith(base)),
    voices,
  ];

  for (const tier of tiers) {
    const usable = profile.avoid ? tier.filter((v) => !profile.avoid!.test(v.name)) : tier;
    for (const pattern of profile.prefer) {
      const hit = usable.find((v) => pattern.test(v.name));
      if (hit) return hit;
    }
    if (usable.length) return usable[0];
  }

  return voices[0];
}
