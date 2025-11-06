import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Character Cards - BunnyWorks",
  description: "Browse and download character cards for SillyTavern, organized by category. High-quality character cards created by Coneja-Chibi.",
  openGraph: {
    title: "Character Cards - BunnyWorks",
    description: "Browse and download character cards for SillyTavern, organized by category",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Character Cards - BunnyWorks",
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
