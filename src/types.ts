export interface VerbTableRow {
  infinitive: string;
  infinitive_english: string;
  mood: string;
  mood_english: string;
  tense: string;
  tense_english: string;
  verb_english: string;
  form_1s: string; // yo
  form_2s: string; // tú
  form_3s: string; // él / ella / Ustedes
  form_1p: string; // Nosotros
  form_2p: string; // Vosotros
  form_3p: string; // Ellos / Ellas / Ustedes
  gerund: string;
  gerund_english: string;
  pastparticiple: string;
  pastparticiple_english: string;
}

export interface VerbIndexEntry {
  verbEnglish: string;
  verbByMoodAndTense: Map<string, Map<string, VerbTableRow>>;
  moods: string[];
  tensesByMood: Map<string, string[]>;
}

export type PersonKey = keyof Pick<VerbTableRow, "form_1s" | "form_2s" | "form_3s" | "form_1p" | "form_2p" | "form_3p">;

export const PERSONS: { key: PersonKey; label: string }[] = [
  { key: "form_1s", label: "yo" },
  { key: "form_2s", label: "tú" },
  { key: "form_3s", label: "él / ella / Usted" },
  { key: "form_1p", label: "nosotros" },
  { key: "form_2p", label: "vosotros" },
  { key: "form_3p", label: "ellos / ellas / Ustedes" },
];