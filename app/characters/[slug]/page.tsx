import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';
import CharacterPage from './CharacterPage';
import { CharacterData } from '@/lib/editor/types';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const filePath = path.join(process.cwd(), 'data', 'characters', `${slug}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const character: CharacterData = JSON.parse(content);

    return {
      title: `${character.name} - BunnyWorks`,
      description: `Character page for ${character.name}`,
    };
  } catch {
    return {
      title: 'Character Not Found - BunnyWorks',
    };
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const filePath = path.join(process.cwd(), 'data', 'characters', `${slug}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const character: CharacterData = JSON.parse(content);

    return <CharacterPage character={character} />;
  } catch {
    notFound();
  }
}
