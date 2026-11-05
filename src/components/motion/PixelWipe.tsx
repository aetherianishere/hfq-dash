"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const COLS = 12;
const ROWS = 8;
const PALETTE = ["#35141d", "#2b0f18", "#ff3047", "#9b1126", "#16080c"];

// Deterministic so server and client markup match.
const CELLS = Array.from({ length: COLS * ROWS }, (_, i) => ({
  delay: (((i * 37) % 97) / 97) * 0.16,
  color: PALETTE[(i * 7) % PALETTE.length],
}));

export function PixelWipe() {
  const pathname = usePathname();
  const [on, setOn] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOn(true);
    const timer = window.setTimeout(() => setOn(false), 480);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div className={`pixel-wipe ${on ? "is-on" : ""}`} aria-hidden="true">
      {CELLS.map((cell, i) => (
        <span
          key={i}
          className="pixel-wipe-cell"
          style={{
            backgroundColor: cell.color,
            animationDelay: `${cell.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
