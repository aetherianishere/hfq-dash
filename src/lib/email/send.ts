import "server-only";

import { Resend } from "resend";
import { env } from "@/lib/env";

function codeEmail({
  code,
  name,
  title,
  intro,
}: {
  code: string;
  name?: string;
  title: string;
  intro: string;
}) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#16080c;color:#fbeee6;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#16080c;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#35141d;border:4px solid #0b0406;">
            <tr>
              <td style="padding:24px 28px;border-bottom:4px solid #0b0406;background:#2b0f18;">
                <div style="font-size:22px;font-weight:700;letter-spacing:2px;color:#fbeee6;">HFQ <span style="color:#ff3047;">NETWORK</span></div>
                <div style="font-size:11px;letter-spacing:3px;color:#b3969e;margin-top:6px;">${title}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#dcc5c4;">${greeting}</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#dcc5c4;">${intro}</p>
                <div style="background:#0b0406;border:3px solid #ffc93c;padding:18px;text-align:center;margin:0 0 20px;">
                  <div style="font-family:'Courier New',monospace;font-size:38px;font-weight:700;letter-spacing:12px;color:#ffc93c;">${code}</div>
                </div>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#cdb4b4;">
                  This code expires in 10 minutes and can only be used once.
                </p>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#cdb4b4;">
                  If you did not request this, you can ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:3px solid #0b0406;background:#1d0c11;font-size:11px;line-height:1.6;color:#b3969e;">
                HFQ Network · <a href="https://hfqmc.xyz" style="color:#ffc93c;text-decoration:none;">hfqmc.xyz</a><br />
                Need help? Reply to this email or contact support@hfqmc.xyz.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendCodeEmail({
  to,
  code,
  name,
  subject,
  title,
  intro,
  text,
  devLabel,
}: {
  to: string;
  code: string;
  name?: string;
  subject: string;
  title: string;
  intro: string;
  text: string;
  devLabel: string;
}) {
  if (!env.resendApiKey) {
    // Local development: the code is printed so the flow can be tested without Resend.
    console.info(`[email:dev] ${devLabel} for ${to}: ${code}`);
    return { dev: true };
  }

  const resend = new Resend(env.resendApiKey);
  const { error } = await resend.emails.send({
    from: env.emailFrom,
    to,
    replyTo: env.emailReplyTo,
    subject,
    html: codeEmail({ code, name, title, intro }),
    text,
  });

  if (error) {
    throw new Error(`Resend rejected the email: ${error.message}`);
  }

  return { dev: false };
}

export async function sendVerificationEmail({
  to,
  code,
  name,
}: {
  to: string;
  code: string;
  name?: string;
}) {
  return sendCodeEmail({
    to,
    code,
    name,
    subject: `${code} is your HFQ verification code`,
    title: "DASHBOARD VERIFICATION",
    intro:
      "Use the code below to verify your email and finish creating your HFQ account.",
    text: `Your HFQ verification code is ${code}. It expires in 10 minutes.`,
    devLabel: "verification code",
  });
}

export async function sendPasswordResetEmail({
  to,
  code,
  name,
}: {
  to: string;
  code: string;
  name?: string;
}) {
  return sendCodeEmail({
    to,
    code,
    name,
    subject: `${code} is your HFQ password reset code`,
    title: "PASSWORD RESET",
    intro:
      "Use the code below to reset your HFQ dashboard password. If you did not request this, ignore this email and your password will stay the same.",
    text: `Your HFQ password reset code is ${code}. It expires in 10 minutes.`,
    devLabel: "password reset code",
  });
}
