"use client";
// ISLAvatar — renders Indian Sign Language avatar using CWASA SiGML player.
// Receives a gloss array (e.g. ["MORNING", "POWER", "CUT"]) and animates signing.
// Unknown words are fingerspelled (each character as a separate sign).
// ISL sign files vendored from github.com/shoebham/text_to_isl — credit in README.
//
// The CWASA player (allcsa.min.js) is loaded from /isl/js/ at runtime via a
// <script> tag so it can access the global DOM.

import { useEffect, useRef } from "react";

interface Props {
  /** Array of uppercase English gloss words, e.g. ["POWER", "CUT"] */
  gloss: string[];
  /** Whether the avatar panel is visible */
  visible?: boolean;
}

declare global {
  interface Window {
    // CWASA player API (loaded via /isl/js/allcsa.min.js)
    CWASAPlayer?: {
      init: (containerId: string, configUrl: string) => void;
      playSiGMLText: (sigml: string) => void;
      playSiGMLURL: (url: string) => void;
    };
  }
}

export default function ISLAvatar({ gloss, visible = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerReady = useRef(false);

  // Load CWASA player script once.
  useEffect(() => {
    if (playerReady.current) return;
    const script = document.createElement("script");
    script.src = "/isl/js/allcsa.min.js";
    script.async = true;
    script.onload = () => {
      if (window.CWASAPlayer && containerRef.current) {
        window.CWASAPlayer.init(
          containerRef.current.id,
          "/isl/js/cwaclientcfg.json"
        );
        playerReady.current = true;
      }
    };
    document.head.appendChild(script);
    return () => {
      script.onload = null;
    };
  }, []);

  // Play signs whenever gloss array changes.
  useEffect(() => {
    if (!playerReady.current || !window.CWASAPlayer || gloss.length === 0) return;
    // Play each gloss word by loading its SiGML file from /isl/SignFiles/
    // Unknown words fall back to fingerspelling via letter SiGML files.
    (async () => {
      for (const word of gloss) {
        const url = `/isl/SignFiles/${encodeURIComponent(word)}.sigml`;
        try {
          const res = await fetch(url, { method: "HEAD" });
          if (res.ok) {
            window.CWASAPlayer!.playSiGMLURL(url);
          } else {
            // Fingerspell: play each character individually.
            for (const char of word.toUpperCase()) {
              const charUrl = `/isl/SignFiles/${encodeURIComponent(char)}.sigml`;
              window.CWASAPlayer!.playSiGMLURL(charUrl);
            }
          }
        } catch {
          // Silently skip unknown signs.
        }
      }
    })();
  }, [gloss]);

  if (!visible) return null;

  return (
    <div className="w-full aspect-video bg-gray-100 rounded overflow-hidden">
      <div
        id="cwasa-player-container"
        ref={containerRef}
        className="w-full h-full"
      />
    </div>
  );
}
