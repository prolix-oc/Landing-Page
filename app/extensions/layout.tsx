import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Extensions - Lucid.cards",
  description: "Custom SillyTavern extensions. Enhance your SillyTavern experience with powerful custom functionality.",
  openGraph: {
    title: "Extensions - Lucid.cards",
    description: "Custom SillyTavern extensions",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Extensions - Lucid.cards",
    description: "Custom SillyTavern extensions",
  },
};

export default function ExtensionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
