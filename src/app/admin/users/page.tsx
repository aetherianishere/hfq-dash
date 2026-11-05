import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, ShieldCheck, ShieldOff, Users } from "lucide-react";
import { RoleSelect } from "@/components/admin/RoleSelect";
import { requireAdminPage } from "@/lib/auth/admin";
import { getAdminUsers, type AdminUserRow } from "@/lib/admin/users";

export const metadata: Metadata = { title: "Users" };

function demoRows(): AdminUserRow[] {
  const now = new Date();
  return [
    {
      id: "demo-founder",
      publicId: "b7k2m9q4v1t8z3x",
      email: "admin@hfqmc.xyz",
      name: "HFQ Admin",
      role: "SUPER_ADMIN",
      emailVerified: true,
      totpEnabled: true,
      isFounder: true,
      isSuspended: false,
      createdAt: now,
      lastLoginAt: now,
    },
    {
      id: "demo-player",
      publicId: "x3fbc9k2m7q1v8z",
      email: "player@hfqmc.xyz",
      name: "HFQ_Player",
      role: "CUSTOMER",
      emailVerified: true,
      totpEnabled: false,
      isFounder: false,
      isSuspended: false,
      createdAt: now,
      lastLoginAt: null,
    },
    {
      id: "demo-staff",
      publicId: "m4q8v1t7z2x9c5b",
      email: "staff@hfqmc.xyz",
      name: "HFQ Staff",
      role: "STAFF",
      emailVerified: true,
      totpEnabled: true,
      isFounder: false,
      isSuspended: false,
      createdAt: now,
      lastLoginAt: now,
    },
  ];
}

function pageHref(q: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/admin/users${query ? `?${query}` : ""}`;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const admin = await requireAdminPage();
  const { q = "", page: rawPage } = await searchParams;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);

  let rows: AdminUserRow[] = [];
  let total = 0;
  let pageCount = 1;
  let loadError = "";

  if (admin.isDemo) {
    const query = q.trim().toLowerCase();
    rows = demoRows().filter(
      (row) =>
        !query ||
        row.email.toLowerCase().includes(query) ||
        row.name.toLowerCase().includes(query) ||
        row.publicId.includes(query),
    );
    total = rows.length;
  } else {
    try {
      const result = await getAdminUsers({ q, page });
      rows = result.rows;
      total = result.total;
      pageCount = result.pageCount;
    } catch (error) {
      console.error("[admin] users query failed", error);
      loadError = "Could not load users. Check the database connection.";
    }
  }

  const canAssignSuper = admin.role === "SUPER_ADMIN";

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="section-label">ACCESS</p>
          <h1 className="page-title mt-2">Users &amp; staff</h1>
          <p className="page-sub">
            Promote trusted players to support, staff, or admin. Staff need
            two-factor authentication before the admin panel unlocks.
          </p>
        </div>
      </div>

      {admin.isDemo && (
        <div className="auth-error mb-5">
          Demo preview. Connect MySQL and disable DEMO_MODE to change roles.
        </div>
      )}
      {loadError && <div className="auth-error mb-5">{loadError}</div>}

      <form className="mb-4 flex flex-wrap gap-2" action="/admin/users">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search users</span>
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-hfq-dim"
          />
          <input
            className="auth-input pl-9"
            name="q"
            defaultValue={q}
            placeholder="Search email, name, or user ID"
          />
        </label>
        <button className="mc-btn" type="submit">
          Search
        </button>
        {q && (
          <Link href="/admin/users" className="btn-ghost">
            Clear
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <div className="table-panel">
          <div className="empty-state">
            <Users size={28} className="text-hfq-dim" />
            <div>
              <p className="font-display text-lg text-hfq-text">No users found</p>
              <p className="mt-1 text-sm">
                {q ? "Try a different search." : "No accounts have registered yet."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="table-panel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>2FA</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Last login</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isSelf = row.publicId === admin.publicId;
                  const blockedSuper =
                    !canAssignSuper && row.role === "SUPER_ADMIN";
                  const locked = isSelf || row.isFounder || blockedSuper;
                  const reason = isSelf
                    ? "You cannot change your own role."
                    : row.isFounder
                      ? "The founder role is protected."
                      : blockedSuper
                        ? "Only a super admin can manage this account."
                        : undefined;

                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="min-w-0">
                          <div className="font-display text-sm text-hfq-text">
                            {row.name}
                            {row.isFounder && (
                              <span className="ml-2 badge badge-gold">Founder</span>
                            )}
                          </div>
                          <div className="mono text-[10px] text-hfq-dim">
                            {row.email} · {row.publicId}
                          </div>
                        </div>
                      </td>
                      <td>
                        <RoleSelect
                          publicId={row.publicId}
                          role={row.role}
                          demo={admin.isDemo}
                          locked={locked}
                          canAssignSuper={canAssignSuper}
                          reason={reason}
                        />
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            row.totpEnabled ? "badge-green" : "badge-dim"
                          }`}
                        >
                          {row.totpEnabled ? (
                            <ShieldCheck size={12} />
                          ) : (
                            <ShieldOff size={12} />
                          )}
                          {row.totpEnabled ? "On" : "Off"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            row.emailVerified ? "badge-green" : "badge-red"
                          }`}
                        >
                          {row.emailVerified ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-xs">
                        {row.createdAt.toLocaleDateString("en-GB")}
                      </td>
                      <td className="whitespace-nowrap text-xs">
                        {row.lastLoginAt
                          ? row.lastLoginAt.toLocaleDateString("en-GB")
                          : "Never"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!admin.isDemo && pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-hfq-dim">
              <span>
                {total} user{total === 1 ? "" : "s"} · page {page} of {pageCount}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={pageHref(q, page - 1)} className="btn-ghost">
                    <ChevronLeft size={14} /> Previous
                  </Link>
                )}
                {page < pageCount && (
                  <Link href={pageHref(q, page + 1)} className="btn-ghost">
                    Next <ChevronRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
