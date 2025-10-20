// src/utils/fsExists.ts
import * as FS from 'expo-file-system';
import type { File as FileType } from 'expo-file-system';

/**
 * Verifica si un archivo existe usando la API nueva de expo-file-system (SDK 54+)
 * Con fallback automático a legacy API para máxima compatibilidad
 * 
 * API nueva (preferida): File class
 * Fallback silencioso: import desde expo-file-system/legacy
 */
export async function fileExists(uri: string): Promise<boolean> {
  if (!uri || typeof uri !== 'string') {
    return false;
  }

  try {
    // 🆕 API nueva (Expo SDK 54) - File class
    // Intentar usar File directamente si está disponible
    if ((FS as any).File) {
      try {
        const File = (FS as any).File as typeof FileType;
        const file = new File(uri);
        const exists = file.exists; // ✅ Propiedad, no método
        
        if (__DEV__) {
          const fileName = uri.substring(uri.lastIndexOf('/') + 1);
          console.log('[fileExists] API nueva:', { fileName, exists });
        }
        
        return exists;
      } catch (newApiError) {
        // Si falla API nueva, continuar al fallback sin loguear
        // (puede ser error normal de ruta inválida o API no disponible)
      }
    }

    // 🔄 Fallback a legacy API (import explícito)
    const { getInfoAsync } = await import('expo-file-system/legacy');
    const info = await getInfoAsync(uri);
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
