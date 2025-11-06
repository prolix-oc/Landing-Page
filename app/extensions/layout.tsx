import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Extensions - BunnyWorks",
  description: "Custom SillyTavern extensions created by Coneja-Chibi. Enhance your SillyTavern experience with powerful custom functionality.",
  openGraph: {
    title: "Extensions - BunnyWorks",
    description: "Custom SillyTavern extensions created by Coneja-Chibi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Extensions - BunnyWorks",
    description: "Custom SillyTavern extensions created by Coneja-Chibi",
  },
};

export default function ExtensionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
