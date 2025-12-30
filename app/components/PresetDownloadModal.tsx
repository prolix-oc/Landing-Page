'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProviderIcon } from '@/lib/provider-icons';
import Image from 'next/image';

interface TogglePre {
  hardOn?: string[];
  hardOff?: string[];
}

// Legacy format (tested_samplers.json) - inline sampler settings
interface LegacySamplerConfig {
  prettyName: string;
  slugName?: string;
  togglePre?: TogglePre;
  temperature?: number;
  top_p?: number;
  min_p?: number;
  top_k?: number;
  reasoning_effort?: string;
  enable_web_search?: boolean;
  show_thoughts?: boolean;
  stream_openai?: boolean;
  [key: string]: string | number | boolean | string[] | TogglePre | undefined;
}

// New format (optimized_options.json) - references state files
interface OptimizedOption {
  prettyName: string;
  slugName?: string;
  stateFile?: string;  // Reference to state file in statefiles/ directory
  // Legacy fields for backwards compatibility (when no stateFile)
  togglePre?: TogglePre;
  temperature?: number;
  top_p?: number;
  min_p?: number;
  top_k?: number;
  reasoning_effort?: string;
  enable_web_search?: boolean;
  show_thoughts?: boolean;
  stream_openai?: boolean;
  [key: string]: string | number | boolean | string[] | TogglePre | undefined;
}

// State file structure (v2.0 format)
interface StateFileSettings {
  enabledStates: Record<string, boolean>;
  samplers: {
    temperature?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    topP?: number;
    topK?: number;
    topA?: number;
    minP?: number;
    repetitionPenalty?: number;
    maxContext?: number;
    maxTokens?: number;
  };
  systemPrompts?: Record<string, string>;
  templateFormats?: Record<string, string>;
  behavior?: Record<string, any>;
  apiOptions?: Record<string, any>;
  media?: Record<string, any>;
  generation?: Record<string, any>;
  regexScripts?: any[];
}

interface StateFile {
  $schema?: string;
  version: string;
  name: string;
  stateType: string;
  capturedAt?: string;
  sourceVersion?: string;
  settings: StateFileSettings;
}

// Combined type that supports both formats
type SamplerConfig = LegacySamplerConfig | OptimizedOption;

// Response metadata from the API
interface TestedSamplersMeta {
  format: 'optimized_options' | 'tested_samplers';
  hasStateFiles: boolean;
}

// The actual response from the API - models + optional metadata
interface TestedSamplersResponse {
  [key: string]: SamplerConfig | TestedSamplersMeta;
}

// Helper to check if a value is metadata (not a sampler config)
const isMetadata = (key: string): boolean => key === '_meta';

// Alias for backwards compatibility in the component
type TestedSamplers = TestedSamplersResponse;

interface PresetDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetUrl: string;
  presetName: string;
}

