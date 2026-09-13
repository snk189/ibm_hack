"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";

export interface NumberCapturedBannerProps {
  /** The reference or complaint number detected in live captions */
  referenceNumber: string;
  /** Callback fired when user confirms pinning the reference number */
  onConfirmPin?: (ref: string) => void;
  /** Callback fired when user dismisses the prompt */
  onDismiss?: () => void;
  /** UI language code */
  lang?: string;
}

export default function NumberCapturedBanner({
  referenceNumber,
  onConfirmPin,
  onDismiss,
  lang = "en",
}: NumberCapturedBannerProps) {
  const [pinned, setPinned] = useState(false);

  if (!referenceNumber) return null;

  const handleConfirm = () => {
    setPinned(true);
    if (onConfirmPin) {
      onConfirmPin(referenceNumber);
    }
  };

  return (
    <div
      role="region"
      aria-label="Reference number prompt"
      className={`w-full max-w-md p-4 rounded-2xl border transition-all shadow-sm flex flex-col gap-3 ${
        pinned
          ? "border-emerald-300 bg-emerald-50/90 text-emerald-900"
          : "border-indigo-200 bg-indigo-50/95 text-indigo-950"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
            {t("call.pin_prompt", { ref: referenceNumber }, lang)}
          </span>
        </div>
        <span className="font-mono text-base font-extrabold tracking-tight bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
          {referenceNumber}
        </span>
      </div>

      {!pinned ? (
        <div className="flex items-center justify-end gap-2 pt-1">
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white/80 hover:bg-white border border-gray-200 transition-colors cursor-pointer"
            >
              {t("call.pin_dismiss", undefined, lang)}
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm transition-colors cursor-pointer"
          >
            {t("call.pin_confirm", undefined, lang)}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 pt-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Pinned {referenceNumber}</span>
        </div>
      )}
    </div>
  );
}
