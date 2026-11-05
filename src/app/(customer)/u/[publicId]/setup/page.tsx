import type { Metadata } from "next";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { getViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = { title: "Profile setup" };

export default async function SetupPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { publicId } = await params;
  const { next } = await searchParams;
  const viewer = await getViewer(publicId);

  return <SetupWizard viewer={viewer} next={next ?? ""} />;
}
