import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDirectoryContents, getLatestCommit, getCharacterThumbnail, getJsonData } from "@/lib/github";
import { slugify } from "@/lib/slugify";
import CharacterDetailsClient from "./CharacterDetailsClient";

interface AlternateScenario {
  id: string;
  name: string;
  path: string;
  thumbnailUrl: string | null;
  pngUrl: string | null;
  jsonUrl: string;
  cardData: any;
  lastModified: string | null;
}

interface Character {
  name: string;
  category: string;
  path: string;
  thumbnailUrl: string | null;
  pngUrl: string | null;
  jsonUrl: string;
  cardData: any;
  lastModified: string | null;
  alternates?: AlternateScenario[];
}

async function getCharacterData(category: string, character: string): Promise<Character | null> {
  try {
    const decodedCategory = decodeURIComponent(category);
    const targetSlug = decodeURIComponent(character);
    
    // Get all directories in the category to find alternates
    const categoryPath = `Character Cards/${decodedCategory}`;
    const categoryContents = await getDirectoryContents(categoryPath);
    const characterDirs = categoryContents.filter(item => item.type === 'dir');
    
    // Map directories with their cached slugs and base names
    const dirsWithSlugs = characterDirs.map(dir => {
      const baseName = dir.name.replace(/\s+V\d+$/i, '');
      return {
        dir,
        slug: dir.slug || slugify(baseName),
        baseName: baseName
      };
    });
    
    // Find directories that match the target slug
    const matchingItems = dirsWithSlugs.filter(item => item.slug === targetSlug);
    
    if (matchingItems.length === 0) {
      return null;
    }
    
    const baseCharacterName = matchingItems[0].baseName;
    const matchingDirs = matchingItems.map(item => item.dir);
    
    // Sort directories: base name first, then V2, V3, etc.
    matchingDirs.sort((a, b) => {
      if (a.name === baseCharacterName) return -1;
      if (b.name === baseCharacterName) return 1;
      const aMatch = a.name.match(/V(\d+)$/i);
      const bMatch = b.name.match(/V(\d+)$/i);
      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
      }
      return 0;
    });
    
    // Process all matching directories to find alternates
    const alternates: AlternateScenario[] = [];
    
    for (const dir of matchingDirs) {
      const path = dir.path;
    
      // Get contents of the character directory
      const dirContents = await getDirectoryContents(path);
      
      // Find all .png and .json files
      const pngFiles = dirContents.filter(file => 
        file.type === 'file' && file.name.toLowerCase().endsWith('.png')
      );
      const jsonFiles = dirContents.filter(file => 
        file.type === 'file' && file.name.toLowerCase().endsWith('.json')
      );
      
      // Check if there are multiple JSON files (alternate scenarios in same directory)
      if (jsonFiles.length > 1) {
        // Multiple scenarios in the same directory
        for (const jsonFile of jsonFiles) {
          // Skip known non-character files
          if (jsonFile.name.toLowerCase() === 'tested_samplers.json') continue;

          const cardData = await getJsonData(jsonFile);
          if (!cardData || !cardData.data || !cardData.data.name) continue;
          
          // Find matching PNG file based on JSON filename
          const jsonBaseName = jsonFile.name.replace(/\.json$/i, '');
          const pngFile = pngFiles.find(png => 
            png.name.replace(/\.png$/i, '') === jsonBaseName
          );
          
          const thumbnailUrl = pngFile ? await getCharacterThumbnail(path, pngFile) : null;
          const commit = await getLatestCommit(path);
          
          // Extract scenario name from filename or card data
          const scenarioName = cardData.data?.name || jsonBaseName;
          
          alternates.push({
            id: `${dir.name}-${jsonFile.name}`,
            name: scenarioName,
            path: path,
            thumbnailUrl,
            pngUrl: pngFile?.download_url || null,
            jsonUrl: jsonFile.download_url,
            cardData,
            lastModified: commit?.commit.author.date || null
          });
        }
      } else if (jsonFiles.length === 1) {
        // Single scenario in this directory
        const jsonFile = jsonFiles[0];
        
        // Skip known non-character files
        if (jsonFile.name.toLowerCase() === 'tested_samplers.json') continue;

        const pngFile = pngFiles[0];
        
        const cardData = await getJsonData(jsonFile);
        if (!cardData || !cardData.data || !cardData.data.name) continue;
        
        const thumbnailUrl = pngFile ? await getCharacterThumbnail(path, pngFile) : null;
        const commit = await getLatestCommit(path);
        
        // Use directory name suffix or card name
        const versionMatch = dir.name.match(/V(\d+)$/i);
        const scenarioName = cardData.data?.name || (versionMatch ? `Version ${versionMatch[1]}` : 'Original');
        
        alternates.push({
          id: dir.name,
          name: scenarioName,
          path: path,
          thumbnailUrl,
          pngUrl: pngFile?.download_url || null,
          jsonUrl: jsonFile.download_url,
          cardData,
          lastModified: commit?.commit.author.date || null
        });
      }
    }
    
    if (alternates.length === 0) {
      return null;
    }
    
    // Use the first alternate as the primary character
    const primary = alternates[0];
    
    return {
      name: baseCharacterName,
      category: decodedCategory,
      path: primary.path,
      thumbnailUrl: primary.thumbnailUrl,
      pngUrl: primary.pngUrl,
      jsonUrl: primary.jsonUrl,
      cardData: primary.cardData,
      lastModified: primary.lastModified,
      alternates: alternates.length > 1 ? alternates : undefined
    };
  } catch (error) {
    console.error('Error fetching character details:', error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string; character: string }> }
): Promise<Metadata> {
  const { category, character } = await params;
  const characterData = await getCharacterData(category, character);
  
  if (!characterData) {
    return {
      title: "Character Not Found - Lucid.cards",
      description: "The requested character card could not be found.",
    };
  }
  
  const characterName = characterData.cardData.data.name || characterData.name;
  const thumbnailUrl = characterData.thumbnailUrl;
  
  return {
    title: `${characterName} - Lucid.cards`,
    description: `Grab ${characterName} and other cards from Lucid.cards!`,
    openGraph: {
      title: characterName,
      description: `Grab ${characterName} and other cards from Lucid.cards!`,
      type: "website",
      locale: "en_US",
      siteName: "Lucid.cards",
      images: thumbnailUrl ? [thumbnailUrl] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: characterName,
      description: `Grab ${characterName} and other cards from Lucid.cards!`,
      images: thumbnailUrl ? [thumbnailUrl] : undefined,
    },
  };
}

export default async function CharacterDetailsPage({
  params,
}: {
  params: Promise<{ category: string; character: string }>;
}) {
  const { category, character } = await params;
  const characterData = await getCharacterData(category, character);
  
  if (!characterData) {
    notFound();
  }
  
  return <CharacterDetailsClient character={characterData} />;
}
