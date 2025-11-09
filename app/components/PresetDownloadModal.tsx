'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProviderIcon } from '@/lib/provider-icons';
import Image from 'next/image';

interface TogglePre {
  hardOn?: string[];
  hardOff?: string[];
}

interface SamplerConfig {
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

interface TestedSamplers {
  [key: string]: SamplerConfig;
}

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
  const [step, setStep] = useState<'initial' | 'customize' | 'update-choice'>('initial');
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
      // Step 1: Build maps of user's toggle states and prompts
      const userPromptsMap = new Map();
      const userPromptNames = new Map();
      const userEnabledStates = new Map(); // Track enabled state per identifier
      const customPrompts = new Map(); // Track custom prompts (those starting with %)
      
      if (userPreset.prompts && Array.isArray(userPreset.prompts)) {
        userPreset.prompts.forEach((prompt: any) => {
          if (prompt.identifier) {
            userPromptsMap.set(prompt.identifier, prompt);
            userPromptNames.set(prompt.identifier, prompt.name);
            // Store the enabled state from prompts array (though prompt_order is the real source)
            userEnabledStates.set(prompt.identifier, prompt.enabled || false);
            
            // Check if this is a custom prompt (name starts with %)
            if (prompt.name && typeof prompt.name === 'string' && prompt.name.startsWith('%')) {
              customPrompts.set(prompt.identifier, prompt);
              // Silently save backup of custom prompt
              saveCustomPromptBackup(prompt, presetName);
            }
          }
        });
      }

      // Collect enabled states from prompt_order (this is the authoritative source)
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

      // Step 2: Start with latest preset structure
      const mergedPreset = { ...latestPreset };
      
      // Step 3: Set ALL enabled states to false in latest preset (preset B) first
      if (mergedPreset.prompts && Array.isArray(mergedPreset.prompts)) {
        mergedPreset.prompts = mergedPreset.prompts.map((prompt: any) => ({
          ...prompt,
          enabled: false
        }));
      }
      
      if (mergedPreset.prompt_order && Array.isArray(mergedPreset.prompt_order)) {
        mergedPreset.prompt_order = mergedPreset.prompt_order.map((orderItem: any) => {
          if (orderItem.order && Array.isArray(orderItem.order)) {
            return {
              ...orderItem,
              order: orderItem.order.map((toggle: any) => ({
                ...toggle,
                enabled: false
              }))
            };
          }
          return orderItem;
        });
      }
      
      // Step 4: Now restore user's enabled states while keeping updated content
      if (mergedPreset.prompts && Array.isArray(mergedPreset.prompts)) {
        mergedPreset.prompts = mergedPreset.prompts.map((latestPrompt: any) => {
          const userPrompt = userPromptsMap.get(latestPrompt.identifier);
          
          // If this is a custom prompt, preserve it completely from user's version
          if (customPrompts.has(latestPrompt.identifier)) {
            return customPrompts.get(latestPrompt.identifier);
          }
          
          if (userPrompt) {
            // SAFETY CHECK: Only merge if both identifier AND name match
            const userPromptName = userPromptNames.get(latestPrompt.identifier);
            if (userPromptName === latestPrompt.name) {
              // Names match - use latest content but preserve user's enabled state
              return {
                ...latestPrompt,
                enabled: userEnabledStates.get(latestPrompt.identifier) || false,
              };
            } else {
              // Names don't match - keep user's version unchanged (safety)
              console.log(`Skipping update for identifier ${latestPrompt.identifier}: name mismatch ('${userPromptName}' vs '${latestPrompt.name}')`);
              return userPrompt;
            }
          }
          
          // New prompt that didn't exist in user's version - keep disabled
          return {
            ...latestPrompt,
            enabled: false,
          };
        });
        
        // Add custom prompts that don't exist in latest version
        customPrompts.forEach((customPrompt, identifier) => {
          const existsInLatest = mergedPreset.prompts.some(
            (p: any) => p.identifier === identifier
          );
          if (!existsInLatest) {
            mergedPreset.prompts.push(customPrompt);
          }
        });
        
        // Add user prompts that aren't in the latest
        userPromptsMap.forEach((userPrompt, identifier) => {
          const existsInLatest = mergedPreset.prompts.some(
            (p: any) => p.identifier === identifier
          );
          if (!existsInLatest && !customPrompts.has(identifier)) {
            const nameExistsInLatest = mergedPreset.prompts.some(
              (p: any) => p.name === userPrompt.name
            );
            if (!nameExistsInLatest) {
              mergedPreset.prompts.push(userPrompt);
            }
          }
        });
      }

      // Step 5: Restore enabled states in prompt_order
      if (mergedPreset.prompt_order && Array.isArray(mergedPreset.prompt_order)) {
        mergedPreset.prompt_order = mergedPreset.prompt_order.map((orderItem: any) => {
          if (orderItem.order && Array.isArray(orderItem.order)) {
            orderItem.order = orderItem.order.map((toggle: any) => {
              // Restore user's enabled state, keeping updated content
              return {
                ...toggle,
                enabled: userEnabledStates.get(toggle.identifier) || false,
              };
            });
            
            // Add custom prompt toggles that might not exist in latest
            customPrompts.forEach((customPrompt, identifier) => {
              const existsInOrder = orderItem.order.some(
                (t: any) => t.identifier === identifier
              );
              if (!existsInOrder) {
                orderItem.order.push({
                  identifier,
                  enabled: userEnabledStates.get(identifier) || false
                });
              }
            });
          }
          return orderItem;
        });
      }

      // Step 6: Increment version number
      if (mergedPreset.spec_version) {
        const currentVersion = mergedPreset.spec_version;
        // Parse version string (e.g., "2.8" -> 2.8)
        const versionMatch = currentVersion.match(/(\d+)\.(\d+)/);
        if (versionMatch) {
          const major = parseInt(versionMatch[1]);
          const minor = parseInt(versionMatch[2]);
          // Increment minor version
          mergedPreset.spec_version = `${major}.${minor + 1}`;
        }
      }

      return mergedPreset;
    } catch (error) {
      console.error('Error merging prompts:', error);
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
        alert(error instanceof Error ? error.message : 'Failed to process your preset. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    input.click();
  };

  // Create a display name without the file extension
  const displayName = presetName.replace(/\.json$/i, '');

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

      const samplerConfig = testedSamplers[modelKey];

      // Merge sampler settings into preset
      const customizedPreset = { ...presetData };
      
      // Apply matching keys from sampler config to preset
      Object.keys(samplerConfig).forEach(key => {
        if (key !== 'prettyName' && key !== 'togglePre' && key in customizedPreset) {
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
            className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Download Preset</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
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
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-4 rounded-xl transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      {loadingSamplers ? (
                        <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      )}
                      <div className="text-left">
                        <div className="font-semibold">Customize</div>
                        <div className="text-sm text-gray-300">
                          {loadingSamplers ? 'Loading model options...' : 'Optimize for your model'}
                        </div>
                      </div>
                    </div>
                    {!loadingSamplers && (
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={handleUpdateMine}
                    disabled={loading || loadingSamplers}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-4 rounded-xl transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="text-left">
                        <div className="font-semibold">Update mine</div>
                        <div className="text-sm text-gray-300">
                          Merge your customized preset with latest updates
                        </div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-4 rounded-xl transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <div className="text-left">
                        <div className="font-semibold">Optimize for Model</div>
                        <div className="text-sm text-gray-300">Choose a model to optimize settings</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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
                    {Object.entries(testedSamplers).map(([key, config]) => {
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
