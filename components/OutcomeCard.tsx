"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Outcome, OutcomeResult } from "@/lib/types";
import { loadOutcomes } from "@/lib/store";
import { t, type MessageKey } from "@/lib/i18n";

// Fallback realistic mock outcome for initial demo / step 2 validation
const MOCK_OUTCOME: Outcome = {
  playbookId: "power-cut",
  startedAt: 1757745000000,
  endedAt: 1757745134000, // 2m 14s duration
  result: "resolved",
  referenceNumber: "COMP-4821",
  transcript: [
    {
      t: 1757745005000,
      side: "clerk",
      source: "stt",
      text: "Electricity department helpline, how can I help you?",
      redacted: false,
    },
    {
      t: 1757745020000,
      side: "us",
      source: "tts-sent",
      text: "Hello, I am Arya and I am speaking through an assistive relay. There is a power cut in my colony.",
      redacted: false,
    },
    {
      t: 1757745040000,
      side: "clerk",
      source: "stt",
      text: "Please provide your consumer number.",
      redacted: false,
    },
    {
      t: 1757745060000,
      side: "us",
      source: "tts-sent",
      text: "My consumer number is 10928374.",
      redacted: false,
    },
    {
      t: 1757745090000,
      side: "clerk",
      source: "stt",
      text: "Complaint registered. Your complaint reference number is COMP-4821.",
      redacted: false,
    },
    {
      t: 1757745110000,
      side: "clerk",
      source: "stt",
      text: "Your security code is ••••.",
      redacted: true,
    },
    {
      t: 1757745130000,
      side: "us",
      source: "tts-sent",
      text: "Thank you, please resolve it soon.",
      redacted: false,
    },
  ],
};

function formatDuration(startedAt: number, endedAt: number): string {
  const diffSec = Math.max(0, Math.floor((endedAt - startedAt) / 1000));
  const minutes = Math.floor(diffSec / 60);
  const seconds = diffSec % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function getResultBadgeStyle(result: OutcomeResult): string {
  switch (result) {
    case "resolved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "refused":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "no-answer":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "incomplete":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function getResultMessageKey(result: OutcomeResult): MessageKey {
  switch (result) {
    case "resolved":
      return "outcome.result.resolved";
    case "refused":
      return "outcome.result.refused";
    case "no-answer":
      return "outcome.result.no_answer";
    case "incomplete":
      return "outcome.result.incomplete";
  }
}

function formatPlaybookTitle(playbookId: string): string {
  switch (playbookId) {
    case "power-cut":
      return "Power cut";
    case "bank":
      return "Bank / Cyber 1930";
    case "hospital":
      return "Hospital";
    default:
      return playbookId.replace("-", " ");
  }
}

interface OutcomeCardProps {
  outcome?: Outcome;
}

export default function OutcomeCard({ outcome: initialOutcome }: OutcomeCardProps) {
  const [outcome, setOutcome] = useState<Outcome>(initialOutcome ?? MOCK_OUTCOME);

  useEffect(() => {
    if (!initialOutcome) {
      const savedOutcomes = loadOutcomes();
      if (savedOutcomes.length > 0) {
        setOutcome(savedOutcomes[savedOutcomes.length - 1]);
      }
    }
  }, [initialOutcome]);

  const durationStr = formatDuration(outcome.startedAt, outcome.endedAt);
  const resultText = t(getResultMessageKey(outcome.result));
  const badgeStyle = getResultBadgeStyle(outcome.result);

  return (
    <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-6">
      {/* Prominent Reference Number on Top */}
      <div className="flex flex-col gap-1 border-b border-gray-100 pb-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {t("outcome.reference_label")}
        </span>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-extrabold tracking-tight text-gray-900 font-mono">
            {outcome.referenceNumber ?? t("outcome.no_reference")}
          </p>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badgeStyle}`}
          >
            {resultText}
          </span>
        </div>
      </div>

      {/* Playbook / Situation & Duration Grid */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex flex-col bg-gray-50 rounded-xl p-3 border border-gray-100">
          <span className="text-xs font-medium text-gray-500">
            {t("outcome.situation_label")}
          </span>
          <span className="font-semibold text-gray-800 capitalize mt-0.5">
            {formatPlaybookTitle(outcome.playbookId)}
          </span>
        </div>
        <div className="flex flex-col bg-gray-50 rounded-xl p-3 border border-gray-100">
          <span className="text-xs font-medium text-gray-500">
            {t("outcome.duration_label")}
          </span>
          <span className="font-semibold text-gray-800 mt-0.5">
            {durationStr}
          </span>
        </div>
      </div>

      {/* Collapsed Transcript section (View full conversation) */}
      <details className="group border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
        <summary className="cursor-pointer p-4 text-sm font-medium text-gray-700 flex items-center justify-between hover:bg-gray-100/70 transition-colors select-none">
          <span>{t("outcome.view_transcript")}</span>
          <svg
            className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="p-4 border-t border-gray-200 bg-white flex flex-col gap-3 max-h-72 overflow-y-auto">
          {outcome.transcript && outcome.transcript.length > 0 ? (
            outcome.transcript.map((entry, idx) => {
              const isClerk = entry.side === "clerk";
              return (
                <div
                  key={idx}
                  className={`flex flex-col gap-1 p-3 rounded-xl border text-xs leading-relaxed ${
                    isClerk
                      ? "bg-slate-50 border-slate-200 self-start max-w-[90%]"
                      : "bg-indigo-50/70 border-indigo-200 self-end max-w-[90%]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-gray-500">
                    <span>
                      {isClerk ? t("outcome.speaker_clerk") : t("outcome.speaker_you")}
                    </span>
                    <span className="font-mono text-[9px] text-gray-400">
                      {new Date(entry.t).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className={entry.redacted ? "font-mono text-gray-600" : "text-gray-800"}>
                    {entry.text}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">—</p>
          )}
        </div>
      </details>

      {/* New Call Action Button */}
      <Link
        href="/start"
        className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        {t("outcome.new_call")}
      </Link>
    </div>
  );
}
