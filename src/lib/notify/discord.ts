import "server-only";

import { env } from "@/lib/env";

export type DiscordOrderEvent =
  | "PROOF_UPLOADED"
  | "PAYMENT_APPROVED"
  | "PAYMENT_REJECTED"
  | "ORDER_COMPLETED";

type OrderAlert = {
  event: DiscordOrderEvent;
  orderNumber: string;
  player: string;
  items: string;
  total: string;
  method: string;
  adminUrl: string;
  note?: string;
};

const COLORS: Record<DiscordOrderEvent, number> = {
  PROOF_UPLOADED: 0xffc93c,
  PAYMENT_APPROVED: 0x2ee6a0,
  PAYMENT_REJECTED: 0xff3047,
  ORDER_COMPLETED: 0x5b8cff,
};

const TITLES: Record<DiscordOrderEvent, string> = {
  PROOF_UPLOADED: "New receipt — review needed",
  PAYMENT_APPROVED: "Payment approved — deliver the order",
  PAYMENT_REJECTED: "Receipt rejected",
  ORDER_COMPLETED: "Order delivered",
};

/**
 * Discord is an alert, not the source of truth. If the webhook is missing or
 * Discord is down, the order action must still succeed.
 */
function mcSkinUrl(username: string | null | undefined) {
  if (!username) return null;
  // mc-heads.net resolves the username to a head/skin image; Discord fetches
  // the image server-side when rendering the embed, so this works even if the
  // player has never joined the server.
  return `https://mc-heads.net/avatar/${encodeURIComponent(username)}/128`;
}

export async function sendDiscordOrderAlert(alert: OrderAlert) {
  const webhook = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhook) return;

  const url = `${env.appUrl.replace(/\/$/, "")}${alert.adminUrl}`;
  const skinUrl = mcSkinUrl(alert.player);

  const embed: Record<string, unknown> = {
    title: TITLES[alert.event],
    color: COLORS[alert.event],
    url,
    fields: [
      { name: "Order", value: `\`${alert.orderNumber}\``, inline: true },
      { name: "Player", value: alert.player || "unknown", inline: true },
      { name: "Item", value: alert.items || "Order", inline: false },
      { name: "Total", value: alert.total, inline: true },
      { name: "Payment", value: alert.method, inline: true },
      ...(alert.note
        ? [{ name: "Note", value: alert.note.slice(0, 1000), inline: false }]
        : []),
      { name: "Admin", value: `[Open order](${url})`, inline: false },
    ],
    footer: { text: "HFQ Network · dash.hfqmc.xyz" },
    timestamp: new Date().toISOString(),
  };

  if (skinUrl) {
    // Skin face at the top of the embed (author icon) + small thumbnail.
    embed.author = {
      name: `Minecraft: ${alert.player || "unknown"}`,
      icon_url: skinUrl,
    };
    embed.thumbnail = { url: skinUrl };
  }

  const payload = {
    username: "HFQ Dash",
    allowed_mentions: { parse: [] as string[] },
    embeds: [embed],
  };

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(
        `[discord] webhook returned ${response.status} for ${alert.orderNumber}`,
      );
    }
  } catch (error) {
    console.error("[discord] webhook failed", error);
  }
}
