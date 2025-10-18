// src/utils/fsExists.ts
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Verifica si un archivo existe usando la API legacy (SDK 54)
 * Sin warnings de deprecación hasta migración completa a nueva API
 */
export async function fileExists(uri: string): Promise<boolean> {
  if (!uri || typeof uri !== 'string') {
    console.warn('[fileExists] URI inválida:', uri);
    return false;
  }

  try {
    const info = await FileSystem.getInfoAsync(uri);
    const exists = info.exists && !(info as any).isDirectory;
    
    console.log('[fileExists]', { 
      uri: uri.substring(uri.lastIndexOf('/') + 1), 
      exists,
      isDirectory: (info as any).isDirectory 
    });
    
    return exists;
  } catch (error) {
    console.warn('[fileExists] Error verificando archivo:', { 
      uri: uri.substring(uri.lastIndexOf('/') + 1), 
      error: (error as Error).message 
    });
    return false;
  }
}
