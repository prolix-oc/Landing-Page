import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PersistentBackground from "./components/PersistentBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BunnyWorks - Character Cards, Worldbooks & Extensions",
  description: "A curated collection of character cards, worldbooks, and extensions for SillyTavern by Coneja-Chibi",
  openGraph: {
    title: "BunnyWorks",
    description: "A curated collection of character cards, worldbooks, and extensions for SillyTavern",
    type: "website",
    locale: "en_US",
    siteName: "BunnyWorks",
  },
  twitter: {
    card: "summary_large_image",
    title: "BunnyWorks",
    description: "A curated collection of character cards, worldbooks, and extensions for SillyTavern",
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
        <PersistentBackground />
        {children}
      </body>
    </html>
  );
}
