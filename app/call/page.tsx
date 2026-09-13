"use client";
// Live call screen (route: /call)
// Caption feed, reply suggestions, Send button, Unmute, DTMF keypad,
// silence indicator, pin-number confirmation banner.
// Guard wiring:
//   - containsSensitiveCode() blocks TTS send
//   - detectReferenceNumbers() triggers pin confirmation banner on every final caption
//   - appendTranscriptEntry() auto-redacts via lib/store

import { useState, useEffect, useCallback, useRef } from "react";
import type { TranscriptEntry } from "@/lib/types";
import type { Suggestion } from "@/lib/watsonx/llama";
import { containsSensitiveCode } from "@/lib/guard/otp";
import { detectReferenceNumbers } from "@/lib/guard/refnum";
import { appendTranscriptEntry, loadCurrentTranscript, loadFacts } from "@/lib/store";

const ALWAYS_PRESENT_EN: Suggestion[] = [
  { id: "ap-wait", label: "Wait", sentence: "Please give me a moment." },
  { id: "ap-repeat", label: "Please repeat", sentence: "Could you please repeat that?" },
  { id: "ap-unclear", label: "I did not understand", sentence: "I did not understand. Could you please clarify?" },
  { id: "ap-refnum", label: "Please give the complaint number", sentence: "Could you please give me the complaint or reference number?" },
];

