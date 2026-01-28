/**
 * Chat Preset Types for Download API
 */

export interface PresetVersion {
  name: string;
  path: string;
  slug: string;
  downloadUrl: string | null;
  size: number;
  lastModified: string | null;
  isProlix: boolean;
}

export interface PresetSummary {
  name: string;
  slug: string;
  versions: {
    standard: PresetVersion[];
    prolix: PresetVersion[];
  };
  latestVersion: PresetVersion | null;
  totalVersions: number;
}

export interface ChatPresetListResponse {
  success: boolean;
  presets: PresetSummary[];
  stats: {
    totalPresets: number;
    totalVersions: number;
    presetsWithProlix: number;
  };
}

export interface ChatPresetDownloadResponse {
  success: boolean;
  preset: PresetSummary;
  data: Record<string, unknown>;
}

export interface ChatPresetErrorResponse {
  success: false;
  error: string;
}
