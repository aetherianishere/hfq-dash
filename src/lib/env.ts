const isProd = process.env.NODE_ENV === "production";

function required(name: string, fallback: string) {
  const value = process.env[name];
  if (value) return value;
  if (isProd) throw new Error(`Missing required environment variable: ${name}`);
  return fallback;
}

export const env = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  authSecret: required("AUTH_SECRET", "dev-only-auth-secret-change-before-deploy"),
  encryptionKey: process.env.ENCRYPTION_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "HFQ Network <noreply@hfqmc.xyz>",
  emailReplyTo: process.env.EMAIL_REPLY_TO ?? "support@hfqmc.xyz",
  isProd,
};
