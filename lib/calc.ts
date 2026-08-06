/**
 * Language models pattern-match digits rather than calculating, so "47 times 63"
 * is a coin flip on any small model. This evaluates the arithmetic properly and
 * hands the model the answer to explain.
 *
 * Deliberately not eval() or new Function(): this runs on the server against
 * user input, so it is a hand-written parser with no access to any scope.
 */

type Token = { type: "num" | "op" | "lparen" | "rparen" | "fn"; value: string };

const FUNCTIONS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
};

const PRECEDENCE: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2, "^": 3 };
const RIGHT_ASSOCIATIVE = new Set(["^"]);

/** Spoken and written forms people actually use, mapped to operators. */
function normalise(input: string): string {
  return (
    input
      .toLowerCase()
      // Strip thousands separators before anything else, or 1,234 becomes two numbers.
      .replace(/(\d),(\d{3})\b/g, "$1$2")
      .replace(/\bplus\b|\badd(ed)?\s+to\b/g, "+")
      .replace(/\bminus\b|\bless\b|\bsubtract(ed)?\s+from\b/g, "-")
      .replace(/\btimes\b|\bmultiplied\s+by\b|\bx\b/g, "*")
      .replace(/\bdivided\s+by\b|\bover\b/g, "/")
      .replace(/\bto\s+the\s+power\s+of\b|\bpower\b/g, "^")
      .replace(/\bsquare\s+root\s+of\b/g, "sqrt")
      .replace(/\bmod(ulo)?\b/g, "%")
      .replace(/[,?]/g, " ")
      // Strip the conversational wrapper. Without this, "what is 47 times 63"
      // hits the unknown word "what" and bails, which is the commonest phrasing.
      .replace(
        /^(hey|hi|ok|okay)?\s*(ultron|jarvis|friday)?[\s,]*/,
        ""
      )
      .replace(
        /^(please\s+)?(can\s+you\s+)?(tell\s+me\s+)?(what\s+(is|are|s)|what's|whats|how\s+much\s+is|calculate|compute|work\s+out|solve|evaluate|figure\s+out)\s+/,
        ""
      )
      .replace(/\s*(=|equals)\s*$/, "")
      .trim()
  );
}

function tokenize(src: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      let n = "";
      while (i < src.length && /[0-9._]/.test(src[i])) n += src[i++];
      n = n.replace(/_/g, "");
      if (!/^\d*\.?\d+$/.test(n)) return null;
      tokens.push({ type: "num", value: n });
      continue;
    }

    if (/[a-z]/.test(ch)) {
      let name = "";
      while (i < src.length && /[a-z]/.test(src[i])) name += src[i++];
      if (name === "pi") {
        tokens.push({ type: "num", value: String(Math.PI) });
        continue;
      }
      if (name === "e") {
        tokens.push({ type: "num", value: String(Math.E) });
        continue;
      }
      if (!FUNCTIONS[name]) return null; // an unknown word means this is prose, not a sum
      tokens.push({ type: "fn", value: name });
      continue;
    }

    if ("+-*/%^".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "lparen", value: ch });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen", value: ch });
      i++;
      continue;
    }

    return null; // any other character means it is not arithmetic
  }

  return tokens.length ? tokens : null;
}

/** Shunting-yard into RPN, then evaluate. */
function evaluate(tokens: Token[]): number | null {
  const output: Token[] = [];
  const stack: Token[] = [];

  // Unary minus becomes 0 - x, which the binary evaluator already handles.
  const prepared: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = tokens[i - 1];
    const isUnary =
      t.type === "op" &&
      (t.value === "-" || t.value === "+") &&
      (!prev || prev.type === "op" || prev.type === "lparen");
    if (isUnary) {
      prepared.push({ type: "num", value: "0" });
    }
    prepared.push(t);
  }

  for (const t of prepared) {
    if (t.type === "num") output.push(t);
    else if (t.type === "fn") stack.push(t);
    else if (t.type === "op") {
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.type === "fn") {
          output.push(stack.pop()!);
          continue;
        }
        if (
          top.type === "op" &&
          (PRECEDENCE[top.value] > PRECEDENCE[t.value] ||
            (PRECEDENCE[top.value] === PRECEDENCE[t.value] && !RIGHT_ASSOCIATIVE.has(t.value)))
        ) {
          output.push(stack.pop()!);
          continue;
        }
        break;
      }
      stack.push(t);
    } else if (t.type === "lparen") stack.push(t);
    else {
      let matched = false;
      while (stack.length) {
        const top = stack.pop()!;
        if (top.type === "lparen") {
          matched = true;
          break;
        }
        output.push(top);
      }
      if (!matched) return null; // unbalanced
      if (stack.length && stack[stack.length - 1].type === "fn") output.push(stack.pop()!);
    }
  }

  while (stack.length) {
    const top = stack.pop()!;
    if (top.type === "lparen") return null;
    output.push(top);
  }

  const values: number[] = [];
  for (const t of output) {
    if (t.type === "num") values.push(parseFloat(t.value));
    else if (t.type === "fn") {
      const x = values.pop();
      if (x === undefined) return null;
      values.push(FUNCTIONS[t.value](x));
    } else {
      const b = values.pop();
      const a = values.pop();
      if (a === undefined || b === undefined) return null;
      switch (t.value) {
        case "+": values.push(a + b); break;
        case "-": values.push(a - b); break;
        case "*": values.push(a * b); break;
        case "/": values.push(a / b); break;
        case "%": values.push(a % b); break;
        case "^": values.push(Math.pow(a, b)); break;
        default: return null;
      }
    }
  }

  if (values.length !== 1) return null;
  const result = values[0];
  return Number.isFinite(result) ? result : null;
}

function format(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  // Kill floating-point dust like 0.30000000000000004 without hiding real precision.
  const rounded = parseFloat(n.toPrecision(12));
  return rounded.toString();
}

/**
 * Returns a note for the system prompt when the message contains arithmetic we
 * can settle exactly, or null when it is ordinary prose.
 */
export function precomputeArithmetic(message: string): string | null {
  const normalised = normalise(message);

  // Needs at least one operator and two numbers, or it is not a calculation.
  if (!/[+\-*/%^]|sqrt/.test(normalised)) return null;
  const digits = normalised.match(/\d+(\.\d+)?/g);
  if (!digits || digits.length < 2) {
    if (!/sqrt/.test(normalised)) return null;
  }

  const tokens = tokenize(normalised);
  if (!tokens) return null;

  // A lone number, or something with no operator, is not worth announcing.
  if (!tokens.some((t) => t.type === "op" || t.type === "fn")) return null;

  const result = evaluate(tokens);
  if (result === null) return null;

  return `The exact value of this calculation is ${format(
    result
  )}. It has been computed precisely, so state it as the answer and explain the working. Do not recompute it.`;
}
