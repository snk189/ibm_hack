"use client";

import { useState } from "react";

export interface DTMFPadProps {
  /** Callback fired when a DTMF key is pressed or clicked */
  onKeyPress?: (key: string) => void;
  /** Disable key interactions */
  disabled?: boolean;
  /** Custom container styling */
  className?: string;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

export default function DTMFPad({
  onKeyPress,
  disabled = false,
  className = "",
}: DTMFPadProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handleKeyPress = (k: string) => {
    if (disabled) return;
    setActiveKey(k);
    if (onKeyPress) {
      onKeyPress(k);
    }
    setTimeout(() => {
      setActiveKey((current) => (current === k ? null : current));
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, k: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleKeyPress(k);
    }
  };

  return (
    <div
      className={`w-full max-w-xs mx-auto p-4 bg-gray-900/90 backdrop-blur-md rounded-2xl border border-gray-800 shadow-xl ${className}`}
      role="group"
      aria-label="DTMF Keypad"
    >
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((k) => {
          const isActive = activeKey === k;
          return (
            <button
              key={k}
              type="button"
              disabled={disabled}
              onClick={() => handleKeyPress(k)}
              onKeyDown={(e) => handleKeyDown(e, k)}
              aria-label={`Key ${k}`}
              className={`h-14 sm:h-16 rounded-xl flex items-center justify-center font-mono text-xl sm:text-2xl font-bold transition-all duration-150 select-none outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                disabled
                  ? "opacity-40 cursor-not-allowed bg-gray-800 text-gray-500 border border-gray-700"
                  : isActive
                  ? "bg-indigo-600 text-white scale-95 shadow-inner border border-indigo-400"
                  : "bg-gray-800/80 hover:bg-gray-700/80 active:bg-indigo-600 text-gray-100 border border-gray-700/60 shadow-sm"
              }`}
            >
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
}
