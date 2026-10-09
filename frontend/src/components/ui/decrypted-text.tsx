"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Adapted from React Bits "Decrypted Text": scrambled characters resolve left to right each
// time `text` changes. Screen readers get the plain text; reduced motion shows it directly.
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*";

export function DecryptedText({ text, className }: { text: string; className?: string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (reduced) return;
    let revealed = 0;
    const id = window.setInterval(() => {
      revealed += 1;
      setShown(
        Array.from(text, (char, index) =>
          index < revealed || char === " " ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        ).join(""),
      );
      if (revealed >= text.length) window.clearInterval(id);
    }, 28);
    return () => window.clearInterval(id);
  }, [text, reduced]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{reduced ? text : shown}</span>
    </span>
  );
}
