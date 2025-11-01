// src/hooks/useFolderMetadataUI.ts
// FASE 6.4-CORE: Hook para gestionar UI de metadatos de carpetas

import { useState, useEffect, useCallback } from 'react';
import { getFolderMetadata, getAllFolderMetadata } from '../features/folders/metadata.service';
import type { FolderMetadata } from '../features/folders/types';

interface UseFolderMetadataUIResult {
  metadata: Record<string, FolderMetadata>;
  loading: boolean;
  refresh: () => Promise<void>;
  getMetadataForFolder: (folderName: string) => FolderMetadata;
}

/**
 * Hook para gestionar metadatos de carpetas en UI
 * Carga todos los metadatos al montar y provee helpers para acceso individual
 */
export function useFolderMetadataUI(): UseFolderMetadataUIResult {
  const [metadata, setMetadata] = useState<Record<string, FolderMetadata>>({});
  const [loading, setLoading] = useState(true);

  const loadMetadata = useCallback(async () => {
    try {
      const allMetadata = await getAllFolderMetadata();
      setMetadata(allMetadata);
    } catch (error) {
      console.error('[useFolderMetadataUI] Error loading metadata:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await loadMetadata();
  }, [loadMetadata]);

  const getMetadataForFolder = useCallback(
    (folderName: string): FolderMetadata => {
      // Retorna desde caché o defaults síncronos
      return metadata[folderName] || {
        updated_at: Date.now(),
      };
    },
    [metadata]
  );

  return {
    metadata,
    loading,
    refresh,
    getMetadataForFolder,
  };
}
