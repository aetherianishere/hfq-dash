import * as fs from "fs";
import * as path from "path";

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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

async function main() {
  const envVars = { ...loadEnv(), ...process.env } as Record<string, string>;
  const webhook = envVars.DISCORD_WEBHOOK_URL;
  const appUrl = envVars.APP_URL ?? "http://localhost:3000";

  if (!webhook) {
    console.error("No DISCORD_WEBHOOK_URL in .env");
    process.exit(1);
  }

  const payload = {
    username: "HFQ Dash",
    allowed_mentions: { parse: [] as string[] },
    embeds: [
      {
        title: "Test Webhook — Discord Alerts Working",
        color: 0x2ee6a0,
        url: `${appUrl.replace(/\/$/, "")}/admin`,
        fields: [
          { name: "Test", value: "Discord webhook is working!", inline: true },
          { name: "Server", value: "db.aurex.lk:3306", inline: true },
        ],
        footer: { text: "HFQ Network · dash.hfqmc.xyz" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  console.log("Sending test webhook to Discord...");
  console.log("Webhook URL:", webhook.substring(0, 50) + "...");

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      const text = await response.text();
      console.error("Response body:", text);
      process.exit(1);
    }

    console.log("SUCCESS: Discord webhook test message sent!");
  } catch (error) {
    console.error("Webhook failed:", error);
    process.exit(1);
  }
}

main();
