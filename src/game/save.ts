// localStorage persistence for Git Space Adventure.
import type { SaveData } from "./types";

const KEY = "git-space-adventure-save-v1";

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== 1 || !data.repo) return null;
    return data;
  } catch {
    return null;
  }
}

export function storeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage full/blocked — game continues in memory
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

export function makeVerificationCode(name: string, when: number): string {
  let h = 0x9e3779b9;
  const s = `${name}|${when}|git-space-adventure`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return `GSA-${hex.slice(0, 4)}-${hex.slice(4)}`;
}
