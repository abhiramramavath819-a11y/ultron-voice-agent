export type Language = {
  code: string; // BCP-47 tag handed to SpeechRecognition and speechSynthesis
  name: string; // Instruction given to the model
  label: string; // Shown in the HUD
};

export const LANGUAGES: Language[] = [
  { code: "en-IN", name: "Indian English", label: "EN·IN" },
  { code: "en-US", name: "English", label: "EN·US" },
  { code: "hi-IN", name: "Hindi", label: "हिन्दी" },
  { code: "te-IN", name: "Telugu", label: "తెలుగు" },
  { code: "ta-IN", name: "Tamil", label: "தமிழ்" },
  { code: "kn-IN", name: "Kannada", label: "ಕನ್ನಡ" },
  { code: "mr-IN", name: "Marathi", label: "मराठी" },
  { code: "bn-IN", name: "Bengali", label: "বাংলা" },
  { code: "es-ES", name: "Spanish", label: "ES" },
  { code: "fr-FR", name: "French", label: "FR" },
  { code: "de-DE", name: "German", label: "DE" },
  { code: "ja-JP", name: "Japanese", label: "日本語" },
  { code: "ar-SA", name: "Arabic", label: "العربية" },
];

export const DEFAULT_LANGUAGE = LANGUAGES[0];

export function resolveLanguage(code: string | undefined): Language {
  return LANGUAGES.find((l) => l.code === code) ?? DEFAULT_LANGUAGE;
}
