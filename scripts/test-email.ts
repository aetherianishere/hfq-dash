import { Resend } from "resend";
import * as fs from "fs";
import * as path from "path";

/**
 * Read .env manually so this standalone script works without dotenv.
 */
function loadEnv(): Record<string, string> {
  const envPath = path.resolve(".env");
  const vars: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return vars;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

async function main() {
  const env = { ...loadEnv(), ...process.env } as Record<string, string>;
  const apiKey = env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("ERROR: RESEND_API_KEY not found in .env or environment.");
    process.exit(1);
  }

  const resend = new Resend(apiKey);

  console.log("Sending test email to ruhain@axro.cc via Resend...");

  const { data, error } = await resend.emails.send({
    from: "HFQ Network <noreply@hfqmc.xyz>",
    to: ["ruhain@axro.cc"],
    subject: "HFQ Dash — SMTP Test",
    html: `
      <div style="font-family: system-ui, sans-serif; background:#16080c; color:#fbeee6; padding:32px;">
        <h1 style="color:#ffc93c;">HFQ Network</h1>
        <h2>SMTP Test</h2>
        <p>If you received this email, <strong>Resend is working correctly</strong>.</p>
        <p>This is a test from the HFQ Dash dashboard.</p>
        <hr style="border-color:#35141d;" />
        <p style="font-size:12px; color:#b3969e;">HFQ Network · dash.hfqmc.xyz</p>
      </div>
    `,
    text: "HFQ Dash — SMTP Test\n\nIf you received this email, Resend is working correctly.\n\nThis is a test from the HFQ Dash dashboard.\n\nHFQ Network · dash.hfqmc.xyz",
  });

  if (error) {
    console.error("Resend API error:", JSON.stringify(error, null, 2));
    process.exit(1);
  }

  console.log("SUCCESS: Email sent!");
  console.log("Message ID:", data?.id);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
