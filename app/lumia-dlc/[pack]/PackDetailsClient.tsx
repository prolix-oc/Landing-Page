'use client';

import { useState, useRef, useEffect } from 'react';
import AnimatedLink from '@/app/components/AnimatedLink';
import { motion, useInView } from 'framer-motion';
import { downloadFile } from '@/lib/download';
import LazyImage from '@/app/components/LazyImage';
import LumiaDownloadModal from './LumiaDownloadModal';
import {
  ArrowLeft,
  Download,
  Users,
  ScrollText,
  Sparkles,
  ChevronDown,
  User,
  Package
} from 'lucide-react';
import type { LumiaPack, LumiaItem, LoomItem } from '@/lib/types/lumia-pack';
import { GENDER_PRONOUNS } from '@/lib/types/lumia-pack';

interface PackDetailsClientProps {
  pack: LumiaPack & { downloadUrl: string };
}

// Collapsible section component
function CollapsibleSection({
  title,
  icon: Icon,
  iconColor,
  count,
  defaultOpen = false,
  children,
  delay = 0
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  delay?: number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px" });
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.scrollHeight);
        }
      });
      resizeObserver.observe(contentRef.current);
      setContentHeight(contentRef.current.scrollHeight);
      return () => resizeObserver.disconnect();
    }
  }, [children]);

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left group"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ backgroundColor: `${iconColor}20` }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
          <h3 className="text-lg font-semibold text-white">
            {title}
            {count !== undefined && (
              <span className="ml-2 text-sm font-normal text-gray-500">({count})</span>
            )}
          </h3>
        </div>
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.05] transition-transform duration-300"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ height: isOpen ? `${contentHeight}px` : '0px', opacity: isOpen ? 1 : 0 }}
      >
        <div ref={contentRef} className="px-4 sm:px-5 pb-4 sm:pb-5">
          <div
            className="h-px w-full mb-4 opacity-50"
            style={{ background: `linear-gradient(to right, ${iconColor}, transparent)` }}
          />
          {children}
        </div>
      </div>
    </motion.div>
  );
}

