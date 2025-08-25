import { type VerbTableRow, type PersonKey, PERSONS } from "./types";
export class Grader {

  grade(verb: VerbTableRow, answers: Record<PersonKey, string>, ignoreAccents = true): Record<PersonKey, boolean | null> {
    const newResults: Record<PersonKey, boolean | null> = {
      form_1s: null,
      form_2s: null,
      form_3s: null,
      form_1p: null,
      form_2p: null,
      form_3p: null,
    };
    for (const p of PERSONS) {
      const correctRaw = (verb[p.key] || "").trim();
      if (!correctRaw) {
        // Form not applicable for this mood/tense -- skip grading.
        newResults[p.key] = null;
        continue;
      }
      const correctAlternatives = splitAlternates(correctRaw).map((a) => normalize(a, { stripAccents: ignoreAccents }));
      const normalizedAnswer = normalize(answers[p.key] || "", { stripAccents: ignoreAccents });
      newResults[p.key] = normalizedAnswer.length > 0 && correctAlternatives.includes(normalizedAnswer);
    }
    return newResults;
  }
}

/** Normalizes the input string by removing all diacritics and spaces */
function normalize(s: string, { stripAccents = true }: { stripAccents?: boolean } = {}): string {
  let out = (s || "").toLowerCase().trim();
  if (stripAccents) {
    out = out
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, " ");
  }
  return out;
}

/** Splits an answer string from the dataset into multiple acceptable variants, if applicable */
export function splitAlternates(answer: string): string[] {
  // The dataset sometimes has multiple acceptable variants of the answer,
  // separated by "/", ";", ",", or " o " (or).
  // Split them into separate answers. Also remove any parenthetical notes.
  if (!answer) return [];
  const candidates = answer
    .replace(/\([^)]*\)/g, (m) => m) // keep text but ensure later normalization handles accents only
    .split(/\s*(?:;|\/|,|\so\s|\su\s|\sor\s|\sOU\s)\s*/i)
    .map((x) => x.trim())
    .filter(Boolean);
  return [...new Set(candidates)];
}
