import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Extensions - Prolix ST Presets",
  description: "Custom SillyTavern extensions created by Prolix. Enhance your SillyTavern experience with powerful custom functionality.",
  openGraph: {
    title: "Extensions - Prolix ST Presets",
    description: "Custom SillyTavern extensions created by Prolix",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Extensions - Prolix ST Presets",
    description: "Custom SillyTavern extensions created by Prolix",
  },
};

export default function ExtensionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
