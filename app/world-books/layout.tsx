import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "World Books - Lucid.cards",
  description: "Download world books for SillyTavern to enhance your roleplay experiences with detailed world information and lore.",
  openGraph: {
    title: "World Books - Lucid.cards",
    description: "Download world books for SillyTavern to enhance your roleplay experiences",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "World Books - Lucid.cards",
    description: "Download world books for SillyTavern to enhance your roleplay experiences",
  },
};

export default function WorldBooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
