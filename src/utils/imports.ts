// src/utils/imports.ts
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';
import { folderPath } from '../features/documents/folders';
import { addRecent } from '../features/documents/registry';
import { ensureUniqueFilename, copyInto } from './fs-safe';

export type ImportAsset = {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
};

export type ImportResult = {
  success: boolean;
  uri?: string;
  name?: string;
  kind?: 'pdf' | 'csv';
  error?: string;
};

/**
 * Detecta el tipo de documento por MIME type o extensión
 */
export function detectKindFromMimeOrExt(mime?: string, uri?: string): 'pdf' | 'csv' | null {
  // Por MIME type
  if (mime) {
    const lower = mime.toLowerCase();
    if (lower.includes('pdf')) return 'pdf';
    if (lower.includes('csv') || lower.includes('comma-separated')) return 'csv';
  }
  
  // Por extensión
  if (uri) {
    const lower = uri.toLowerCase();
    if (lower.endsWith('.pdf')) return 'pdf';
    if (lower.endsWith('.csv')) return 'csv';
  }
  
  return null;
}

/**
 * Normaliza nombre de archivo: quita caracteres inválidos
 */
export function normalizeFileName(name: string): string {
  return name
    .trim()
    .replace(/[^\w\s\-\.]/g, '') // Solo letras, números, espacios, guiones, puntos
    .replace(/\s+/g, '_') // Espacios → guiones bajos
    .replace(/_{2,}/g, '_'); // Múltiples guiones bajos → uno solo
}

/**
 * Importa un archivo en una carpeta específica
 * @param asset - Archivo seleccionado del DocumentPicker
 * @param folderType - Tipo de carpeta: 'pdf' | 'csv' | 'custom/<nombre>'
 * @returns Resultado de la importación con URI final y metadata
 */
export async function importIntoFolder(
  asset: ImportAsset,
  folderType: string
): Promise<ImportResult> {
  try {
    console.log('[imports] Iniciando importación:', { name: asset.name, folderType });
    
    // 1. Detectar tipo de archivo
    const kind = detectKindFromMimeOrExt(asset.mimeType, asset.uri || asset.name);
    if (!kind) {
      return {
        success: false,
        error: 'Tipo de archivo no soportado. Solo PDF o CSV.'
      };
    }
    
    console.log('[imports] Tipo detectado:', kind);
    
    // 2. Normalizar nombre
    const normalizedName = normalizeFileName(asset.name);
    console.log('[imports] Nombre normalizado:', normalizedName);
    
    // 3. Determinar directorio de destino
    let targetDir: string;
    let folderName: string | undefined;
    
    if (folderType.startsWith('custom/')) {
      // Carpeta personalizada
      folderName = folderType.replace('custom/', '');
      targetDir = folderPath(folderName, 'custom');
    } else if (folderType === 'pdf' || folderType === 'csv' || folderType === 'zip') {
      // Carpeta tipo predefinida
      targetDir = folderPath(folderType, folderType as 'pdf' | 'csv' | 'zip');
    } else {
      return {
        success: false,
        error: 'Tipo de carpeta inválido'
      };
    }
    
    console.log('[imports] Directorio destino:', targetDir);
    
    // 4. Asegurar que el directorio existe
    const dirInfo = await FileSystem.getInfoAsync(targetDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
      console.log('[imports] Directorio creado:', targetDir);
    }
    
    // 5. Generar nombre único si hay colisión
    const uniqueName = await ensureUniqueFilename(targetDir, normalizedName);
    console.log('[imports] Nombre único:', uniqueName);
    
    // 6. Copiar archivo al destino
    const { uri: finalUri } = await copyInto(targetDir, asset.uri, uniqueName);
    console.log('[imports] Archivo copiado a:', finalUri);
    
    // 7. Registrar en recientes
    try {
      await addRecent({
        id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        kind,
        name: uniqueName,
        uri: finalUri,
        folder: folderName as any // Sin prefijo 'custom/'
      });
      console.log('[imports] Registrado en recientes:', uniqueName);
    } catch (err) {
      console.warn('[imports] No se pudo registrar en recientes:', err);
    }
    
    return {
      success: true,
      uri: finalUri,
      name: uniqueName,
      kind
    };
    
  } catch (error: any) {
    console.error('[imports] Error al importar:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al importar archivo'
    };
  }
}

/**
 * Importa múltiples archivos en una carpeta
 * @param assets - Array de archivos seleccionados
 * @param folderType - Tipo de carpeta destino
 * @returns Array de resultados individuales
 */
export async function importMultipleIntoFolder(
  assets: ImportAsset[],
  folderType: string
): Promise<ImportResult[]> {
  console.log('[imports] Importando', assets.length, 'archivos a', folderType);
  
  const results: ImportResult[] = [];
  
  for (const asset of assets) {
    const result = await importIntoFolder(asset, folderType);
    results.push(result);
  }
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log('[imports] Completado:', { success: successCount, failed: failCount });
  
  return results;
}
