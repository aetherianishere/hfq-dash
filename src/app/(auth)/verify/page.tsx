import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { VerifyForm } from "@/components/auth/VerifyForm";

export const metadata: Metadata = { title: "Verify email" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email, next } = await searchParams;

  if (!email) {
    return (
      <AuthShell>
        <h1 className="auth-title">Link expired</h1>
        <p className="auth-sub">
          We don&apos;t have an email to verify. Start the signup again.
        </p>
        <Link href="/register" className="mc-btn mt-6 w-full">
          Create account
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <VerifyForm email={email} next={next ?? ""} />
    </AuthShell>
  );
}
