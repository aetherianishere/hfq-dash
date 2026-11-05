import type { Metadata } from "next";
import Link from "next/link";
import {
  AtSign,
  CalendarDays,
  Globe2,
  KeyRound,
  Pencil,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { getViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const viewer = await getViewer(publicId);
  const base = `/u/${viewer.publicId}`;
  const profile = viewer.profile;
  const name =
    profile?.displayName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "HFQ Player";
  const avatar =
    profile?.avatarUrl ||
    (profile?.minecraftUsername
      ? `https://mc-heads.net/avatar/${encodeURIComponent(
          profile.minecraftUsername,
        )}/128`
      : "/images/logo.png");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Your profile and account details.</p>
        </div>
        <Link
          href={`${base}/setup?next=${encodeURIComponent(`${base}/settings`)}`}
          className="mc-btn mc-btn-sm"
        >
          <Pencil size={14} />
          Edit profile
        </Link>
      </div>

      <div className="panel p-5">
        <div className="flex flex-wrap items-center gap-4">
          <img
            className="h-20 w-20 border-4 border-ink bg-bg p-1"
            src={avatar}
            alt=""
          />
          <div className="min-w-0">
            <h2 className="font-display text-2xl text-hfq-text">{name}</h2>
            <p className="mono mt-1 text-xs text-hfq-gold">
              {profile?.minecraftUsername ?? "No Minecraft username yet"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`badge ${
                  viewer.emailVerified ? "badge-green" : "badge-red"
                }`}
              >
                {viewer.emailVerified ? "Email verified" : "Email unverified"}
              </span>
              <span className="badge badge-dim">{viewer.role}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="slot flex items-start gap-3 p-3">
            <AtSign size={16} className="mt-0.5 text-hfq-gold" />
            <div className="min-w-0">
              <div className="kpi-label">Email</div>
              <div className="mt-1 truncate text-sm">{viewer.email}</div>
            </div>
          </div>
          <div className="slot flex items-start gap-3 p-3">
            <UserRound size={16} className="mt-0.5 text-hfq-gold" />
            <div className="min-w-0">
              <div className="kpi-label">User ID</div>
              <div className="mono mt-1 truncate text-sm">{viewer.publicId}</div>
            </div>
          </div>
          <div className="slot flex items-start gap-3 p-3">
            <CalendarDays size={16} className="mt-0.5 text-hfq-gold" />
            <div>
              <div className="kpi-label">Birthday</div>
              <div className="mt-1 text-sm">{profile?.birthday ?? "Not set"}</div>
            </div>
          </div>
          <div className="slot flex items-start gap-3 p-3">
            <Globe2 size={16} className="mt-0.5 text-hfq-gold" />
            <div>
              <div className="kpi-label">Country</div>
              <div className="mt-1 text-sm">{profile?.country ?? "Not set"}</div>
            </div>
          </div>
        </div>

        {profile?.bio && (
          <p className="mt-4 border-l-4 border-hfq-red pl-3 text-sm text-hfq-soft">
            {profile.bio}
          </p>
        )}
      </div>

      <div className="table-panel mt-5">
        <div className="panel-head">
          <span className="panel-title">Account security</span>
          <ShieldCheck size={16} className="text-hfq-gold" />
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-sm text-hfq-text">Password</p>
              <p className="text-xs text-hfq-dim">
                Request a reset code from the sign-in page if you need a new
                password.
              </p>
            </div>
            <Link href="/forgot-password" className="badge badge-dim hover:text-hfq-gold">
              Reset
            </Link>
          </div>
          <div className="flex items-center justify-between gap-3 border-t-2 border-ink pt-3">
            <div>
              <p className="font-display text-sm text-hfq-text">Sessions</p>
              <p className="text-xs text-hfq-dim">
                Sign out every device from the sidebar.
              </p>
            </div>
            <KeyRound size={16} className="text-hfq-dim" />
          </div>
        </div>
      </div>
    </div>
  );
}
