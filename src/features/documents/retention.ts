/**
 * Retención automática de archivos exportados
 * 
 * Limpia archivos >30 días de /exports/ y los elimina de Recientes.
 * 
 * @module features/documents/retention
 */

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteRecent, getRecents } from './registry';

const RETENTION_CHECK_KEY = '@ordenate:last_retention_check';
const RETENTION_DAYS = 30;
const CHECK_INTERVAL_DAYS = 7; // Revisar una vez por semana

export interface ExportFile {
  uri: string;
  name: string;
  mtime: number; // Timestamp en ms
  size: number;
}

/**
 * Listar todos los archivos en /exports/
 * 
 * @returns Array de archivos con metadata
 */
export async function listExportFiles(): Promise<ExportFile[]> {
  try {
    const exportDir = FileSystem.documentDirectory + 'exports/';
    
    // Verificar que el directorio existe
    const dirInfo = await FileSystem.getInfoAsync(exportDir);
    if (!dirInfo.exists) {
      return [];
    }

    // Leer contenido del directorio
    const files = await FileSystem.readDirectoryAsync(exportDir);
    
    const result: ExportFile[] = [];

    for (const fileName of files) {
      const fileUri = exportDir + fileName;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (fileInfo.exists && !fileInfo.isDirectory) {
        result.push({
          uri: fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`,
          name: fileName,
          mtime: (fileInfo as any).modificationTime || 0,
          size: (fileInfo as any).size || 0,
        });
      }
    }

    return result;
  } catch (error) {
    console.warn('[retention] Error listing export files:', error);
    return [];
  }
}

/**
 * Eliminar archivos más antiguos que N días
 * 
 * Borra archivos del disco y los elimina de Recientes.
 * 
 * @param days - Días de retención (default: 30)
 * @returns Número de archivos eliminados
 */
export async function purgeOlderThan(days: number = RETENTION_DAYS): Promise<{ removed: number }> {
  try {
    const files = await listExportFiles();
    const now = Date.now();
    const cutoffTime = now - days * 24 * 60 * 60 * 1000;

    let removed = 0;

    for (const file of files) {
      if (file.mtime && file.mtime < cutoffTime) {
        try {
          // 1. Borrar archivo físico
          await FileSystem.deleteAsync(file.uri, { idempotent: true });

          // 2. Eliminar de Recientes si existe
          await deleteRecent(file.uri);

          removed++;
        } catch (error) {
          console.warn(`[retention] Error deleting ${file.name}:`, error);
        }
      }
    }

    return { removed };
  } catch (error) {
    console.warn('[retention] Error in purgeOlderThan:', error);
    return { removed: 0 };
  }
}

/**
 * Verificar si se debe ejecutar retención automática
 * 
 * Revisa una vez por semana (CHECK_INTERVAL_DAYS).
 * 
 * @returns true si se debe ejecutar retención
 */
export async function shouldRunRetention(): Promise<boolean> {
  try {
    const lastCheckStr = await AsyncStorage.getItem(RETENTION_CHECK_KEY);
    
    if (!lastCheckStr) {
      return true; // Primera vez
    }

    const lastCheck = parseInt(lastCheckStr, 10);
    const now = Date.now();
    const daysSinceLastCheck = (now - lastCheck) / (24 * 60 * 60 * 1000);

    return daysSinceLastCheck >= CHECK_INTERVAL_DAYS;
  } catch (error) {
    console.warn('[retention] Error checking last retention:', error);
    return false;
  }
}

/**
 * Marcar que se ejecutó la retención
 */
export async function markRetentionRun(): Promise<void> {
  try {
    await AsyncStorage.setItem(RETENTION_CHECK_KEY, Date.now().toString());
  } catch (error) {
    console.warn('[retention] Error marking retention run:', error);
  }
}

/**
 * Ejecutar retención automática si corresponde
 * 
 * Llamar al abrir la app en App.js o similar.
 * 
 * @example
 * useEffect(() => {
 *   runAutoRetention();
 * }, []);
 */
export async function runAutoRetention(): Promise<void> {
  try {
    const should = await shouldRunRetention();
    
    if (!should) {
      return;
    }

    console.log('[retention] Running auto-retention...');
    const { removed } = await purgeOlderThan(RETENTION_DAYS);
    
    if (removed > 0) {
      console.log(`[retention] Removed ${removed} old files`);
    }

    await markRetentionRun();
  } catch (error) {
    console.warn('[retention] Error in runAutoRetention:', error);
  }
}

/**
 * Limpiar archivos de Recientes que ya no existen físicamente
 * 
 * Útil para sincronizar después de borrar archivos manualmente.
 */
export async function cleanOrphanRecents(): Promise<{ cleaned: number }> {
  try {
    const recents = await getRecents();
    let cleaned = 0;

    for (const recent of recents) {
      const fileInfo = await FileSystem.getInfoAsync(recent.uri);
      
      if (!fileInfo.exists) {
        await deleteRecent(recent.id);
        cleaned++;
      }
    }

    return { cleaned };
  } catch (error) {
    console.warn('[retention] Error cleaning orphan recents:', error);
    return { cleaned: 0 };
  }
}