// Lumia Item Card
function LumiaItemCard({ item }: { item: LumiaItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-rose-500/30 transition-colors">
      <div className="flex gap-4">
        {/* Avatar */}
        {item.avatarUrl ? (
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
            <LazyImage
              src={item.avatarUrl}
              alt={item.lumiaName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <User className="w-8 h-8 text-rose-400/50" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-white truncate">{item.lumiaName}</h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
              {GENDER_PRONOUNS[item.genderIdentity]}
            </span>
          </div>
          <p className="text-sm text-gray-500">by {item.authorName}</p>
        </div>
      </div>

      {/* Expandable content */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 text-xs text-rose-400 hover:text-rose-300 transition-colors"
      >
        {expanded ? 'Show less' : 'Show details'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 text-sm">
          {item.lumiaDefinition && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Definition</p>
              <p className="text-gray-300">{item.lumiaDefinition}</p>
            </div>
          )}
          {item.lumiaPersonality && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Personality</p>
              <p className="text-gray-300">{item.lumiaPersonality}</p>
            </div>
          )}
          {item.lumiaBehavior && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Behavior</p>
              <p className="text-gray-300">{item.lumiaBehavior}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Loom Item Card
function LoomItemCard({ item }: { item: LoomItem }) {
  const [expanded, setExpanded] = useState(false);
  const previewLength = 150;
  const needsExpansion = item.loomContent.length > previewLength;

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-violet-500/30 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-semibold text-white">{item.loomName}</h4>
        {item.authorName && (
          <span className="text-xs text-gray-500 flex-shrink-0">by {item.authorName}</span>
        )}
      </div>

      <p className="text-sm text-gray-400 leading-relaxed">
        {expanded || !needsExpansion
          ? item.loomContent
          : `${item.loomContent.slice(0, previewLength)}...`}
      </p>

      {needsExpansion && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

// Group loom items by category
function groupLoomItemsByCategory(items: LoomItem[]): Record<string, LoomItem[]> {
  return items.reduce((groups, item) => {
    const category = item.loomCategory || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, LoomItem[]>);
}

export default function PackDetailsClient({ pack }: PackDetailsClientProps) {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const loomGroups = groupLoomItemsByCategory(pack.loomItems);
  const hasLumiaItems = pack.lumiaItems.length > 0;
  const hasLoomItems = pack.loomItems.length > 0;
  const hasExtras = pack.packExtras.length > 0;

  const handleDownload = () => {
    downloadFile(pack.downloadUrl, `${pack.packName}.json`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Back Link */}
      <div className="fixed top-6 left-6 z-50">
        <AnimatedLink
          href="/lumia-dlc"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 border border-white/10 text-gray-400 hover:text-rose-400 hover:bg-gray-800/90 hover:border-rose-500/30 transition-all"
          isBackLink
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Packs</span>
        </AnimatedLink>
      </div>

      <div className="relative container mx-auto px-4 pt-20 sm:pt-24 pb-12 max-w-5xl">
        {/* Glass Container */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/[0.05]" />

          <div className="relative p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-8">
              {/* Cover Image */}
              <div className="flex-shrink-0 w-full lg:w-72">
                {pack.coverUrl ? (
                  <div className="aspect-square rounded-2xl overflow-hidden">
                    <LazyImage
                      src={pack.coverUrl}
                      alt={pack.packName}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: 'center 15%' }}
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-rose-500/20 via-pink-500/15 to-fuchsia-500/10 flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <Package className="w-12 h-12 text-rose-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-400">No Cover</span>
                  </div>
                )}
              </div>

              {/* Pack Info */}
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  {pack.packName}
                </h1>
                <p className="text-gray-400 mb-4">
                  by <span className="text-rose-400">{pack.packAuthor}</span>
                  <span className="mx-2 text-gray-600">•</span>
                  Version {pack.version}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {hasLumiaItems && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                      <Users className="w-4 h-4 text-rose-400" />
                      <span className="text-sm text-rose-300">
                        {pack.lumiaItems.length} Lumia{pack.lumiaItems.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {hasLoomItems && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                      <ScrollText className="w-4 h-4 text-violet-400" />
                      <span className="text-sm text-violet-300">
                        {pack.loomItems.length} Loom{pack.loomItems.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {hasExtras && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-amber-300">
                        {pack.packExtras.length} Extra{pack.packExtras.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Download Button */}
                <button
                  onClick={() => setShowDownloadModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium transition-all shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40"
                >
                  <Download className="w-5 h-5" />
                  Download Pack
                </button>
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-4">
              {/* Pack Extras */}
              {hasExtras && (
                <CollapsibleSection
                  title="Pack Extras"
                  icon={Sparkles}
                  iconColor="#f59e0b"
                  count={pack.packExtras.length}
                  defaultOpen
                  delay={0}
                >
                  <div className="space-y-3">
                    {pack.packExtras.map((extra, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]"
                      >
                        <div className="flex-shrink-0 px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-medium uppercase">
                          {extra.type}
                        </div>
                        <div>
                          <p className="font-medium text-white">{extra.name}</p>
                          <p className="text-sm text-gray-400 mt-1">{extra.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Lumia Items */}
              {hasLumiaItems && (
                <CollapsibleSection
                  title="Lumia Characters"
                  icon={Users}
                  iconColor="#f43f5e"
                  count={pack.lumiaItems.length}
                  defaultOpen
                  delay={0.1}
                >
                  <div className="grid gap-4 md:grid-cols-2 items-start">
                    {pack.lumiaItems.map((item, index) => (
                      <LumiaItemCard key={index} item={item} />
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Loom Items by Category */}
              {hasLoomItems && (
                <CollapsibleSection
                  title="Loom Presets"
                  icon={ScrollText}
                  iconColor="#8b5cf6"
                  count={pack.loomItems.length}
                  defaultOpen
                  delay={0.2}
                >
                  <div className="space-y-6">
                    {Object.entries(loomGroups).map(([category, items]) => (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                          {category}
                        </h4>
                        <div className="grid gap-3 md:grid-cols-2 items-start">
                          {items.map((item, index) => (
                            <LoomItemCard key={index} item={item} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Download Info Modal */}
      <LumiaDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownloadAnyway={handleDownload}
        packName={pack.packName}
      />
    </div>
  );
}
