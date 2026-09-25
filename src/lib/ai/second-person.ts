/**
 * A safety net for AI notes: models sometimes write "the candidate showed..." even when
 * told to say "you". This turns the common forms into second person so the notes always
 * talk to the user. Applied to feedback text only, never to their own answer.
 */

const IRREGULAR: Record<string, string> = { is: "are", was: "were", has: "have", does: "do", "doesn't": "don't", "isn't": "aren't", "wasn't": "weren't", "hasn't": "haven't", focuses: "focus" };

/** "shows" -> "show", "focuses" -> "focus", "tries" -> "try", "is" -> "are". */
function plainVerb(verb: string): string {
  const lower = verb.toLowerCase();
  if (IRREGULAR[lower]) return IRREGULAR[lower];
  if (/[^aeiou]ies$/.test(lower)) return verb.slice(0, -3) + "y";
  if (/(ss|sh|ch|x|z|o)es$/.test(lower)) return verb.slice(0, -2);
  if (/[^s]s$/.test(lower) && lower.length > 3) return verb.slice(0, -1);
  return verb;
}

const WHO = "(?:candidate|interviewee|applicant|user|job ?seeker)";
const MODAL = /^(can|could|will|would|should|may|might|must|did|didn't|can't|couldn't|won't|wouldn't|shouldn't)$/i;

export function toSecondPerson(text: string): string {
  if (!text) return text;
  return (
    text
      // "the candidate's answer" -> "your answer"
      .replace(new RegExp(`\\b(t)he ${WHO}(?:'s|’s)`, "gi"), (_, t: string) => (t === "T" ? "Your" : "your"))
      // "the candidate shows" -> "you show", "the candidate could" -> "you could"
      .replace(new RegExp(`\\b(t)he ${WHO} (\\w+(?:['\u2019]t)?)`, "gi"), (_, t: string, verb: string) => {
        const you = t === "T" ? "You" : "you";
        const v = verb.replace("\u2019", "'");
        return `${you} ${MODAL.test(v) ? v : plainVerb(v)}`;
      })
      // Anything left, like "for the candidate".
      .replace(new RegExp(`\\b(t)he ${WHO}\\b`, "gi"), (_, t: string) => (t === "T" ? "You" : "you"))
  );
}
