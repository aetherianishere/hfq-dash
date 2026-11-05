import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { getSession } from "@/lib/auth/session";
import type { Viewer } from "@/lib/auth/types";
import { demoViewer } from "@/data/demo";

export const getViewer = cache(async (publicId: string): Promise<Viewer> => {
  if (process.env.DEMO_MODE === "1") {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[hfq-dash] DEMO_MODE is enabled in production. Disable it before launch.",
      );
    }
    return demoViewer(publicId);
  }

  const session = await getSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/u/${publicId}`)}`);
  }

  if (session.user.publicId !== publicId) {
    redirect(`/u/${session.user.publicId}`);
  }

  const profile = session.user.profile;

  return {
    id: session.user.id,
    publicId: session.user.publicId,
    email: session.user.email,
    role: session.user.role,
    emailVerified: session.user.emailVerified,
    totpEnabled: session.user.totpEnabled,
    isDemo: false,
    profile: profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          minecraftUsername: profile.minecraftUsername,
          setupStep: profile.setupStep,
          birthday: profile.birthday
            ? profile.birthday.toISOString().slice(0, 10)
            : null,
          country: profile.country,
          bio: profile.bio,
          marketingOptIn: profile.marketingOptIn,
        }
      : null,
  };
});

export function isStaff(viewer: Viewer) {
  return ["SUPPORT", "STAFF", "ADMIN", "SUPER_ADMIN"].includes(viewer.role);
}

export function isAdmin(viewer: Viewer) {
  return ["ADMIN", "SUPER_ADMIN"].includes(viewer.role);
}
