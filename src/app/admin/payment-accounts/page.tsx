import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, Edit, Landmark, Smartphone } from "lucide-react";
import {
  PaymentAccountForm,
  type PaymentAccountFormData,
} from "@/components/admin/PaymentAccountForm";
import { requireAdminPage } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Payment accounts" };

type Row = PaymentAccountFormData & { active: boolean };

const DEMO_ACCOUNTS: Row[] = [
  {
    id: "demo-bank",
    method: "BANK",
    label: "Main bank account",
    accountName: "HFQ Network",
    accountNumber: "1234567890",
    bankName: "Commercial Bank",
    branch: "Colombo",
    instructions: "Use your order reference as the transfer note.",
    active: true,
    sortOrder: 0,
  },
  {
    id: "demo-ez",
    method: "EZCASH",
    label: "eZ Cash number",
    accountName: "HFQ Network",
    accountNumber: "0771234567",
    bankName: "",
    branch: "",
    instructions: "Send the exact total and upload the SMS receipt.",
    active: true,
    sortOrder: 1,
  },
];

export default async function PaymentAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const admin = await requireAdminPage();
  const { edit } = await searchParams;

  let rows: Row[] = [];
  if (admin.isDemo) {
    rows = DEMO_ACCOUNTS;
  } else {
    try {
      const accounts = await prisma.paymentAccount.findMany({
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      });
      rows = accounts.map((account) => ({
        id: account.id,
        method: account.method,
        label: account.label,
        accountName: account.accountName,
        accountNumber: account.accountNumber,
        bankName: account.bankName ?? "",
        branch: account.branch ?? "",
        instructions: account.instructions ?? "",
        active: account.active,
        sortOrder: account.sortOrder,
      }));
    } catch (error) {
      console.error("[admin] payment accounts query failed", error);
    }
  }

  const selected = edit ? rows.find((row) => row.id === edit) : undefined;

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="section-label">PAYMENTS</p>
          <h1 className="page-title mt-2">Payment accounts</h1>
          <p className="page-sub">
            These details appear on the customer order page after checkout.
          </p>
        </div>
        <span className="status-pill">
          <Banknote size={14} className="text-hfq-gold" />
          Manual payments
        </span>
      </div>

      {admin.isDemo && (
        <div className="auth-error mb-5">
          Demo preview. Connect MySQL and disable DEMO_MODE to save changes.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="table-panel overflow-x-auto">
          <div className="panel-head">
            <span className="panel-title">Configured accounts</span>
            <span className="mono text-xs text-hfq-dim">{rows.length}</span>
          </div>

          {rows.length === 0 ? (
            <div className="empty-state">
              <Landmark size={26} className="text-hfq-dim" />
              <div>
                <p className="font-display text-lg text-hfq-text">
                  No accounts yet
                </p>
                <p className="mt-1 text-sm">
                  Add at least one bank or eZ Cash account before accepting orders.
                </p>
              </div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Number</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="flex items-center gap-2 font-display text-sm text-hfq-text">
                        {row.method === "EZCASH" ? (
                          <Smartphone size={14} className="text-hfq-gold" />
                        ) : (
                          <Landmark size={14} className="text-hfq-gold" />
                        )}
                        {row.label}
                      </div>
                      <div className="mt-0.5 text-[10px] text-hfq-dim">
                        {row.accountName}
                        {row.bankName ? ` · ${row.bankName}` : ""}
                      </div>
                    </td>
                    <td className="mono text-xs">{row.accountNumber}</td>
                    <td>
                      <span
                        className={`badge ${row.active ? "badge-green" : "badge-dim"}`}
                      >
                        {row.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/admin/payment-accounts?edit=${row.id}`}
                        className="btn-ghost"
                      >
                        <Edit size={13} />
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <p className="panel-title mb-2">
            {selected ? `Edit ${selected.label}` : "Add an account"}
          </p>
          <PaymentAccountForm
            key={selected?.id ?? "new"}
            initial={selected}
            demo={admin.isDemo}
          />
        </div>
      </div>
    </div>
  );
}
