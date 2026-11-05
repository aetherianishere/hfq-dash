import { PixelBackground } from "@/components/motion/PixelBackground";
import { Check } from "lucide-react";

const POINTS = [
  "Track every order in one place",
  "Upload payment receipts securely",
  "Claim ranks, keys, and shards",
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <aside className="auth-hero">
        <PixelBackground
          className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
          seed={5}
          density={70}
        />
        <div className="auth-hero-content">
          <img className="auth-logo" src="/images/logo.png" alt="HFQ Network" />
          <h1 className="auth-hero-title glitch" data-text="HFQ DASH">
            HFQ DASH
          </h1>
          <p className="auth-hero-sub">
            Your account, your orders, your ranks. One dashboard for everything
            HFQ Network.
          </p>
          <ul className="auth-hero-points">
            {POINTS.map((point) => (
              <li key={point}>
                <Check size={15} strokeWidth={4} />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="auth-side">{children}</section>
    </div>
  );
}
