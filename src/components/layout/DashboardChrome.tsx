"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Check,
  Copy,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  X,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import type { Viewer, ViewerRole, ViewerStats } from "@/lib/auth/types";

const ROLE_LABEL: Record<ViewerRole, string> = {
  CUSTOMER: "Player",
  SUPPORT: "Support",
  STAFF: "Staff",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

const TITLES: Record<string, string> = {
  orders: "Orders",
  notifications: "Notifications",
  settings: "Settings",
  setup: "Profile setup",
  store: "Store",
};

export function DashboardChrome({
  viewer,
  stats,
  children,
}: {
  viewer: Viewer;
  stats: ViewerStats;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const base = `/u/${viewer.publicId}`;
  const isAdminPanel = pathname.startsWith("/admin");
  const section = isAdminPanel
    ? "admin"
    : pathname.startsWith(base)
      ? (pathname.slice(base.length).split("/").filter(Boolean)[0] ?? "")
      : "";
  const title = isAdminPanel ? "Admin panel" : (TITLES[section] ?? "Overview");

  const profile = viewer.profile;
  const name =
    profile?.displayName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "HFQ Player";
  const avatar =
    profile?.avatarUrl ||
    (profile?.minecraftUsername
      ? `https://mc-heads.net/avatar/${encodeURIComponent(profile.minecraftUsername)}/96`
      : "/images/logo.png");

  const links = [
    { href: base, label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `${base}/orders`, label: "Orders", icon: ReceiptText },
    { href: `${base}/store`, label: "Store", icon: ShoppingBag },
    { href: `${base}/notifications`, label: "Notifications", icon: Bell },
    { href: `${base}/settings`, label: "Settings", icon: Settings },
  ];

  const staff = ["SUPPORT", "STAFF", "ADMIN", "SUPER_ADMIN"].includes(
    viewer.role,
  );

  async function copyId() {
    try {
      await navigator.clipboard.writeText(viewer.publicId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the id is still selectable.
    }
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${open ? "is-open" : ""}`}>
        <div className="flex items-center justify-between">
          <Link href={base} className="sidebar-brand" onClick={() => setOpen(false)}>
            <img src="/images/logo.png" alt="" />
            <span>
              HFQ <span className="text-hfq-red">DASH</span>
            </span>
          </Link>
          <button
            type="button"
            className="btn-ghost hidden max-[860px]:inline-flex"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <div>
          <p className="sidebar-section-title">Account</p>
          <nav className="sidebar-nav" aria-label="Dashboard">
            {links.map((link) => {
              const active =
                link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shell-nav-link ${active ? "shell-nav-active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={17} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="sidebar-section-title">Help</p>
          <nav className="sidebar-nav" aria-label="Help">
            <a
              href="https://hfqmc.xyz/discord"
              target="_blank"
              rel="noreferrer"
              className="shell-nav-link"
              onClick={() => setOpen(false)}
            >
              <LifeBuoy size={17} />
              Discord support
            </a>
            {staff && (
              <Link
                href="/admin"
                className={`shell-nav-link ${
                  isAdminPanel ? "shell-nav-active" : ""
                }`}
                onClick={() => setOpen(false)}
              >
                <ShieldCheck size={17} />
                Admin panel
              </Link>
            )}
          </nav>
        </div>

        <div className="player-card">
          <div className="player-card-top">
            <img className="player-head" src={avatar} alt="" />
            <div className="min-w-0">
              <div className="player-name truncate">{name}</div>
              <div className="player-rank">{ROLE_LABEL[viewer.role]}</div>
            </div>
          </div>

          <div className="player-id">
            <code title={viewer.publicId}>{viewer.publicId}</code>
            <button type="button" onClick={copyId} aria-label="Copy user ID">
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>

          <div className="player-stats">
            <div>
              Orders
              <b>{stats.totalOrders}</b>
            </div>
            <div>
              Pending
              <b>{stats.pendingOrders}</b>
            </div>
            <div>
              Spent
              <b>{stats.spentLabel}</b>
            </div>
          </div>

          <button
            type="button"
            className="btn-ghost w-full justify-center"
            onClick={signOut}
            disabled={signingOut}
          >
            <LogOut size={14} />
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      )}

      <div className="shell-main">
        <header className="shell-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="btn-ghost hidden max-[860px]:inline-flex"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <div className="truncate font-display text-lg leading-tight text-hfq-text">
                {title}
              </div>
              <div className="mono truncate text-[10px] text-hfq-dim">
                /u/{viewer.publicId}
                {section && section !== "admin" ? `/${section}` : ""}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="status-pill hidden sm:inline-flex">
              <span className="status-dot is-on" />
              Store online
            </span>
            <Link
              href={`${base}/notifications`}
              className="btn-ghost"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </Link>
          </div>
        </header>

        <div className="shell-content">{children}</div>
        <Footer />
      </div>
    </div>
  );
}
