"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, Copy } from "lucide-react";
import { DiscordIcon } from "@/components/ui/DiscordIcon";
import { footerNav, links, partner, site } from "@/data/site";

const year = new Date().getFullYear();

export function Footer() {
  const footerRef = useRef<HTMLElement | null>(null);
  const artRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const footer = footerRef.current;
    const art = artRef.current;
    if (!footer || !art) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = footer.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const progress = Math.min(
        1,
        Math.max(0, (viewport - rect.top) / (rect.height || 1)),
      );

      art.style.transform = `translate3d(0, ${180 - 180 * progress}px, 0) rotate(${22 - 14 * progress}deg)`;
      art.style.opacity = String(Math.min(0.35, (progress / 0.6) * 0.35));
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  async function copyIp() {
    try {
      await navigator.clipboard.writeText(site.ip);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; the address is still selectable.
    }
  }

  return (
    <footer className="footer" ref={footerRef}>
      <div className="footer-art-wrap" ref={artRef} aria-hidden="true">
        <img src="/images/footer-sword.png" alt="" className="footer-art" />
      </div>

      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand reveal" style={{ "--i": 0 } as CSSProperties}>
            <a
              href={site.mainSite}
              className="nav-brand"
              target="_blank"
              rel="noreferrer"
            >
              <img src="/images/logo.png" alt="HFQ" />
              <span>
                HFQ <span className="nav-brand-accent">Network</span>
              </span>
            </a>
            <p className="footer-about">{site.description}</p>

            <button onClick={copyIp} className="footer-ip" type="button">
              <span>
                <span className="footer-ip-label">Server address</span>
                <span className="footer-ip-value">
                  {copied ? "Address copied" : site.ip}
                </span>
              </span>
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>

          <div className="reveal" style={{ "--i": 1 } as CSSProperties}>
            <h4 className="footer-heading">Navigation</h4>
            <ul className="footer-links">
              {footerNav.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href}>{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="reveal" style={{ "--i": 2 } as CSSProperties}>
            <h4 className="footer-heading">Community</h4>
            <ul className="footer-links">
              <li>
                <a href={links.discord} target="_blank" rel="noreferrer">
                  Discord
                </a>
              </li>
              <li>
                <Link href={links.store}>Store</Link>
              </li>
              <li>
                <a href={links.vote} target="_blank" rel="noreferrer">
                  Vote
                </a>
              </li>
              <li>
                <a href={links.jobs} target="_blank" rel="noreferrer">
                  Jobs
                </a>
              </li>
              <li>
                <a href={links.aurex} target="_blank" rel="noreferrer">
                  Aurex Partner
                </a>
              </li>
            </ul>
          </div>

          <div className="reveal" style={{ "--i": 3 } as CSSProperties}>
            <h4 className="footer-heading">Support</h4>
            <ul className="footer-links">
              <li>
                <a href={links.discord} target="_blank" rel="noreferrer">
                  Open a Ticket
                </a>
              </li>
              <li>
                <a href={links.discord} target="_blank" rel="noreferrer">
                  Ban Appeals
                </a>
              </li>
              <li>
                <a href={links.discord} target="_blank" rel="noreferrer">
                  Report a Player
                </a>
              </li>
            </ul>
            <a
              href={links.discord}
              target="_blank"
              rel="noreferrer"
              className="footer-social"
              aria-label="Discord"
            >
              <DiscordIcon size={20} />
            </a>
          </div>
        </div>

        <div
          className="footer-bottom reveal"
          style={{ "--i": 4 } as CSSProperties}
        >
          <div>
            <p>© {year} HFQ Network. All rights reserved.</p>
            <p className="footer-disclaimer">
              Not an official Minecraft product. Not approved by or associated
              with Mojang or Microsoft.
            </p>
          </div>
          <a
            href={partner.url}
            target="_blank"
            rel="noreferrer"
            className="footer-powered"
          >
            {partner.label}
            <img src={partner.logo} alt="" />
            <strong>{partner.name}</strong>
          </a>
        </div>

        <div className="footer-dev-row">
          <a
            href="https://frozenx.xyz"
            target="_blank"
            rel="noreferrer"
            className="footer-dev"
            aria-label="Developed by FrozenX"
          >
            <span>Developed by</span>
            <span className="footer-dev-name">FrozenX</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
