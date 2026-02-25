import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Posts - Lucid.cards",
  description: "Thoughts, ideas, and documentation about Lucid Loom and everything around it.",
  openGraph: {
    title: "Posts - Lucid.cards",
    description: "Thoughts, ideas, and documentation about Lucid Loom and everything around it",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Posts - Lucid.cards",
    description: "Thoughts, ideas, and documentation about Lucid Loom and everything around it",
  },
};

export default function PostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
