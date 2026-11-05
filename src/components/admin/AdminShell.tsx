"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ExternalLink,
  LayoutDashboard,
  Landmark,
  Menu,
  Package,
  ReceiptText,
  ShieldCheck,
  Store,
  Users,
  X,
} from "lucide-react";
import { SignOutButton } from "@/components/admin/SignOutButton";
import type { AdminUser } from "@/lib/auth/admin";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true, adminOnly: false },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText, adminOnly: false },
  { href: "/admin/products", label: "Products", icon: Package, adminOnly: false },
  {
    href: "/admin/payment-accounts",
    label: "Payment accounts",
    icon: Landmark,
    adminOnly: false,
  },
  { href: "/admin/users", label: "Users & staff", icon: Users, adminOnly: true },
];

const ROLE_LABEL: Record<string, string> = {
  SUPPORT: "Support",
  STAFF: "Staff",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

export function AdminShell({
  user,
  pendingCount,
  children,
}: {
  user: AdminUser;
  pendingCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const section = pathname.startsWith("/admin/orders")
    ? "Orders"
    : pathname.startsWith("/admin/products")
      ? "Products"
      : pathname.startsWith("/admin/payment-accounts")
        ? "Payment accounts"
        : pathname.startsWith("/admin/users")
          ? "Users & staff"
          : "Overview";
  const canManageUsers = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${open ? "is-open" : ""}`}>
        <div className="flex items-center justify-between">
          <Link href="/admin" className="sidebar-brand" onClick={() => setOpen(false)}>
            <img src="/images/logo.png" alt="" />
            <span>
              HFQ <span className="text-hfq-red">ADMIN</span>
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
          <p className="sidebar-section-title">Operations</p>
          <nav className="sidebar-nav" aria-label="Admin">
            {NAV.filter(
              (item) => !item.adminOnly || canManageUsers,
            ).map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shell-nav-link ${active ? "shell-nav-active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={17} />
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/admin/orders" && pendingCount > 0 && (
                    <span className="admin-nav-badge">{pendingCount}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="sidebar-section-title">Store</p>
          <nav className="sidebar-nav" aria-label="Store">
            <Link href="/store" className="shell-nav-link" onClick={() => setOpen(false)}>
              <Store size={17} />
              View storefront
            </Link>
            <Link
              href={`/u/${user.publicId}`}
              className="shell-nav-link"
              onClick={() => setOpen(false)}
            >
              <ExternalLink size={17} />
              Player dashboard
            </Link>
          </nav>
        </div>

        <div className="player-card">
          <div className="player-card-top">
            <span className="grid h-11 w-11 place-items-center border-[3px] border-ink bg-bg text-hfq-gold">
              <ShieldCheck size={20} />
            </span>
            <div className="min-w-0">
              <div className="player-name truncate">{user.name}</div>
              <div className="player-rank">{ROLE_LABEL[user.role] ?? user.role}</div>
            </div>
          </div>
          <div className="mono truncate text-[10px] text-hfq-dim">{user.email}</div>
          <SignOutButton />
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
                {section}
              </div>
              <div className="mono truncate text-[10px] text-hfq-dim">
                {pathname}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.isDemo && (
              <span className="status-pill hidden sm:inline-flex">
                <span className="status-dot is-off" />
                Demo preview
              </span>
            )}
            <span className="status-pill hidden md:inline-flex">
              <ShieldCheck size={13} className="text-hfq-green" />
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
          </div>
        </header>

        <div className="shell-content">{children}</div>
      </div>
    </div>
  );
}
