// src/utils/fs-safe.ts
// Operaciones de FileSystem seguras con validación y fallbacks

import * as FileSystem from 'expo-file-system/legacy';

// Directorio persistente para exports (NO temporal)
// Archivos aquí se mantienen hasta limpieza manual o programada
const EXPORTS_DIR = `${FileSystem.documentDirectory}exports/`;

// Directorio legacy (para compatibilidad)
const REPORTS_DIR = `${FileSystem.documentDirectory}reports/`;

/**
 * Asegurar que un directorio existe (crea si no existe)
 */
export async function ensureDir(dirPath: string = EXPORTS_DIR): Promise<string> {
  try {
    const info = await FileSystem.getInfoAsync(dirPath);
    if (!info.exists) {
      console.log(`[fs-safe] Creando directorio: ${dirPath}`);
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
    return dirPath;
  } catch (error) {
    console.error('[fs-safe] Error al crear directorio:', error);
    throw new Error(`No se pudo crear el directorio: ${dirPath}`);
  }
}

/**
 * Obtener directorio de exports (persistente)
 */
export function getExportsDir(): string {
  return EXPORTS_DIR;
}

/**
 * Obtener path de subcarpeta en exports
 * @param folder - Nombre de la carpeta (ej: 'pdf', 'csv', 'custom/mis-reportes')
 */
export function getSubfolderPath(folder: string): string {
  return `${EXPORTS_DIR}${folder}/`;
}

/**
 * Mover archivo PDF de forma segura con fallback a copy+delete
 * Verifica existencia del archivo final
 * Usa EXPORTS_DIR (persistente, no temporal)
 * 
 * @param tempUri - URI del archivo temporal
 * @param fileName - Nombre del archivo final
 * @param subfolder - Subcarpeta opcional (ej: 'pdf', 'custom/mis-reportes')
 */
export async function movePDFSafe(
  tempUri: string,
  fileName: string,
  subfolder?: string
): Promise<{ uri: string; exists: boolean }> {
  try {
    // Asegurar que el nombre termina en .pdf
    const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    
    // Determinar directorio de destino
    let targetDir: string;
    if (subfolder) {
      targetDir = await ensureDir(getSubfolderPath(subfolder));
    } else {
      targetDir = await ensureDir(EXPORTS_DIR);
    }
    
    const finalUri = `${targetDir}${finalFileName}`;
    
    console.log('[fs-safe] Moviendo PDF a exports persistente:', {
      from: tempUri,
      to: finalUri,
      subfolder: subfolder || 'root'
    });

    // Verificar que el archivo temporal existe
    const tempInfo = await FileSystem.getInfoAsync(tempUri);
    if (!tempInfo.exists) {
      throw new Error('El archivo temporal no existe');
    }

    // Eliminar archivo existente si hay (overwrite)
    try {
      await FileSystem.deleteAsync(finalUri, { idempotent: true });
    } catch (e) {
      // Ignorar si no existe
    }

    // Intentar mover
    try {
      await FileSystem.moveAsync({
        from: tempUri,
        to: finalUri
      });
      console.log('[fs-safe] ✓ Archivo movido exitosamente');
    } catch (moveError) {
      // Fallback: copiar + eliminar
      console.warn('[fs-safe] Move falló, usando fallback copy+delete:', moveError);
      await FileSystem.copyAsync({
        from: tempUri,
        to: finalUri
      });
      await FileSystem.deleteAsync(tempUri, { idempotent: true });
      console.log('[fs-safe] ✓ Archivo copiado y temporal eliminado');
    }

    // Verificar que el archivo final existe
    const finalInfo = await FileSystem.getInfoAsync(finalUri);
    if (!finalInfo.exists) {
      throw new Error('El archivo final no se creó correctamente');
    }

    console.log('[fs-safe] ✓ Archivo verificado en exports persistente:', {
      uri: finalUri,
      size: (finalInfo as any).size || 'unknown'
    });

    // Asegurar que el URI tiene prefijo file://
    const normalizedUri = finalUri.startsWith('file://') 
      ? finalUri 
      : `file://${finalUri}`;

    return { 
      uri: normalizedUri, 
      exists: true 
    };
  } catch (error) {
    console.error('[fs-safe] Error en movePDFSafe:', error);
    throw error;
  }
}

/**
 * Guardar CSV de forma segura con BOM UTF-8 y verificación
 * Usa EXPORTS_DIR (persistente, no temporal)
 * 
 * @param fileName - Nombre del archivo
 * @param csvContent - Contenido CSV
 * @param subfolder - Subcarpeta opcional (ej: 'csv', 'custom/reportes')
 */
export async function saveCSVSafe(
  fileName: string,
  csvContent: string,
  subfolder?: string
): Promise<{ uri: string; exists: boolean }> {
  try {
    // Asegurar que el nombre termina en .csv
    const finalFileName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
    
    // Determinar directorio de destino
    let targetDir: string;
    if (subfolder) {
      targetDir = await ensureDir(getSubfolderPath(subfolder));
    } else {
      targetDir = await ensureDir(EXPORTS_DIR);
    }
    
    const finalUri = `${targetDir}${finalFileName}`;
    
    console.log('[fs-safe] Guardando CSV en exports persistente:', {
      to: finalUri,
      size: csvContent.length,
      subfolder: subfolder || 'root'
    });

    // BOM UTF-8 para compatibilidad con Excel
    const contentWithBOM = '\uFEFF' + csvContent;
    
    // Escribir archivo (usar encoding: 'utf8' como string)
    await FileSystem.writeAsStringAsync(finalUri, contentWithBOM, {
      encoding: 'utf8'
    });

    // Verificar que el archivo existe
    const info = await FileSystem.getInfoAsync(finalUri);
    if (!info.exists) {
      throw new Error('El archivo CSV no se creó correctamente');
    }

    console.log('[fs-safe] ✓ CSV guardado y verificado en exports persistente:', {
      uri: finalUri,
      size: (info as any).size || 'unknown'
    });

    // Asegurar que el URI tiene prefijo file://
    const normalizedUri = finalUri.startsWith('file://') 
      ? finalUri 
      : `file://${finalUri}`;

    return { 
      uri: normalizedUri, 
      exists: true 
    };
  } catch (error) {
    console.error('[fs-safe] Error en saveCSVSafe:', error);
    throw error;
  }
}

/**
 * Verificar que un archivo existe
 */
export async function fileExistsSafe(uri: string): Promise<boolean> {
  try {
    if (!uri || typeof uri !== 'string') {
      console.warn('[fs-safe] URI inválida:', uri);
      return false;
    }
    
    const info = await FileSystem.getInfoAsync(uri);
    const exists = info.exists && !(info as any).isDirectory;
    
    console.log('[fs-safe] Verificación de archivo:', {
      uri: uri.substring(uri.lastIndexOf('/') + 1),
      exists
    });
    
    return exists;
  } catch (error) {
    console.warn('[fs-safe] Error verificando archivo:', error);
    return false;
  }
}
