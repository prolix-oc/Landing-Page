'use client';

import { useState } from 'react';
import AnimatedLink from '@/app/components/AnimatedLink';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { ArrowLeft, Calendar, Tag, Layers } from 'lucide-react';
import type { BlogPost } from '@/lib/types/blog-post';
import { extractTextFromNode, generateHeadingId } from '@/lib/heading-utils';
import ImageLightbox from '@/app/components/ImageLightbox';
import TableOfContents from '@/app/components/TableOfContents';

export default function PostContent({ post }: { post: BlogPost }) {
  const { frontmatter, content } = post;
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  return (
    <div className="min-h-screen relative">
      {/* Back Link */}
      <div className="fixed top-6 left-6 z-50">
        <AnimatedLink
          href="/posts"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 border border-white/10 text-gray-400 hover:text-sky-400 hover:bg-gray-800/90 hover:border-sky-500/30 transition-all"
          isBackLink
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Posts</span>
        </AnimatedLink>
      </div>

      <div className="relative mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-12 sm:pb-16">
        {/* Three-column flex on xl+: spacer | content | TOC — keeps content centered */}
        <div className="xl:flex xl:justify-center xl:gap-8">
          {/* Left spacer — balances the TOC so the center column stays centered */}
          <div className="hidden xl:block w-56 shrink-0" aria-hidden="true" />

          {/* Center column: header, hero, mobile TOC, post body */}
          <div className="w-full max-w-4xl mx-auto xl:mx-0 min-w-0">
            {/* Post Header */}
            <header className="text-center mb-10 sm:mb-12">
              {/* Category badge */}
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">
                  <Layers className="w-3 h-3" />
                  {frontmatter.category}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
                {frontmatter.title}
              </h1>

              {/* Date row */}
              <div className="flex items-center justify-center gap-4 text-sm text-gray-400 mb-5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  {new Date(frontmatter.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                {frontmatter.updated && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-gray-600" />
                    <span className="text-gray-500">
                      Updated {new Date(frontmatter.updated).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </>
                )}
              </div>

              {/* Tags */}
              {frontmatter.tags.length > 0 && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-gray-500" />
                  {frontmatter.tags.map(tag => (
                    <span key={tag} className="text-xs text-gray-400 bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Hero Image */}
            {frontmatter.hero_image && (
              <div className="mb-10">
                <button
                  type="button"
                  onClick={() => setLightboxSrc(frontmatter.hero_image!)}
                  className="group block w-full cursor-zoom-in rounded-2xl overflow-hidden border border-white/[0.08] hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frontmatter.hero_image}
                    alt={frontmatter.title}
                    className="w-full object-cover max-h-[480px]"
                  />
                </button>
              </div>
            )}

            {/* Mobile TOC */}
            <div className="xl:hidden mb-6">
              <TableOfContents content={content} variant="mobile" />
            </div>

            {/* Post Body */}
            <div className="relative">
              <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/[0.05]" />

              <div className="relative p-6 sm:p-8 lg:p-10">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    h1: ({ children, ...props }) => {
                      const text = extractTextFromNode(children);
                      const id = generateHeadingId(text);
                      return <h1 id={id} className="text-3xl sm:text-4xl font-bold text-white mt-10 mb-4 first:mt-0 scroll-mt-20" {...props}>{children}</h1>;
                    },
                    h2: ({ children, ...props }) => {
                      const text = extractTextFromNode(children);
                      const id = generateHeadingId(text);
                      return <h2 id={id} className="text-2xl sm:text-3xl font-bold text-white mt-8 mb-3 first:mt-0 scroll-mt-20" {...props}>{children}</h2>;
                    },
                    h3: ({ children, ...props }) => {
                      const text = extractTextFromNode(children);
                      const id = generateHeadingId(text);
                      return <h3 id={id} className="text-xl sm:text-2xl font-semibold text-white mt-6 mb-3 first:mt-0 scroll-mt-20" {...props}>{children}</h3>;
                    },
                    h4: ({ children, ...props }) => {
                      const text = extractTextFromNode(children);
                      const id = generateHeadingId(text);
                      return <h4 id={id} className="text-lg font-semibold text-white mt-5 mb-2 scroll-mt-20" {...props}>{children}</h4>;
                    },
                    p: ({ ...props }) => (
                      <p className="text-gray-300 leading-relaxed mb-4 last:mb-0" {...props} />
                    ),
                    a: ({ ...props }) => (
                      <a className="text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
                    ),
                    strong: ({ ...props }) => (
                      <strong className="text-white font-semibold" {...props} />
                    ),
                    em: ({ ...props }) => (
                      <em className="text-sky-300/80" {...props} />
                    ),
                    ul: ({ ...props }) => (
                      <ul className="text-gray-300 space-y-1.5 mb-4 ml-4 list-disc marker:text-sky-500/50" {...props} />
                    ),
                    ol: ({ ...props }) => (
                      <ol className="text-gray-300 space-y-1.5 mb-4 ml-4 list-decimal marker:text-sky-500/50" {...props} />
                    ),
                    li: ({ ...props }) => (
                      <li className="leading-relaxed pl-1" {...props} />
                    ),
                    blockquote: ({ ...props }) => (
                      <blockquote className="border-l-2 border-sky-500/50 pl-4 py-1 my-4 text-gray-400 italic" {...props} />
                    ),
                    code: ({ className, children, ...props }) => {
                      const isInline = !className;
                      if (isInline) {
                        return (
                          <code className="text-sky-300 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className={`${className} text-sm`} {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ ...props }) => (
                      <pre className="bg-black/40 border border-white/[0.06] rounded-xl p-4 overflow-x-auto mb-4 text-sm leading-relaxed" {...props} />
                    ),
                    hr: () => (
                      <hr className="border-white/[0.08] my-8" />
                    ),
                    img: ({ alt, src, ...props }) => {
                      const imgSrc = typeof src === 'string' ? src : undefined;
                      return (
                        <button
                          type="button"
                          onClick={() => imgSrc && setLightboxSrc(imgSrc)}
                          className="block cursor-zoom-in rounded-xl overflow-hidden border border-white/[0.08] hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300 my-4"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt={alt} src={imgSrc} className="max-w-full" {...props} />
                        </button>
                      );
                    },
                    table: ({ ...props }) => (
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full border-collapse" {...props} />
                      </div>
                    ),
                    thead: ({ ...props }) => (
                      <thead className="border-b border-white/[0.1]" {...props} />
                    ),
                    th: ({ ...props }) => (
                      <th className="text-left text-sm font-semibold text-white px-3 py-2" {...props} />
                    ),
                    td: ({ ...props }) => (
                      <td className="text-sm text-gray-300 px-3 py-2 border-b border-white/[0.05]" {...props} />
                    ),
                    del: ({ ...props }) => (
                      <del className="text-gray-500" {...props} />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Desktop TOC sidebar — sticky, only visible on xl+ */}
          <div className="hidden xl:block w-56 shrink-0">
            <div className="sticky top-24">
              <TableOfContents content={content} variant="sidebar" />
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}
