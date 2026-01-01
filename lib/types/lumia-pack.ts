export interface PackExtra {
  type: string;
  name: string;
  description: string;
}

export interface LumiaItem {
  lumiaName: string;
  lumiaDefinition: string;
  lumiaPersonality: string;
  lumiaBehavior: string;
  avatarUrl: string | null;
  genderIdentity: 0 | 1 | 2; // 0=she/her, 1=he/him, 2=they/them
  authorName: string;
  version: number;
}

export interface LoomItem {
  loomName: string;
  loomContent: string;
  loomCategory: string;
  authorName: string | null;
  version: number;
}

export interface LumiaPack {
  packName: string;
  packAuthor: string;
  coverUrl: string | null;
  version: number;
  packExtras: PackExtra[];
  lumiaItems: LumiaItem[];
  loomItems: LoomItem[];
  slug?: string;
  downloadUrl?: string;
}

export interface LumiaPackSummary {
  packName: string;
  packAuthor: string;
  coverUrl: string | null;
  lumiaCount: number;
  loomCount: number;
  extrasCount: number;
  slug: string;
  packType: 'lumia' | 'loom' | 'mixed';
}

export interface FilterOption {
  name: string;
  count: number;
}

export type PackType = 'lumia' | 'loom' | 'mixed';

export const GENDER_PRONOUNS: Record<0 | 1 | 2, string> = {
  0: 'she/her',
  1: 'he/him',
  2: 'they/them'
};
