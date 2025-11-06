import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Worldbooks - BunnyWorks",
  description: "Download worldbooks for SillyTavern to enhance your roleplay experiences with detailed world information and lore.",
  openGraph: {
    title: "Worldbooks - BunnyWorks",
    description: "Download worldbooks for SillyTavern to enhance your roleplay experiences",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Worldbooks - BunnyWorks",
    description: "Download worldbooks for SillyTavern to enhance your roleplay experiences",
  },
};

export default function WorldBooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