export default function CallPage() {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(() => {
    if (typeof window === "undefined") return [];
    return loadCurrentTranscript();
  });
  const [suggestions, setSuggestions] = useState<Suggestion[]>(ALWAYS_PRESENT_EN);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [pinnedRef, setPinnedRef] = useState<string | null>(null);
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [backupCaption, setBackupCaption] = useState(false);
  const cancelTTS = useRef<(() => void) | null>(null);
  const facts = useRef<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      facts.current = loadFacts();
    }
  }, []);

  // ── Caption handler (called by ScribeClient / WatsonSTT on final captions) ──
  const handleFinalCaption = useCallback((text: string) => {
    const entry: TranscriptEntry = {
      t: Date.now(),
      side: "clerk",
      source: "stt",
      text,
      redacted: false,
    };
    appendTranscriptEntry(entry);
    setTranscript((prev) => [...prev, entry]);

    // Reference number detection → pin confirmation banner.
    const refs = detectReferenceNumbers(text);
    if (refs.length > 0 && !pinnedRef) {
      setPendingRef(refs[0]);
    }

    // Fetch new reply suggestions from /api/suggest.
    const allHistory = [...transcript, entry];
    fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption: text,
        history: allHistory.slice(-6),
        facts: facts.current,
        goal: sessionStorage.getItem("setu:goal") ?? "",
        callLanguage: sessionStorage.getItem("setu:callLanguage") ?? "hi",
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.suggestions?.length) setSuggestions(data.suggestions);
      })
      .catch(() => {/* keep current suggestions on error */});
  }, [transcript, pinnedRef]);

  // Expose handleFinalCaption for the transport layer (used by ScribeClient wiring).
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__setuOnCaption = handleFinalCaption;
    (window as unknown as Record<string, unknown>).__setuSetBackupCaption = setBackupCaption;
    return () => {
      delete (window as unknown as Record<string, unknown>).__setuOnCaption;
      delete (window as unknown as Record<string, unknown>).__setuSetBackupCaption;
    };
  }, [handleFinalCaption]);

  // ── Send handler ─────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!selected) return;
    const { sentence } = selected;

    // Guard: block OTP/PIN sentences.
    if (containsSensitiveCode(sentence)) {
      setBlocked(true);
      return;
    }
    setBlocked(false);

    // Cancel any in-flight TTS (barge-in).
    cancelTTS.current?.();
    cancelTTS.current = null;

    setIsSending(true);

    // Persist "us" transcript entry (store auto-redacts).
    const entry: TranscriptEntry = {
      t: Date.now(),
      side: "us",
      source: "tts-sent",
      text: sentence,
      redacted: false,
    };
    appendTranscriptEntry(entry);
    setTranscript((prev) => [...prev, entry]);

    // Stream TTS audio.
    try {
      const { streamTTS } = await import("@/lib/elevenlabs/tts");
      const lang = (sessionStorage.getItem("setu:callLanguage") ?? "hi") as "hi" | "en";
      const audioChunks: Uint8Array<ArrayBuffer>[] = [];
      const cancel = await streamTTS(sentence, lang, (chunk) => audioChunks.push(chunk as Uint8Array<ArrayBuffer>));
      cancelTTS.current = cancel;

      // Play accumulated audio via AudioContext.
      const ctx = new AudioContext();
      const blob = new Blob(audioChunks, { type: "audio/mpeg" });
      const arrayBuffer = await blob.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = decoded;
      source.connect(ctx.destination);
      source.start();
      source.onended = () => { cancelTTS.current = null; };
    } catch {
      // ElevenLabs failed — fall back to browser speechSynthesis (demo voice).
      const utt = new SpeechSynthesisUtterance(sentence);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    } finally {
      setIsSending(false);
      setSelected(null);
    }
  }, [selected]);

  // ── Unmute (barge-in) ─────────────────────────────────────────────────────────
  const handleUnmute = useCallback(() => {
    // Cancel any playing TTS immediately.
    cancelTTS.current?.();
    cancelTTS.current = null;
    window.speechSynthesis?.cancel();
    // Actual mic capture is handled by AudioTransport (RoomTransport).
    // Emit event for the transport layer to pick up.
    window.dispatchEvent(new Event("setu:unmute"));
  }, []);

  return (
    <main className="min-h-screen flex flex-col max-w-lg mx-auto p-4 gap-4">
      <h1 className="text-xl font-bold">Live Call</h1>

      {/* Backup caption banner */}
      {backupCaption && (
        <div className="bg-yellow-100 text-yellow-800 text-sm px-3 py-2 rounded">
          Backup captions active (Watson STT)
        </div>
      )}

      {/* Reference-number pin banner */}
      {pendingRef && !pinnedRef && (
        <div className="bg-blue-50 border border-blue-300 text-blue-900 text-sm px-3 py-2 rounded flex items-center gap-3">
          <span>Heard <strong>{pendingRef}</strong> — pin this?</span>
          <button
            className="ml-auto bg-blue-600 text-white px-3 py-1 rounded text-xs"
            onClick={() => { setPinnedRef(pendingRef); setPendingRef(null); }}
          >
            Pin
          </button>
          <button
            className="text-blue-500 text-xs"
            onClick={() => setPendingRef(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {pinnedRef && (
        <div className="bg-green-50 border border-green-400 text-green-900 text-sm px-3 py-2 rounded">
          📌 Pinned: <strong>{pinnedRef}</strong>
        </div>
      )}

      {/* Caption feed */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto bg-gray-50 rounded p-3 min-h-40 max-h-64">
        {transcript.length === 0 && (
          <p className="text-gray-400 text-sm">Captions will appear here…</p>
        )}
        {transcript.map((e, i) => (
          <div
            key={i}
            className={`text-sm ${e.side === "clerk" ? "text-gray-800" : "text-blue-700 text-right"}`}
          >
            <span className="font-semibold text-xs text-gray-400 mr-1">
              {e.side === "clerk" ? "Clerk" : "You"}
            </span>
            {e.text}
          </div>
        ))}
      </div>

      {/* Reply suggestions */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSelected(s); setBlocked(false); }}
            className={`text-sm px-3 py-1 rounded border transition-colors ${
              selected?.id === s.id
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-800 border-gray-300 hover:border-blue-400"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Selected sentence preview */}
      {selected && (
        <div className="bg-gray-100 rounded px-3 py-2 text-sm text-gray-700">
          <span className="text-xs text-gray-400 block mb-1">Will speak:</span>
          {selected.sentence}
        </div>
      )}

      {/* OTP block message */}
      {blocked && (
        <div className="bg-red-50 border border-red-300 text-red-800 text-sm px-3 py-2 rounded">
          Setu will not speak codes. Unmute to say it yourself.
        </div>
      )}

      {/* Send + Unmute */}
      <div className="flex gap-3">
        <button
          disabled={!selected || isSending}
          onClick={handleSend}
          className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold disabled:opacity-40"
        >
          {isSending ? "Speaking…" : "Send"}
        </button>
        <button
          onClick={handleUnmute}
          className="px-4 py-2 rounded border border-gray-300 text-sm"
        >
          Unmute
        </button>
      </div>
    </main>
  );
}
