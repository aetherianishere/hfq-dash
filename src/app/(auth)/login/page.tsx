import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const { next, reset } = await searchParams;
  return (
    <AuthShell>
      <LoginForm
        next={next ?? ""}
        notice={
          reset === "1"
            ? "Password updated. Sign in with your new password."
            : undefined
        }
      />
    </AuthShell>
  );
}
