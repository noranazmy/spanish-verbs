import { useEffect, useMemo, useState } from "react";
import { VerbService, getMoods } from "./verb_service";
import { splitAlternates, Grader } from "./grader";
import { type VerbIndexEntry, type VerbTableRow, type PersonKey, PERSONS } from "./types";
import { MaskedField } from "./MaskedField";

import "./App.css";

// TODO(noranazmy): Add support for local storage / user stats.

function hasValue(v: string | undefined | null): boolean {
  return !!v && v.trim().length > 0;
}

export function CheckAnswer({ isCorrect, isWrong }: { isCorrect: boolean, isWrong: boolean }) {
  if (isCorrect) {
    return <span className="material-symbols-outlined icon-correct" title="Correct">check_circle</span>;
  }
  if (isWrong) {
    return <span className="material-symbols-outlined icon-wrong" title="Incorrect">cancel</span>;
  }
  return null;
}

export default function App() {
  const verbService = useMemo(() => new VerbService(), []);
  const grader = useMemo(() => new Grader(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [verbIndex, setVerbIndex] = useState<Map<string, VerbIndexEntry>>(new Map());
  const [verbs, setVerbs] = useState<string[]>([]);

  const [selectedVerb, setSelectedVerb] = useState<string>("");
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedTense, setSelectedTense] = useState<string>("");

  const [answers, setAnswers] = useState<Record<PersonKey, string>>({
    form_1s: "",
    form_2s: "",
    form_3s: "",
    form_1p: "",
    form_2p: "",
    form_3p: "",
  });

  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Record<PersonKey, boolean | null>>({
    form_1s: null,
    form_2s: null,
    form_3s: null,
    form_1p: null,
    form_2p: null,
    form_3p: null,
  });

  const [showAnswers, setShowAnswers] = useState(false);
  const [ignoreAccents, setIgnoreAccents] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { index, verbs } = await verbService.loadVerbs();
        setVerbIndex(index);
        setVerbs(verbs);

        // Initialize a random starting verb
        const startVerb = verbs[Math.floor(Math.random() * verbs.length)] || "hablar";
        setSelectedVerb(startVerb);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Unknown error while loading CSV");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // When verb changes, pick default mood/tense if needed
  useEffect(() => {
    if (!selectedVerb || !verbIndex.size) return;
    const entry = verbIndex.get(selectedVerb);
    if (!entry) return;

    let mood = selectedMood && entry.moods.includes(selectedMood) ? selectedMood : getMoods(entry)[0];
    let tenses = entry.tensesByMood.get(mood) || [];
    let tense = selectedTense && tenses.includes(selectedTense) ? selectedTense : tenses[0];

    if (mood !== selectedMood) setSelectedMood(mood || "");
    if (tense !== selectedTense) setSelectedTense(tense || "");

    // Whenever the verb/mood/tense trio changes, reset state
    setAnswers({ form_1s: "", form_2s: "", form_3s: "", form_1p: "", form_2p: "", form_3p: "" });
    setChecked(false);
    setResults({ form_1s: null, form_2s: null, form_3s: null, form_1p: null, form_2p: null, form_3p: null });
  }, [selectedVerb, verbIndex]);

  // When mood changes, make sure tense stays valid
  useEffect(() => {
    if (!selectedVerb) return;
    const entry = verbIndex.get(selectedVerb);
    if (!entry) return;
    const tenses = entry.tensesByMood.get(selectedMood) || [];
    if (!tenses.length) return;
    if (!selectedTense || !tenses.includes(selectedTense)) {
      setSelectedTense(tenses[0]);
    }
    // Whenever the verb/mood/tense trio changes, reset state
    setChecked(false);
    setResults({ form_1s: null, form_2s: null, form_3s: null, form_1p: null, form_2p: null, form_3p: null });
  }, [selectedMood]);

  const currentRow: VerbTableRow | null = useMemo(() => {
    const entry = verbIndex.get(selectedVerb);
    if (!entry) return null;
    const byTense = entry.verbByMoodAndTense.get(selectedMood);
    if (!byTense) return null;
    return byTense.get(selectedTense) || null;
  }, [verbIndex, selectedVerb, selectedMood, selectedTense]);

  function selectRandomVerb() {
    if (!verbs.length) return;
    const v = verbs[Math.floor(Math.random() * verbs.length)];
    setSelectedVerb(v);
  }

  function goToFirstVerb() {
    if (!verbs.length) return;
    setSelectedVerb(verbs[0]);
  }

  function goToLastVerb() {
    if (!verbs.length) return;
    setSelectedVerb(verbs[verbs.length - 1]);
  }

  function selectPreviousVerb() {
    if (!verbs.length || !selectedVerb) return;
    const idx = verbs.indexOf(selectedVerb);
    if (idx < 0) return;
    const prevIdx = (idx - 1 + verbs.length) % verbs.length;
    setSelectedVerb(verbs[prevIdx]);
  }

  function hasPreviousVerb() {
    if (!verbs.length || !selectedVerb) return false;
    const idx = verbs.indexOf(selectedVerb);
    return idx > 0;
  }

  function selectNextVerb() {
    if (!verbs.length || !selectedVerb) return;
    const idx = verbs.indexOf(selectedVerb);
    if (idx < 0) return;
    const nextIdx = (idx + 1) % verbs.length;
    setSelectedVerb(verbs[nextIdx]);
  }

  function hasNextVerb() {
    if (!verbs.length || !selectedVerb) return false;
    const idx = verbs.indexOf(selectedVerb);
    return idx >= 0 && idx < verbs.length - 1;
  }

  function gradeAnswers() {
    if (!currentRow) return;
    setResults(grader.grade(currentRow, answers, ignoreAccents));
    setChecked(true);
  }

  function startOver() {
    setAnswers({ form_1s: "", form_2s: "", form_3s: "", form_1p: "", form_2p: "", form_3p: "" });
    setChecked(false);
    setResults({ form_1s: null, form_2s: null, form_3s: null, form_1p: null, form_2p: null, form_3p: null });
    setShowAnswers(false);
  }

  const score = useMemo(() => {
    if (!checked) return null as null | { correct: number; total: number };
    let correct = 0;
    let total = 0;
    for (const p of PERSONS) {
      const has = currentRow && hasValue(currentRow[p.key]);
      if (!has) continue;
      total += 1;
      if (results[p.key] === true) correct += 1;
    }
    return { correct, total };
  }, [checked, results, currentRow]);

  return (
    <div className="app-page">
      <section className="full-bleed">
        <img src="/Cover.jpg" alt="Cover image" className="cover-image" />
      </section>
      <section>
        <header>
          <div>
            <h1>Spanish verb practice</h1>
            <p>This is a simple app for practicing Spanish verb conjugation
              based on Fred Jehle's <a href="https://www.ghidinelli.com/free-spanish-conjugated-verb-database" target="_blank">free database</a>.</p>
          </div>
        </header>
      </section>
      <section>
        <div>
          <div>

            {loading && (
              <div>
                <p>Loading verbs…</p>
              </div>
            )}

            {error && (
              <div>
                <p>Error loading verbs</p>
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && (
              <main className="sections">
                <div>
                  <h2>1. Select conjugation mode</h2>
                  <div className="tense-mood-selection flex-row">
                    <div className="title-and-body">
                      <label>Mood</label>
                      <select
                        value={selectedMood}
                        onChange={(e) => setSelectedMood(e.target.value)}
                      >
                        {(getMoods(verbIndex.get(selectedVerb))).map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="title-and-body">
                      <label>Tense</label>
                      <select
                        value={selectedTense}
                        onChange={(e) => setSelectedTense(e.target.value)}
                      >
                        {(verbIndex.get(selectedVerb)?.tensesByMood.get(selectedMood) || []).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="verb-selection">
                  <h2>2. Select verb</h2>
                  <div className="flex-row">
                    <button
                      disabled={!hasPreviousVerb()}
                      onClick={goToFirstVerb}
                      type="button"
                    >
                      <span className="material-symbols-outlined">
                        skip_previous
                      </span>
                    </button>
                    <button
                      disabled={!hasPreviousVerb()}
                      onClick={selectPreviousVerb}
                      type="button"
                    >
                      <span className="material-symbols-outlined">
                        arrow_back_2
                      </span>
                    </button>
                    <input
                      className="verb-selection-input"
                      list="verb-list"
                      placeholder="e.g. hablar"
                      value={selectedVerb}
                      onChange={(e) => setSelectedVerb(e.target.value)}
                    />
                    <button
                      onClick={selectRandomVerb}
                      type="button"
                    >
                      <span className="material-symbols-outlined">
                        casino
                      </span>
                    </button>
                    <button
                      disabled={!hasNextVerb()}
                      onClick={selectNextVerb}
                      type="button"
                    >
                      <span className="material-symbols-outlined">
                        play_arrow
                      </span>
                    </button>
                    <button
                      disabled={!hasNextVerb()}
                      onClick={goToLastVerb}
                      type="button"
                    >
                      <span className="material-symbols-outlined">
                        skip_next
                      </span>
                    </button>
                  </div>
                </div>
                <datalist id="verb-list">
                  {verbs.map((v) => (
                    <option value={v} key={v} />
                  ))}
                </datalist>
                <div>
                  {!currentRow ? (
                    <p className="paragraph-largest">Select a verb to begin.</p>
                  ) : (
                    <div className="card">
                      {currentRow && (
                        <div className="card-header space-between">
                          <div>
                            <span className="flex-row baseline">
                              <h3>{selectedVerb}</h3>
                              <span>&bull;</span>
                              <span>{verbIndex.get(selectedVerb)?.verbEnglish}</span>
                            </span>
                            <h4><i>{selectedMood}</i> / <i>{selectedTense}</i></h4>
                          </div>
                          <div className="score">
                            {checked && score && (<span>{score.correct} / {score.total}</span>)}
                            {(!checked || !score) && (<span>&mdash;</span>)}
                          </div>
                        </div>
                      )}
                      <div className="card-body answer-form">
                        {PERSONS.map(({ key, label }) => {
                          const correct = (currentRow[key] || "").trim();
                          const isNA = !hasValue(correct);
                          const isCorrect = results[key] === true;
                          const isWrong = results[key] === false;
                          return (
                            <div key={key}>
                              <div className="person-label">
                                <span className="label">{label}</span>
                                {showAnswers && hasValue(correct) && (
                                  <span className="correct-answer">{splitAlternates(correct).join("  ·  ")}</span>
                                )}
                              </div>
                              {isNA && (<div className="input-container"><MaskedField label="" /></div>)}
                              {!isNA && (
                                <div className="input-container">
                                  <input
                                    className="answer-input"
                                    placeholder="Type your answer"
                                    value={answers[key]}
                                    onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                                  />
                                  {checked && !isNA && (
                                    <CheckAnswer isCorrect={isCorrect} isWrong={isWrong} />
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="controls">
                  <div className="flex-row">
                    <button
                      onClick={startOver}
                      type="button"
                    >
                      <span className="material-symbols-outlined">
                        replay
                      </span>
                      Start over
                    </button>
                    <button

                      onClick={() => setShowAnswers((s) => !s)}
                      type="button"
                    >
                      {showAnswers ?
                        <span className="material-symbols-outlined">
                          visibility_off
                        </span> : <span className="material-symbols-outlined">
                          visibility
                        </span>}
                      {showAnswers ? "Hide answers" : "Show answers"}
                    </button>
                  </div>
                  <div className="flex-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={ignoreAccents}
                        onChange={(e) => setIgnoreAccents(e.target.checked)}
                      />
                      Ignore accents
                    </label>
                    <button
                      className="primary"
                      onClick={gradeAnswers}
                      type="button"
                    >
                      <span className="material-symbols-outlined">
                        grading
                      </span>
                      Check answers
                    </button>
                  </div>
                </div>
              </main>
            )}
          </div>
        </div>
      </section >
      <section className="full-bleed footer">
        <footer className="full-bleed-content">
          Created 2025 by Noran Azmy in React/TypeScript.
          Cover photo by <a href="https://unsplash.com/@ashkfor121?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Ashkan Forouzani</a> on <a href="https://unsplash.com/photos/orange-and-grey-abstract-painting-4sNJEx2V0yk?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>.
        </footer>
      </section>
    </div >
  );
}
