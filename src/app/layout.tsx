import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BootSplash } from "@/components/motion/BootSplash";
import { PixelWipe } from "@/components/motion/PixelWipe";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://dash.hfqmc.xyz"),
  title: {
    default: "HFQ Dash — Player Dashboard",
    template: "%s · HFQ Dash",
  },
  description:
    "Manage your HFQ Network account, orders, ranks, keys, and shards from one dashboard.",
  icons: { icon: "/images/logo.png" },
  openGraph: {
    title: "HFQ Dash — Player Dashboard",
    description: "Your HFQ Network account, orders, and store purchases.",
    images: ["/images/og-image.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: "#16080c",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Pixelify+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <BootSplash />
        <PixelWipe />
        {children}
      </body>
    </html>
  );
}
