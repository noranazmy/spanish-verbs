import Papa from 'papaparse';
import { type VerbIndexEntry, type VerbTableRow } from "./types";

const PRIMARY_CSV_URL =
  "https://raw.githubusercontent.com/ghidinelli/fred-jehle-spanish-verbs/refs/heads/master/jehle_verb_database.csv";

// TODO(noranazmy): Add a local fallback copy of the CSV.
const FALLBACK_CSV_URL =
  "https://raw.githubusercontent.com/ghidinelli/fred-jehle-spanish-verbs/master/jehle_verb_database.csv";

export class VerbService {
  /** Loads and parses the verb dataset */
  async loadVerbs(): Promise<{ index: Map<string, VerbIndexEntry>; verbs: string[] }> {
    let response = await fetch(PRIMARY_CSV_URL, { cache: "force-cache" });
    if (!response.ok) {
      response = await fetch(FALLBACK_CSV_URL, { cache: "force-cache" });
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`);
    }
    const csvText = await response.text();
    const parsed = Papa.parse<VerbTableRow>(csvText, { header: true, skipEmptyLines: true });
    if (parsed.errors?.length) {
      console.warn("CSV parse warnings:", parsed.errors.slice(0, 3));
    }
    const rows = (parsed.data || []).filter((r: VerbTableRow) => r && r.infinitive);
    return buildIndex(rows);
  }
}

function buildIndex(rows: VerbTableRow[]): { index: Map<string, VerbIndexEntry>; verbs: string[] } {
  const index = new Map<string, VerbIndexEntry>();
  for (const r of rows) {
    const inf = r.infinitive.trim();
    if (!inf) continue;
    if (!index.has(inf)) {
      index.set(inf, {
        verbEnglish: r.verb_english,
        verbByMoodAndTense: new Map(),
        moods: [],
        tensesByMood: new Map(),
      });
    }
    const entry = index.get(inf)!;
    if (!entry.verbByMoodAndTense.has(r.mood)) {
      entry.verbByMoodAndTense.set(r.mood, new Map());
    }
    const byTense = entry.verbByMoodAndTense.get(r.mood)!;
    // Prefer the first non-empty row encountered for a mood/tense combo.
    if (!byTense.has(r.tense)) {
      byTense.set(r.tense, r);
    }
  }

  for (const [, entry] of index) {
    const moods = Array.from(entry.verbByMoodAndTense.keys()).sort((a, b) => a.localeCompare(b));
    entry.moods = moods;
    const tensesByMood = new Map<string, string[]>();
    for (const m of moods) {
      const tenses = Array.from(entry.verbByMoodAndTense.get(m)!.keys()).sort((a, b) => a.localeCompare(b));
      tensesByMood.set(m, tenses);
    }
    entry.tensesByMood = tensesByMood;
  }

  const verbs = Array.from(index.keys()).sort((a, b) => a.localeCompare(b));
  return { index, verbs };
}

export function getMoods(verb: VerbIndexEntry | undefined) {
  return ["Indicativo", "Subjuntivo", "Imperativo Afirmativo", "Imperativo Negativo"].filter(m => verb?.moods.includes(m));
}