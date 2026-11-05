"use client";

import { useEffect, useState } from "react";

const BLOCKS = 14;

export function BootSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("hfq_booted") === "1") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
    const timer = window.setTimeout(() => {
      sessionStorage.setItem("hfq_booted", "1");
      setShow(false);
    }, 1100);
    return () => window.clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="boot-splash" aria-hidden="true">
      <div className="boot-inner">
        <img className="boot-logo" src="/images/logo.png" alt="" />
        <div className="boot-title">HFQ NETWORK</div>
        <div className="boot-bar">
          {Array.from({ length: BLOCKS }).map((_, i) => (
            <span
              key={i}
              className="boot-block"
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
        <p className="mono text-[10px] tracking-[0.3em] text-hfq-dim">
          LOADING DASHBOARD
        </p>
      </div>
    </div>
  );
}
