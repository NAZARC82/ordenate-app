// src/utils/fsExists.ts
import * as FS from 'expo-file-system/legacy';

/**
 * Verifica si un archivo existe usando la API legacy de expo-file-system
 * Compatible con SDK 54+ pero usa legacy para evitar warnings
 * 
 * API legacy (usada): getInfoAsync()
 */
export async function fileExists(uri: string): Promise<boolean> {
  if (!uri || typeof uri !== 'string') {
    return false;
  }

  try {
    // 🔄 Legacy API (import explícito desde /legacy)
    const info = await FS.getInfoAsync(uri);
    const exists = !!(info?.exists && !(info as any).isDirectory);
    
    if (__DEV__) {
      const fileName = uri.substring(uri.lastIndexOf('/') + 1);
      console.log('[fileExists] Legacy API:', { fileName, exists });
    }
    
    return exists;
  } catch (error) {
    // Solo loguear si es error inesperado (no archivo no encontrado)
    if (__DEV__ && error && (error as any).code !== 'ERR_NOT_FOUND') {
      console.warn('[fileExists] Error:', (error as Error).message);
    }
    return false;
  }
}
