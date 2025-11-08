import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Character Cards - Lucid.cards",
  description: "Browse and download character cards for SillyTavern, organized by category. High-quality character cards for your collection.",
  openGraph: {
    title: "Character Cards - Lucid.cards",
    description: "Browse and download character cards for SillyTavern, organized by category",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Character Cards - Lucid.cards",
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
