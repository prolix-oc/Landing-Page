import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDirectoryContents, getJsonData, getCachedSlug } from "@/lib/github";
import type { LumiaPack } from "@/lib/types/lumia-pack";
import PackDetailsClient from "./PackDetailsClient";

const DLC_DIRECTORY = 'Lumia DLCs';

async function getPackData(packSlug: string): Promise<(LumiaPack & { downloadUrl: string }) | null> {
  try {
    const contents = await getDirectoryContents(DLC_DIRECTORY);
    const packFiles = contents.filter(
      item => item.type === 'file' && item.name.toLowerCase().endsWith('.json')
    );

    for (const file of packFiles) {
      const packData = await getJsonData(file) as unknown as LumiaPack | null;
      if (!packData || !packData.packName) continue;

      const slug = getCachedSlug(packData.packName, file.path);
      if (slug === packSlug) {
        return {
          packName: packData.packName,
          packAuthor: packData.packAuthor || 'Unknown',
          coverUrl: packData.coverUrl || null,
          version: packData.version || 1,
          packExtras: packData.packExtras || [],
          lumiaItems: packData.lumiaItems || [],
          loomItems: packData.loomItems || [],
          slug,
          downloadUrl: file.download_url
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching pack details:', error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ pack: string }> }
): Promise<Metadata> {
  const { pack: packSlug } = await params;
  const packData = await getPackData(packSlug);

  if (!packData) {
    return {
      title: "Pack Not Found - Lucid.cards",
      description: "The requested pack could not be found.",
    };
  }

  return {
    title: `${packData.packName} - Lumia DLC - Lucid.cards`,
    description: `${packData.packName} by ${packData.packAuthor} - Download from Lucid.cards`,
    openGraph: {
      title: packData.packName,
      description: `${packData.packName} by ${packData.packAuthor}`,
      type: "website",
      locale: "en_US",
      siteName: "Lucid.cards",
      images: packData.coverUrl ? [packData.coverUrl] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: packData.packName,
      description: `${packData.packName} by ${packData.packAuthor}`,
      images: packData.coverUrl ? [packData.coverUrl] : undefined,
    },
  };
}

export default async function PackDetailsPage({
  params,
}: {
  params: Promise<{ pack: string }>;
}) {
  const { pack: packSlug } = await params;
  const packData = await getPackData(packSlug);

  if (!packData) {
    notFound();
  }

  return <PackDetailsClient pack={packData} />;
}
