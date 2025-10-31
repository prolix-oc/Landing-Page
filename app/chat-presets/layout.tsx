import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat Completion Presets - Prolix ST Presets",
  description: "Download the latest chat completion presets for SillyTavern. Get optimized presets for various AI models and use cases.",
  openGraph: {
    title: "Chat Completion Presets - Prolix ST Presets",
    description: "Download the latest chat completion presets for SillyTavern",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chat Completion Presets - Prolix ST Presets",
    description: "Download the latest chat completion presets for SillyTavern",
  },
};

export default function ChatPresetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
