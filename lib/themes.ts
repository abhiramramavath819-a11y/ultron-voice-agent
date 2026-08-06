import type { Attitude } from "./persona";

export type Theme = {
  /** Bright accent, used for live states and glows. */
  hot: string;
  /** Mid accent, the workhorse colour for borders and fills. */
  base: string;
  /** Deep accent, for gradient floors and idle states. */
  deep: string;
  /** Near-white top stop of the wordmark gradient. */
  wordTop: string;
  /** Colour of ULTRON's spoken lines in the transcript. */
  agentText: string;
};

export const THEMES: Record<Attitude, Theme> = {
  // Yellow on black — warm, high-visibility, closer to a caution light than gold.
  friday: {
    hot: "#ffd34d",
    base: "#f0a81e",
    deep: "#6b4400",
    wordTop: "#fffaf0",
    agentText: "#fff4d6",
  },
  // Blue on black — cool, instrument-panel calm.
  jarvis: {
    hot: "#6ab8ff",
    base: "#1e79e0",
    deep: "#0a2f6b",
    wordTop: "#f2f8ff",
    agentText: "#e2f0ff",
  },
  // Red on black — the original.
  ultron: {
    hot: "#ff4d3d",
    base: "#e01b24",
    deep: "#8b0a14",
    wordTop: "#fff4f2",
    agentText: "#ffe9e6",
  },
};

export const DEFAULT_THEME: Attitude = "ultron";
