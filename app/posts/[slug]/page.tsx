import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug, getAllPosts } from '@/lib/blog';
import PostContent from './PostContent';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found - Lucid.cards',
      description: 'The requested post could not be found.',
    };
  }

  // OG image: serve a smaller 1200x630 version for embed previews
  const ogImages = post.frontmatter.hero_image
    ? [{ url: `${post.frontmatter.hero_image}?w=1200&h=630&fit=cover&q=75`, width: 1200, height: 630 }]
    : undefined;

  // Description: use excerpt, or strip markdown from content and truncate
  const description = post.frontmatter.excerpt || (() => {
    const plain = post.content
      .replace(/^---[\s\S]*?---\n*/m, '')  // frontmatter fence
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → text
      .replace(/#{1,6}\s+/g, '')           // headings
      .replace(/[*_~`>|]/g, '')            // inline formatting
      .replace(/\n{2,}/g, ' ')             // collapse paragraphs
      .replace(/\n/g, ' ')                 // remaining newlines
      .trim();
    return plain.length > 200 ? plain.slice(0, 197) + '...' : plain;
  })();

  return {
    title: `${post.frontmatter.title} - Lucid.cards`,
    description,
    openGraph: {
      title: post.frontmatter.title,
      description,
      type: 'article',
      locale: 'en_US',
      siteName: 'Lucid.cards',
      url: `/posts/${slug}`,
      publishedTime: post.frontmatter.date,
      modifiedTime: post.frontmatter.updated,
      tags: post.frontmatter.tags,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.frontmatter.title,
      description,
      images: ogImages,
    },
  };
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map(post => ({ slug: post.slug }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <PostContent post={post} />;
}