export default function PresetDownloadModal({
  isOpen,
  onClose,
  presetUrl,
  presetName,
}: PresetDownloadModalProps) {
  const [step, setStep] = useState<'initial' | 'customize' | 'update-choice' | 'update-error'>('initial');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [testedSamplers, setTestedSamplers] = useState<TestedSamplers>({});
  const [loading, setLoading] = useState(false);
  const [loadingSamplers, setLoadingSamplers] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [updatedPreset, setUpdatedPreset] = useState<any>(null);

  useEffect(() => {
    if (isOpen && presetUrl) {
      // Reset to initial step when modal opens
      setStep('initial');
      setLoadingSamplers(true);
      setIsDataReady(false);
      setUpdatedPreset(null);
      
      // Extract the preset directory name from the URL
      // Example: if presetUrl is .../Lucid%20Loom/preset.json, extract "Lucid%20Loom"
      const urlParts = presetUrl.split('/');
      const presetDirIndex = urlParts.findIndex(part => part === 'Chat Completion' || part === 'Chat%20Completion');
      const presetDir = presetDirIndex !== -1 ? urlParts[presetDirIndex + 1] : null;
      
      if (!presetDir) {
        console.error('Could not determine preset directory from URL');
        setTestedSamplers({});
        setLoadingSamplers(false);
        setIsDataReady(true);
        return;
      }
      
      // Use our API route that leverages the GitHub caching system
      fetch(`/api/chat-presets/${presetDir}/tested-samplers`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch tested samplers: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => setTestedSamplers(data))
        .catch(err => {
          console.error('Error loading tested samplers:', err);
          setTestedSamplers({});
        })
        .finally(() => {
          setLoadingSamplers(false);
          setIsDataReady(true);
        });
    }
  }, [isOpen, presetUrl]);

  const handleDownloadNow = async () => {
    setLoading(true);
    try {
      const response = await fetch(presetUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch preset: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = presetName;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      
      onClose();
    } catch (error) {
      console.error('Error downloading preset:', error);
      window.open(presetUrl, '_blank');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomize = () => {
    setStep('customize');
  };

  const sanitizeJSON = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      // Remove any potential script tags or dangerous patterns
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeJSON(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeJSON(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  const saveCustomPromptBackup = async (prompt: any, presetName: string) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupData = {
        timestamp,
        presetName,
        prompt: sanitizeJSON(prompt)
      };
      
      // Send backup to server for persistent storage
      const response = await fetch('/api/chat-presets/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save backup to server');
      }
      
      const result = await response.json();
      console.log(`Custom prompt backup saved: ${prompt.name || prompt.identifier} (${result.filename})`);
    } catch (error) {
      console.error('Failed to backup custom prompt:', error);
    }
  };

  const mergePrompts = (userPreset: any, latestPreset: any) => {
    try {
      // Helper: Check if prompt is a category (name starts with ━ U+2501)
      const isCategory = (name: string): boolean => {
        return !!name && name.charCodeAt(0) === 0x2501;
      };

      // Helper: Check if prompt is protected (% ANYWHERE in name)
      const isProtectedPrompt = (name: string): boolean => {
        return !!name && name.includes('%');
      };

      // Helper: Clean prompt name (remove % and trim)
      const cleanPromptName = (name: string): string => {
        if (!name) return name;
        return name.replace(/%/g, '').trim();
      };

      // Helper: Get base name for matching (cleaned, lowercased for comparison)
      const getMatchableName = (name: string): string => {
        return cleanPromptName(name).toLowerCase();
      };

      // Step 1: Build NAME-based maps for user's prompts
      const userPromptsByName = new Map<string, any>(); // key: matchable name (cleaned, lowercase)
      const userEnabledStates = new Map<string, boolean>(); // key: identifier
      const userPromptOrder: string[] = []; // Track original order by identifier

      if (userPreset.prompts && Array.isArray(userPreset.prompts)) {
        userPreset.prompts.forEach((prompt: any) => {
          if (prompt.name && typeof prompt.name === 'string') {
            const matchName = getMatchableName(prompt.name);
            userPromptsByName.set(matchName, prompt);
            if (prompt.identifier) {
              userEnabledStates.set(prompt.identifier, prompt.enabled || false);
              userPromptOrder.push(prompt.identifier);
            }
            // Backup protected prompts
            if (isProtectedPrompt(prompt.name)) {
              saveCustomPromptBackup(prompt, presetName);
            }
          }
        });
      }

      // Get authoritative enabled states from prompt_order
      if (userPreset.prompt_order && Array.isArray(userPreset.prompt_order)) {
        userPreset.prompt_order.forEach((orderItem: any) => {
          if (orderItem.order && Array.isArray(orderItem.order)) {
            orderItem.order.forEach((toggle: any) => {
              if (toggle.identifier) {
                userEnabledStates.set(toggle.identifier, toggle.enabled || false);
              }
            });
          }
        });
      }

      // Step 2: Build NAME-based map for latest prompts
      const latestPromptsByName = new Map<string, any>();
      if (latestPreset.prompts && Array.isArray(latestPreset.prompts)) {
        latestPreset.prompts.forEach((prompt: any) => {
          if (prompt.name && typeof prompt.name === 'string') {
            const matchName = getMatchableName(prompt.name);
            latestPromptsByName.set(matchName, prompt);
          }
        });
      }

      // Step 3: Category validation - count new categories
      const userCategories = new Set<string>();
      const latestCategories = new Set<string>();

      userPromptsByName.forEach((prompt, matchName) => {
        if (isCategory(prompt.name)) {
          userCategories.add(matchName);
        }
      });

      latestPromptsByName.forEach((prompt, matchName) => {
        if (isCategory(prompt.name)) {
          latestCategories.add(matchName);
        }
      });

      // Find new categories (in latest but not in user)
      const newCategories: string[] = [];
      latestCategories.forEach((catName) => {
        if (!userCategories.has(catName)) {
          newCategories.push(catName);
        }
      });

      // If more than 1 new category, throw special error
      if (newCategories.length > 1) {
        throw new Error('CATEGORY_MISMATCH: The latest version has multiple new categories that require a fresh download.');
      }

      // Step 4: Start with latest preset structure
      const mergedPreset = { ...latestPreset };
      const matchedUserPromptNames = new Set<string>(); // Track which user prompts were matched

      // Step 5: Process prompts - match by NAME
      if (mergedPreset.prompts && Array.isArray(mergedPreset.prompts)) {
        mergedPreset.prompts = mergedPreset.prompts.map((latestPrompt: any) => {
          const latestMatchName = getMatchableName(latestPrompt.name || '');
          const userPrompt = userPromptsByName.get(latestMatchName);
          const userHasPrompt = !!userPrompt;

          if (userHasPrompt) {
            matchedUserPromptNames.add(latestMatchName);
            const userIsProtected = isProtectedPrompt(userPrompt.name);
            const userEnabledState = userEnabledStates.get(userPrompt.identifier) ?? userPrompt.enabled ?? false;

            if (userIsProtected) {
              // Protected: keep user's content, clean name, preserve toggle
              return {
                ...userPrompt,
                name: cleanPromptName(userPrompt.name),
                enabled: userEnabledState,
              };
            } else {
              // Not protected: use latest content, preserve user's toggle
              return {
                ...latestPrompt,
                enabled: userEnabledState,
              };
            }
          } else {
            // New prompt from latest - user doesn't have it
            // ALL new prompts insert as DISABLED (global rule)
            return {
              ...latestPrompt,
              enabled: false,
            };
          }
        });
      }

      // Step 6: Handle user-only prompts (deprecated or protected)
      // These are prompts in user's version that don't exist in latest
      const userOnlyPrompts: any[] = [];
      userPromptsByName.forEach((userPrompt, matchName) => {
        if (!matchedUserPromptNames.has(matchName)) {
          const userIsProtected = isProtectedPrompt(userPrompt.name);
          const userEnabledState = userEnabledStates.get(userPrompt.identifier) ?? userPrompt.enabled ?? false;

          if (userIsProtected) {
            // Protected: keep as-is with cleaned name, keep toggle state
            userOnlyPrompts.push({
              ...userPrompt,
              name: cleanPromptName(userPrompt.name),
              enabled: userEnabledState,
            });
          } else {
            // Not protected: mark as deprecated, force disable
            userOnlyPrompts.push({
              ...userPrompt,
              name: `${userPrompt.name} (DEPRECATED)`,
              enabled: false,
            });
          }
        }
      });

      // Insert user-only prompts at their original positions
      // For simplicity, we'll append them to the end but maintain their relative order
      if (userOnlyPrompts.length > 0 && mergedPreset.prompts) {
        // Sort user-only prompts by their original order
        userOnlyPrompts.sort((a, b) => {
          const aIndex = userPromptOrder.indexOf(a.identifier);
          const bIndex = userPromptOrder.indexOf(b.identifier);
          return aIndex - bIndex;
        });
        mergedPreset.prompts.push(...userOnlyPrompts);
      }

      // Step 7: Update prompt_order
      if (mergedPreset.prompt_order && Array.isArray(mergedPreset.prompt_order)) {
        mergedPreset.prompt_order = mergedPreset.prompt_order.map((orderItem: any) => {
          if (orderItem.order && Array.isArray(orderItem.order)) {
            // Process entries in latest's order
            const newOrder = orderItem.order.map((toggle: any) => {
              // Find the latest prompt for this toggle
              const latestPrompt = latestPreset.prompts?.find(
                (p: any) => p.identifier === toggle.identifier
              );
              const latestMatchName = latestPrompt ? getMatchableName(latestPrompt.name || '') : '';
              const userPrompt = latestMatchName ? userPromptsByName.get(latestMatchName) : null;

              if (userPrompt) {
                // User has matching prompt - preserve their toggle state
                return {
                  ...toggle,
                  enabled: userEnabledStates.get(userPrompt.identifier) ?? false,
                };
              } else {
                // New prompt - ALL new prompts disabled (global rule)
                return {
                  ...toggle,
                  enabled: false,
                };
              }
            });

            // Add user-only prompts to order (deprecated + protected-only)
            userOnlyPrompts.forEach((prompt) => {
              const existsInOrder = newOrder.some((t: any) => t.identifier === prompt.identifier);
              if (!existsInOrder) {
                newOrder.push({
                  identifier: prompt.identifier,
                  enabled: prompt.enabled,
                });
              }
            });

            return { ...orderItem, order: newOrder };
          }
          return orderItem;
        });
      }

      // Step 8: Increment version
      if (mergedPreset.spec_version) {
        const versionMatch = mergedPreset.spec_version.match(/(\d+)\.(\d+)/);
        if (versionMatch) {
          const major = parseInt(versionMatch[1]);
          const minor = parseInt(versionMatch[2]);
          mergedPreset.spec_version = `${major}.${minor + 1}`;
        }
      }

      return mergedPreset;
    } catch (error) {
      console.error('Error merging prompts:', error);
      // Preserve CATEGORY_MISMATCH errors
      if (error instanceof Error && error.message.includes('CATEGORY_MISMATCH')) {
        throw error;
      }
      throw new Error('Failed to merge presets. Please check your file format.');
    }
  };

  const handleUpdateMine = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setLoading(true);
      try {
        // Read and parse the uploaded file
        const fileContent = await file.text();
        let userPreset;
        
        try {
          userPreset = JSON.parse(fileContent);
        } catch (parseError) {
          throw new Error('Invalid JSON file. Please upload a valid preset file.');
        }

        // Sanitize the input
        userPreset = sanitizeJSON(userPreset);

        // Validate basic structure
        if (!userPreset.prompts || !Array.isArray(userPreset.prompts)) {
          throw new Error('Invalid preset format. Missing prompts array.');
        }

        // Fetch the latest version
        const latestResponse = await fetch(presetUrl);
        if (!latestResponse.ok) {
          throw new Error(`Failed to fetch latest preset: ${latestResponse.statusText}`);
        }
        const latestPreset = await latestResponse.json();

        // Merge the presets
        const merged = mergePrompts(userPreset, latestPreset);
        
        // Store the merged preset and navigate to update-choice step
        setUpdatedPreset(merged);
        setStep('update-choice');
      } catch (error) {
        console.error('Error processing update:', error);
        if (error instanceof Error && error.message.includes('CATEGORY_MISMATCH')) {
          setUpdateError(error.message);
          setStep('update-error');
        } else {
          alert(error instanceof Error ? error.message : 'Failed to process your preset. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    input.click();
  };

  // Create a display name without the file extension
  const displayName = presetName.replace(/\.json$/i, '');

  /**
   * Applies a state file's settings to a preset
   * Maps camelCase state file keys to snake_case preset keys
   * Only applies enabledStates when not updating user's preset (preserves user preferences)
   */
  const applyStateFile = (preset: any, stateFile: StateFile, skipEnabledStates: boolean): any => {
    const modified = { ...preset };

    // 1. Apply enabled states to prompt_order (only for fresh downloads)
    if (!skipEnabledStates && stateFile.settings.enabledStates && modified.prompt_order) {
      modified.prompt_order = modified.prompt_order.map((orderItem: any) => {
        if (orderItem.order && Array.isArray(orderItem.order)) {
          return {
            ...orderItem,
            order: orderItem.order.map((toggle: any) => {
              const stateValue = stateFile.settings.enabledStates[toggle.identifier];
              return {
                ...toggle,
                // Use state file value if defined, otherwise keep original
                enabled: stateValue !== undefined ? stateValue : toggle.enabled
              };
            })
          };
        }
        return orderItem;
      });

      // Also update prompts array to match
      if (modified.prompts && Array.isArray(modified.prompts)) {
        modified.prompts = modified.prompts.map((prompt: any) => {
          const stateValue = stateFile.settings.enabledStates[prompt.identifier];
          if (stateValue !== undefined) {
            return { ...prompt, enabled: stateValue };
          }
          return prompt;
        });
      }
    }

    // 2. Apply samplers (handle naming differences: camelCase -> snake_case)
    if (stateFile.settings.samplers) {
      const samplerMapping: Record<string, string> = {
        temperature: 'temperature',
        frequencyPenalty: 'frequency_penalty',
        presencePenalty: 'presence_penalty',
        topP: 'top_p',
        topK: 'top_k',
        topA: 'top_a',
        minP: 'min_p',
        repetitionPenalty: 'repetition_penalty',
        maxContext: 'max_context',
        maxTokens: 'max_tokens'
      };

      Object.entries(stateFile.settings.samplers).forEach(([key, value]) => {
        if (value === undefined) return;
        const presetKey = samplerMapping[key] || key;
        modified[presetKey] = value;
      });
    }

    // 3. Apply system prompts (direct mapping - keys match)
    if (stateFile.settings.systemPrompts) {
      Object.entries(stateFile.settings.systemPrompts).forEach(([key, value]) => {
        // Map camelCase to snake_case for system prompts
        const keyMapping: Record<string, string> = {
          impersonationPrompt: 'impersonation_prompt',
          newChatPrompt: 'new_chat_prompt',
          newGroupChatPrompt: 'new_group_chat_prompt',
          newExampleChatPrompt: 'new_example_chat_prompt',
          continueNudgePrompt: 'continue_nudge_prompt',
          groupNudgePrompt: 'group_nudge_prompt',
          assistantPrefill: 'assistant_prefill',
          assistantImpersonation: 'assistant_impersonation'
        };
        const presetKey = keyMapping[key] || key;
        modified[presetKey] = value;
      });
    }

    // 4. Apply API options
    if (stateFile.settings.apiOptions) {
      const apiMapping: Record<string, string> = {
        streamOpenai: 'stream_openai',
        claudeUseSysprompt: 'claude_use_sysprompt',
        useMakersuiteSysprompt: 'use_makersuite_sysprompt',
        squashSystemMessages: 'squash_system_messages',
        functionCalling: 'function_calling',
        showThoughts: 'show_thoughts',
        reasoningEffort: 'reasoning_effort',
        enableWebSearch: 'enable_web_search',
        requestImages: 'request_images'
      };
      Object.entries(stateFile.settings.apiOptions).forEach(([key, value]) => {
        if (value === undefined) return;
        const presetKey = apiMapping[key] || key;
        modified[presetKey] = value;
      });
    }

    // 5. Apply behavior settings
    if (stateFile.settings.behavior) {
      const behaviorMapping: Record<string, string> = {
        wrapInQuotes: 'wrap_in_quotes',
        namesBehavior: 'names_behavior',
        sendIfEmpty: 'send_if_empty',
        continuePrefill: 'continue_prefill',
        continuePostfix: 'continue_postfix'
      };
      Object.entries(stateFile.settings.behavior).forEach(([key, value]) => {
        if (value === undefined) return;
        const presetKey = behaviorMapping[key] || key;
        modified[presetKey] = value;
      });
    }

    // 6. Apply media settings
    if (stateFile.settings.media) {
      const mediaMapping: Record<string, string> = {
        imageInlining: 'image_inlining',
        inlineImageQuality: 'inline_image_quality',
        videoInlining: 'video_inlining'
      };
      Object.entries(stateFile.settings.media).forEach(([key, value]) => {
        if (value === undefined) return;
        const presetKey = mediaMapping[key] || key;
        modified[presetKey] = value;
      });
    }

    // 7. Apply generation settings
    if (stateFile.settings.generation) {
      const genMapping: Record<string, string> = {
        maxContextUnlocked: 'max_context_unlocked',
        biasPresetSelected: 'bias_preset_selected'
      };
      Object.entries(stateFile.settings.generation).forEach(([key, value]) => {
        if (value === undefined) return;
        const presetKey = genMapping[key] || key;
        modified[presetKey] = value;
      });
    }

    // 8. Apply regex scripts if present
    if (stateFile.settings.regexScripts && Array.isArray(stateFile.settings.regexScripts)) {
      modified.regex_scripts = stateFile.settings.regexScripts;
    }

    return modified;
  };

  /**
   * Extracts the preset directory name from the preset URL
   * e.g., ".../Chat%20Completion/Lucid%20Loom/preset.json" -> "Lucid%20Loom"
   */
  const getPresetDirFromUrl = (url: string): string | null => {
    const urlParts = url.split('/');
    const presetDirIndex = urlParts.findIndex(
      part => part === 'Chat Completion' || part === 'Chat%20Completion'
    );
    return presetDirIndex !== -1 ? urlParts[presetDirIndex + 1] : null;
  };

  const handleModelSelect = async (modelKey: string) => {
    setLoading(true);
    try {
      // Use the updated preset if available, otherwise fetch the latest
      let presetData;
      const isUpdatingUserPreset = !!updatedPreset;

      if (updatedPreset) {
        presetData = updatedPreset;
      } else {
        const presetResponse = await fetch(presetUrl);
        if (!presetResponse.ok) {
          throw new Error(`Failed to fetch preset: ${presetResponse.statusText}`);
        }
        presetData = await presetResponse.json();
      }

      const samplerConfig = testedSamplers[modelKey] as OptimizedOption;
      let customizedPreset = { ...presetData };

      // Check if this model uses a state file (new format)
      if (samplerConfig.stateFile) {
        // Fetch the state file
        const presetDir = getPresetDirFromUrl(presetUrl);
        if (!presetDir) {
          throw new Error('Could not determine preset directory from URL');
        }

        const stateFileUrl = `/api/chat-presets/${presetDir}/state/${encodeURIComponent(samplerConfig.stateFile)}`;
        const stateResponse = await fetch(stateFileUrl);

        if (!stateResponse.ok) {
          throw new Error(`Failed to fetch state file: ${stateResponse.statusText}`);
        }

        const stateFile: StateFile = await stateResponse.json();

        // Apply state file settings to preset
        // Skip enabledStates when updating user's preset (preserve their preferences)
        customizedPreset = applyStateFile(customizedPreset, stateFile, isUpdatingUserPreset);
      } else {
        // Legacy format: use inline sampler config

        // Apply matching keys from sampler config to preset
        Object.keys(samplerConfig).forEach(key => {
          if (key !== 'prettyName' && key !== 'togglePre' && key !== 'stateFile' && key in customizedPreset) {
            customizedPreset[key] = samplerConfig[key];
          }
        });

        // Handle prompt toggle modifications if togglePre is provided
        // IMPORTANT: Only apply toggle overrides when NOT updating user's preset
        // When updating, we must preserve the user's preferred enabled/disabled states
        if (samplerConfig.togglePre && customizedPreset.prompt_order && !isUpdatingUserPreset) {
          const promptOrder = customizedPreset.prompt_order;

          // Find the prompt order object with character_id === 100001
          const targetPromptOrder = promptOrder.find(
            (item: any) => item.character_id === 100001
          );

          if (targetPromptOrder && Array.isArray(targetPromptOrder.order)) {
            const { hardOn, hardOff } = samplerConfig.togglePre;

            targetPromptOrder.order.forEach((toggle: any) => {
              if (!toggle.identifier) return;

              // Enable prompts that MUST be turned on
              if (hardOn && hardOn.includes(toggle.identifier)) {
                toggle.enabled = true;
              }

              // Disable prompts that MUST be turned off
              if (hardOff && hardOff.includes(toggle.identifier)) {
                toggle.enabled = false;
              }
            });
          }
        }
      }

      // Create blob and download
      const blob = new Blob([JSON.stringify(customizedPreset, null, 2)], {
        type: 'application/json',
      });
      const blobUrl = URL.createObjectURL(blob);

      // Append slugName to filename if available
      let downloadFileName = presetName;
      if (samplerConfig.slugName) {
        // Insert slugName before the .json extension
        downloadFileName = presetName.replace(/\.json$/i, ` - ${samplerConfig.slugName}.json`);
      }

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      
      onClose();
    } catch (error) {
      console.error('Error customizing preset:', error);
      alert('Failed to customize preset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {!isDataReady ? (
          // Show loading spinner while data loads
          <div className="flex items-center justify-center">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8">
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-gray-300 text-sm">Loading preset options...</p>
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-gray-900/95 border border-gray-700/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <div className="border-b border-gray-700/50 px-6 py-5 flex items-center justify-between bg-gray-900/50">
            <div>
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">Download Preset</h2>
            </div>
            <button
              onClick={onClose}
              className="bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 p-2 rounded-full transition-all"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(80vh-80px)] custom-scrollbar">
            <AnimatePresence mode="wait">
              {step === 'initial' && (
                <motion.div
                  key="initial"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <p className="text-gray-300 mb-6">
                    Choose how you'd like to download <span className="font-semibold text-white">{displayName}</span>
                  </p>

                  <motion.button
                    onClick={handleDownloadNow}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 py-4 rounded-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <div className="text-left">
                        <div className="font-semibold">Download Now</div>
                        <div className="text-sm text-purple-200">Get the preset as-is</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>

                  <motion.button
                    onClick={handleCustomize}
                    disabled={loading || loadingSamplers}
                    className="w-full bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-purple-500/50 text-white px-6 py-4 rounded-xl transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                        {loadingSamplers ? (
                          <svg className="animate-spin h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-lg group-hover:text-purple-300 transition-colors">Customize</div>
                        <div className="text-sm text-gray-400 group-hover:text-gray-300">
                          {loadingSamplers ? 'Loading model options...' : 'Select a model to optimize for'}
                        </div>
                      </div>
                    </div>
                    {!loadingSamplers && (
                      <svg className="w-5 h-5 text-gray-500 transform group-hover:translate-x-1 group-hover:text-purple-400 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={handleUpdateMine}
                    disabled={loading || loadingSamplers}
                    className="w-full bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-purple-500/50 text-white px-6 py-4 rounded-xl transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-lg group-hover:text-purple-300 transition-colors">Update Mine</div>
                        <div className="text-sm text-gray-400 group-hover:text-gray-300">
                          Merge your existing preset with latest changes
                        </div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 transform group-hover:translate-x-1 group-hover:text-purple-400 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                </motion.div>
              )}

              {step === 'update-choice' && (
                <motion.div
                  key="update-choice"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setStep('initial')}
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                      disabled={loading}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-lg font-semibold text-white">Updated Preset Ready</h3>
                  </div>

                  <p className="text-gray-300 mb-6">
                    Your preset has been updated with the latest changes. Would you like to optimize it for a specific model?
                  </p>

                  <motion.button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        if (!updatedPreset) {
                          throw new Error('No updated preset available');
                        }

                        // Create blob and download
                        const blob = new Blob([JSON.stringify(updatedPreset, null, 2)], {
                          type: 'application/json',
                        });
                        const blobUrl = URL.createObjectURL(blob);

                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = presetName;
                        document.body.appendChild(a);
                        a.click();

                        document.body.removeChild(a);
                        URL.revokeObjectURL(blobUrl);
                        
                        onClose();
                      } catch (error) {
                        console.error('Error downloading preset:', error);
                        alert('Failed to download preset. Please try again.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 py-4 rounded-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <div className="text-left">
                        <div className="font-semibold">Download Updated Preset</div>
                        <div className="text-sm text-purple-200">Skip optimization and download now</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>

                  <motion.button
                    onClick={() => setStep('customize')}
                    disabled={loading}
                    className="w-full bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-purple-500/50 text-white px-6 py-4 rounded-xl transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-lg group-hover:text-purple-300 transition-colors">Optimize for Model</div>
                        <div className="text-sm text-gray-400 group-hover:text-gray-300">Choose a model to optimize settings</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 transform group-hover:translate-x-1 group-hover:text-purple-400 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                </motion.div>
              )}

              {step === 'update-error' && (
                <motion.div
                  key="update-error"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-500/20 rounded-full">
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white">Unable to Update Preset</h3>
                  </div>

                  <p className="text-gray-300 mb-6">
                    We're sorry, but your preset cannot be automatically updated. The latest version has significant structural changes (multiple new categories) that require a fresh download.
                  </p>

                  <p className="text-gray-400 text-sm mb-6">
                    Please download the latest version and manually transfer any custom prompts you'd like to keep.
                  </p>

                  <motion.button
                    onClick={() => {
                      setStep('initial');
                      setUpdateError(null);
                    }}
                    className="w-full bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-purple-500/50 text-white px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Go Back</span>
                  </motion.button>
                </motion.div>
              )}

              {step === 'customize' && (
                <motion.div
                  key="customize"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => updatedPreset ? setStep('update-choice') : setStep('initial')}
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                      disabled={loading}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-lg font-semibold text-white">Select Your Model</h3>
                  </div>

                  <p className="text-gray-300 text-sm mb-4">
                    Choose the model you'll be using. We'll optimize the sampler settings for best results.
                  </p>

                  <div className="space-y-3 min-h-[200px]">
                    {Object.entries(testedSamplers)
                      .filter(([key]) => key !== '_meta')  // Filter out metadata
                      .map(([key, value]) => {
                      const config = value as SamplerConfig;  // Type assertion after filtering
                      const iconPath = getProviderIcon(key);
                      return (
                        <motion.button
                          key={key}
                          onClick={() => handleModelSelect(key)}
                          disabled={loading}
                          className="w-full bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-purple-500 text-white px-5 py-4 rounded-xl transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-4">
                            {/* Provider Icon */}
                            {iconPath && (
                              <div className="flex-shrink-0 w-12 h-12 relative rounded-lg overflow-hidden bg-gray-800/50 border border-gray-600 group-hover:border-purple-400 transition-colors">
                                <Image
                                  src={iconPath}
                                  alt={`${config.prettyName} logo`}
                                  width={48}
                                  height={48}
                                  className="object-contain p-1"
                                />
                              </div>
                            )}
                            
                            {/* Model Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                                {config.prettyName}
                              </div>
                              <div className="text-xs text-gray-400 mt-1 truncate">
                                {key}
                              </div>
                            </div>
                            
                            {/* Arrow Icon */}
                            <svg className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-purple-400 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-purple-400">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing...</span>
              </div>
            )}
          </div>
        </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
