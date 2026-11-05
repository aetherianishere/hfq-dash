"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/store", label: "Store" },
  { href: "https://hfqmc.xyz/vote", label: "Vote", external: true },
  { href: "https://hfqmc.xyz/discord", label: "Discord", external: true },
];

export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-nav ${scrolled ? "is-scrolled" : ""}`}>
      <div className="nav-inner">
        <Link href="/" className="nav-brand">
          <img src="/images/logo.png" alt="" />
          <span>
            HFQ<span className="nav-brand-accent">MC</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Main">
          {LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                className="nav-link"
                target="_blank"
                rel="noreferrer"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href))
                    ? "is-active"
                    : ""
                }`}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>


        <div className="flex items-center gap-2">
          <Link href="/login" className="mc-btn mc-btn-sm hidden sm:inline-flex">
            Dashboard
          </Link>
          <button
            type="button"
            className="btn-ghost hidden max-[860px]:inline-flex"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-auto mt-2 w-[calc(100%-2rem)] max-w-3xl panel p-3">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="shell-nav-link"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="shell-nav-link"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ),
            )}
            <Link href="/login" className="mc-btn mt-2" onClick={() => setOpen(false)}>
              Open dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
