'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, List } from 'lucide-react';
import { parseHeadingsFromMarkdown, type TocEntry } from '@/lib/heading-utils';

interface TableOfContentsProps {
  content: string;
  variant?: 'sidebar' | 'mobile';
}

export default function TableOfContents({ content, variant = 'sidebar' }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    setHeadings(parseHeadingsFromMarkdown(content));
  }, [content]);

  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

    if (visible.length > 0) {
      setActiveId(visible[0].target.id);
    }
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    observerRef.current = new IntersectionObserver(observerCallback, {
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0,
    });

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observerRef.current.observe(el);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings, observerCallback]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveId(id);
      setMobileOpen(false);
    }
  };

  if (headings.length === 0) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));

  const tocList = (
    <nav aria-label="Table of contents">
      <ul className="space-y-1">
        {headings.map((heading) => {
          const indent = (heading.level - minLevel) * 12;
          const isActive = activeId === heading.id;

          return (
            <li key={heading.id} style={{ paddingLeft: indent }}>
              <button
                onClick={() => handleClick(heading.id)}
                className={`
                  block w-full text-left text-sm py-1.5 px-3 rounded-lg transition-all duration-200 border-l-2
                  ${isActive
                    ? 'text-sky-400 border-sky-400 bg-sky-500/10'
                    : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/[0.03]'}
                `}
              >
                {heading.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  if (variant === 'mobile') {
    return (
      <div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          <span className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Table of Contents
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${mobileOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {mobileOpen && (
          <div className="mt-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            {tocList}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="sticky top-24 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 max-h-[calc(100vh-8rem)] overflow-y-auto sidebar-scroll">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <List className="w-3.5 h-3.5" />
        On this page
      </h4>
      {tocList}
    </div>
  );
}
