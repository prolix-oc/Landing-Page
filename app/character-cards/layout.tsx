import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Character Cards - Prolix ST Presets",
  description: "Browse and download character cards for SillyTavern, organized by category. High-quality character cards created by Prolix.",
  openGraph: {
    title: "Character Cards - Prolix ST Presets",
    description: "Browse and download character cards for SillyTavern, organized by category",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Character Cards - Prolix ST Presets",
    description: "Browse and download character cards for SillyTavern, organized by category",
  },
};

export default function CharacterCardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
