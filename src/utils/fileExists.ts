/**
 * fileExists.ts
 * 
 * Helper centralizado para verificar existencia de archivos
 * Usa FileSystem.getInfoAsync() de la API legacy para evitar warnings de deprecación
 */

import * as FileSystem from 'expo-file-system/legacy';

/**
 * Verifica si un archivo existe
 * @param uri - URI del archivo a verificar (debe tener prefijo file://)
 * @returns true si el archivo existe y es un archivo regular, false en caso contrario
 */
export async function fileExists(uri: string): Promise<boolean> {
  if (!uri || typeof uri !== 'string') {
    console.warn('[fileExists] URI inválida:', uri);
    return false;
  }

  try {
    // Usar getInfoAsync - es la API estable en expo-file-system
    const info = await FileSystem.getInfoAsync(uri);
    
    const exists = info.exists && !info.isDirectory;
    
    if (__DEV__) {
      console.log('[fileExists]', {
        uri: uri.substring(uri.lastIndexOf('/') + 1),
        exists,
        isDirectory: info.isDirectory
      });
    }
    
    return exists;
  } catch (error) {
    // Si falla (archivo no existe, permisos, etc), devolver false
    console.warn('[fileExists] Error verificando archivo:', {
      uri: uri.substring(uri.lastIndexOf('/') + 1),
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Obtiene información completa del archivo
 * @param uri - URI del archivo
 * @returns Información del archivo o null si no existe
 */
export async function getFileInfo(uri: string): Promise<{
  exists: boolean;
  size: number;
  modificationTime: number;
  uri: string;
} | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    
    if (!info.exists) {
      return null;
    }
    
    return {
      exists: info.exists,
      size: info.size || 0,
      modificationTime: info.modificationTime || 0,
      uri: info.uri
    };
  } catch (error) {
    console.warn('[getFileInfo] Error:', error);
    return null;
  }
}
