
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PersistentBackground from "./components/PersistentBackground";
import { NavigationProvider } from "./contexts/NavigationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lucid.cards - Character Cards, Chat Presets & Extensions",
  description: "A curated collection of character cards, chat completion presets, world books, and extensions for SillyTavern",
  openGraph: {
    title: "Lucid.cards",
    description: "A curated collection of character cards, chat completion presets, world books, and extensions for SillyTavern",
    type: "website",
    locale: "en_US",
    siteName: "Lucid.cards",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lucid.cards",
    description: "A curated collection of character cards, chat completion presets, world books, and extensions for SillyTavern",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NavigationProvider>
          <PersistentBackground />
          {children}
        </NavigationProvider>
      </body>
    </html>
  );
}
