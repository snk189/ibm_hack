// localStorage / IndexedDB helpers for Setu.
// All user data lives on-device. No accounts, no server-side database.
// Stores: user facts, call transcripts, outcome cards.

import type { Outcome, TranscriptEntry } from "../types";
import { redact } from "../guard/redact";

const FACTS_KEY = "setu:facts";
const OUTCOMES_KEY = "setu:outcomes";

export function saveFacts(facts: Record<string, string>): void {
  localStorage.setItem(FACTS_KEY, JSON.stringify(facts));
}

export function loadFacts(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(FACTS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveOutcome(outcome: Outcome): void {
  const existing = loadOutcomes();
  existing.push(outcome);
  localStorage.setItem(OUTCOMES_KEY, JSON.stringify(existing));
}

export function loadOutcomes(): Outcome[] {
  try {
    return JSON.parse(localStorage.getItem(OUTCOMES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Append a single transcript entry to the in-progress call in sessionStorage.
 * Sensitive digit sequences are redacted before persisting (guard rule).
 */
export function appendTranscriptEntry(entry: TranscriptEntry): void {
  const raw = sessionStorage.getItem("setu:transcript") ?? "[]";
  const entries: TranscriptEntry[] = JSON.parse(raw);
  const redactedText = redact(entry.text);
  const redacted = redactedText !== entry.text;
  entries.push({ ...entry, text: redactedText, redacted: redacted || entry.redacted });
  sessionStorage.setItem("setu:transcript", JSON.stringify(entries));
}

export function loadCurrentTranscript(): TranscriptEntry[] {
  try {
    return JSON.parse(sessionStorage.getItem("setu:transcript") ?? "[]");
  } catch {
    return [];
  }
}

export function clearCurrentTranscript(): void {
  sessionStorage.removeItem("setu:transcript");
}
