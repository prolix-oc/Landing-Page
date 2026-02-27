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

  const ogImages = post.frontmatter.hero_image ? [{ url: post.frontmatter.hero_image }] : undefined;
  const description = post.frontmatter.excerpt || `Read "${post.frontmatter.title}" on Lucid.cards`;

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
