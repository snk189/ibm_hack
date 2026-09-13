"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Playbook, PlaybookFact } from "@/lib/types";
import { loadFacts, saveFacts } from "@/lib/store";
import { t } from "@/lib/i18n";

import powerCutJson from "@/playbooks/power-cut.json";
import bankJson from "@/playbooks/bank.json";
import hospitalJson from "@/playbooks/hospital.json";

const PLAYBOOKS: Playbook[] = [
  powerCutJson as unknown as Playbook,
  bankJson as unknown as Playbook,
  hospitalJson as unknown as Playbook,
];

export default function StartPage() {
  const router = useRouter();
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>("power-cut");
  const [savedFacts, setSavedFacts] = useState<Record<string, string>>({});
  const [activeLang, setActiveLang] = useState<string>("en");
  const [editingFactKey, setEditingFactKey] = useState<string | null>(null);

  useEffect(() => {
    const facts = loadFacts();
    setSavedFacts(facts);
    if (facts.ui_language) {
      setActiveLang(facts.ui_language);
    }
  }, []);

  const selectedPlaybook =
    PLAYBOOKS.find((p) => p.id === selectedPlaybookId) ?? PLAYBOOKS[0];

  const handleFactChange = (key: string, value: string) => {
    setSavedFacts((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleStartCall = () => {
    // Save any confirmed/edited facts to store
    saveFacts(savedFacts);

    // Save active call configuration for /call loop
    sessionStorage.setItem(
      "setu:activeCall",
      JSON.stringify({
        playbookId: selectedPlaybook.id,
        callLanguage: savedFacts.call_language ?? selectedPlaybook.defaultCallLanguage ?? "hi",
        facts: savedFacts,
        startedAt: Date.now(),
      })
    );

    // Navigate to /call route owned by Tanis
    router.push("/call");
  };

  const getPlaybookIcon = (iconName: string) => {
    switch (iconName) {
      case "zap":
        return (
          <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case "shield-alert":
        return (
          <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case "hospital":
        return (
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        );
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/60 py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white border border-gray-200 shadow-sm rounded-2xl p-6 sm:p-8 flex flex-col gap-8">
        {/* Header Section */}
        <div className="border-b border-gray-100 pb-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {t("start.title", undefined, activeLang)}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("start.subtitle", undefined, activeLang)}
          </p>
        </div>

        {/* Situation Cards Selection */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">
            {t("start.select_situation", undefined, activeLang)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLAYBOOKS.map((playbook) => {
              const isSelected = playbook.id === selectedPlaybookId;
              const titleText = playbook.title[activeLang] || playbook.title["en"] || playbook.id;
              const goalText = playbook.goal[activeLang] || playbook.goal["en"] || "";

              return (
                <button
                  key={playbook.id}
                  type="button"
                  onClick={() => setSelectedPlaybookId(playbook.id)}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-white border border-gray-100 shadow-2xs">
                      {getPlaybookIcon(playbook.icon)}
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">{titleText}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                    {goalText}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Facts Confirmation / Editing Section */}
        <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {t("start.confirm_facts", undefined, activeLang)}
              </h2>
              <p className="text-xs text-gray-500">
                {t("start.facts_desc", undefined, activeLang)}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 uppercase font-mono">
              {t("start.call_language_label", undefined, activeLang)}: {(savedFacts.call_language ?? selectedPlaybook.defaultCallLanguage ?? "hi").toUpperCase()}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mt-1">
            {selectedPlaybook.facts.map((fact: PlaybookFact) => {
              const labelText = fact.label[activeLang] || fact.label["en"] || fact.key;
              const currentValue = savedFacts[fact.key] ?? "";
              const isEditing = editingFactKey === fact.key;

              return (
                <div
                  key={fact.key}
                  className="flex flex-col gap-1 p-3 rounded-xl border border-gray-200 bg-gray-50/80 min-w-[200px] flex-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      {labelText} {fact.required && <span className="text-rose-500">*</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingFactKey(isEditing ? null : fact.key)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      {isEditing ? "Done" : "Edit"}
                    </button>
                  </div>

                  {isEditing ? (
                    <input
                      type="text"
                      value={currentValue}
                      autoFocus
                      onChange={(e) => handleFactChange(fact.key, e.target.value)}
                      onBlur={() => setEditingFactKey(null)}
                      placeholder={`Enter ${labelText}`}
                      className="mt-1 px-3 py-1.5 rounded-lg border border-indigo-300 bg-white text-xs text-gray-900 outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <span
                      onClick={() => setEditingFactKey(fact.key)}
                      className={`text-sm font-semibold cursor-pointer truncate mt-0.5 ${
                        currentValue ? "text-gray-900" : "text-gray-400 italic font-normal"
                      }`}
                    >
                      {currentValue || `[Click to add ${labelText}]`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Prominent Call Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleStartCall}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-4 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-3 text-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{t("start.call_button", undefined, activeLang)}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
