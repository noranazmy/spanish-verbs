export const load = <T,>(key: string, fallback: T): T => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback } catch { return fallback }
}

export const save = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { }
}
