import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ink - Your Agent's Identity, Visualized",
  description:
    "Generate unique, beautiful visual portraits of your OpenClaw AI agent based on its behavior, memory, and personality.",
  keywords: ["OpenClaw", "Moltbot", "AI agent", "visualization", "generative art"],
  authors: [{ name: "Ink" }],
  openGraph: {
    title: "Ink - Your Agent's Identity, Visualized",
    description: "See your AI's soul. Generate a unique portrait of your OpenClaw agent.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ink - Your Agent's Identity, Visualized",
    description: "See your AI's soul. Generate a unique portrait of your OpenClaw agent.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Fonts - using system fonts for now, can add custom fonts later */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        {/* Grain texture overlay */}
        <div className="grain-overlay" aria-hidden="true" />

        {/* Main content */}
        {children}
      </body>
    </html>
  );
}
