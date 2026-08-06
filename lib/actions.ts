/**
 * The model cannot touch anything itself. It emits a marked-up action on its own
 * line, the client parses it out, strips it from what gets spoken, and decides
 * whether to run it. Everything the agent can do is enumerated here.
 */

export type ActionKind = "open" | "youtube" | "search" | "local";

export type Action = {
  kind: ActionKind;
  /** URL for open, query for youtube/search, command name for local. */
  arg: string;
  /** What to show on the button. */
  label: string;
};

/** One action per line, e.g. [[youtube:lofi hip hop]] */
const ACTION_RE = /\[\[(open|youtube|search|local)\s*:\s*([^\]]+)\]\]/gi;

/** Commands the local companion will accept. Not a shell — an allowlist. */
export const LOCAL_COMMANDS = [
  "notepad",
  "calculator",
  "browser",
  "explorer",
  "terminal",
  "settings",
  "screenshot",
  "lock",
  "volume-up",
  "volume-down",
  "mute",
  "play-pause",
  "next-track",
  "previous-track",
] as const;

export const ACTION_INSTRUCTIONS = `You can act, not just answer. To do something, put a marker
on its own line at the very end of your reply. Say what you are doing in your spoken text, then
emit the marker. Never read the marker aloud and never mention its syntax.

  [[open:https://example.com]]        open a web page
  [[youtube:exact search terms]]      open YouTube for a video
  [[search:what to look up]]          open a web search
  [[local:notepad]]                   run something on the user's own computer

Rules:
- At most one marker per reply. No marker at all if the request was just a question.
- For [[youtube:...]] give the search terms only, never a video id or a full URL: you cannot
  know a real video id and a guessed one leads nowhere.
- [[local:...]] accepts only these exact words: ${LOCAL_COMMANDS.join(", ")}. Anything else
  will be refused, so say plainly that you cannot do it instead of inventing a command.
- Acting requires the user's machine to be connected for local commands. If it is not, the
  interface will say so; do not promise it worked.`;

/** Pull actions out of a reply and return the text that should be spoken. */
export function parseActions(reply: string): { spoken: string; actions: Action[] } {
  const actions: Action[] = [];

  const spoken = reply
    .replace(ACTION_RE, (_full, kind: string, raw: string) => {
      const arg = raw.trim();
      if (!arg) return "";
      const k = kind.toLowerCase() as ActionKind;
      actions.push({ kind: k, arg, label: labelFor(k, arg) });
      return "";
    })
    // Collapse the blank line the marker leaves behind.
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { spoken, actions: actions.slice(0, 1) };
}

function labelFor(kind: ActionKind, arg: string): string {
  const short = arg.length > 48 ? `${arg.slice(0, 45)}...` : arg;
  switch (kind) {
    case "youtube":
      return `Open YouTube: ${short}`;
    case "search":
      return `Search the web: ${short}`;
    case "local":
      return `Run on your computer: ${short}`;
    default:
      return `Open ${short}`;
  }
}

/** Turn an action into a URL, or null when it is not a browser navigation. */
export function urlFor(action: Action): string | null {
  switch (action.kind) {
    case "youtube":
      // Search results rather than a watch link: a model cannot know a real video
      // id, and a guessed one is a dead page. One click from here plays it.
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(action.arg)}`;
    case "search":
      return `https://duckduckgo.com/?q=${encodeURIComponent(action.arg)}`;
    case "open": {
      const raw = action.arg.trim();
      const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      try {
        const url = new URL(withScheme);
        // Only ever http(s). Blocks javascript:, file: and friends.
        if (url.protocol !== "https:" && url.protocol !== "http:") return null;
        return url.toString();
      } catch {
        return null;
      }
    }
    default:
      return null;
  }
}

export function isLocalCommand(value: string): boolean {
  return (LOCAL_COMMANDS as readonly string[]).includes(value.trim().toLowerCase());
}
