import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnimatedBackground from "./components/AnimatedBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prolix ST Presets - Character Cards, Chat Presets & Extensions",
  description: "A curated collection of character cards, chat completion presets, world books, and extensions for SillyTavern by Prolix",
  openGraph: {
    title: "Prolix ST Presets",
    description: "A curated collection of character cards, chat completion presets, world books, and extensions for SillyTavern",
    type: "website",
    locale: "en_US",
    siteName: "Prolix ST Presets",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prolix ST Presets",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased page-transition`}
      >
        <AnimatedBackground />
        {children}
      </body>
    </html>
  );
}
