// src/features/documents/folders.ts
/**
 * API de gestión de carpetas en /exports/
 * 
 * Estructura:
 * - /exports/pdf/       (archivos PDF por defecto)
 * - /exports/csv/       (archivos CSV por defecto)
 * - /exports/zip/       (archivos ZIP por defecto)
 * - /exports/custom/<nombre>/  (carpetas personalizadas)
 * 
 * @module features/documents/folders
 */

import * as FileSystem from 'expo-file-system/legacy';
import { getExportsDir } from '../../utils/fs-safe';
import type { FolderType } from './registry';

export interface FolderInfo {
  name: string;
  path: string;
  type: 'pdf' | 'csv' | 'zip' | 'legacy' | 'custom';
  filesCount: number;
}

/**
 * Normalizar nombre de carpeta: solo [a-z0-9_\- ]
 * Reemplaza caracteres no válidos por _, trim espacios
 */
export function normalizeFolderName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new Error('Nombre de carpeta inválido');
  }

  // Trim y convertir a minúsculas
  let normalized = name.trim().toLowerCase();
  
  // Reemplazar caracteres no válidos por _
  normalized = normalized.replace(/[^a-z0-9_\- ]/g, '_');
  
  // Eliminar múltiples underscores/espacios consecutivos
  normalized = normalized.replace(/[_\s]+/g, '_');
  
  // Trim final de underscores
  normalized = normalized.replace(/^_+|_+$/g, '');
  
  if (normalized.length === 0) {
    throw new Error('Nombre de carpeta vacío después de normalizar');
  }
  
  return normalized;
}

/**
 * Obtener path completo de una carpeta
 */
export function folderPath(name: string, type?: 'pdf' | 'csv' | 'zip' | 'legacy' | 'custom'): string {
  const exportsDir = getExportsDir();
  
  if (!type || type === 'custom') {
    const normalized = normalizeFolderName(name);
    return `${exportsDir}custom/${normalized}/`;
  }
  
  // Carpetas de tipo (pdf, csv, zip, legacy)
  return `${exportsDir}${type}/`;
}

/**
 * Contar archivos en una carpeta
 */
async function countFilesInFolder(path: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists || !(info as any).isDirectory) {
      return 0;
    }

    const files = await FileSystem.readDirectoryAsync(path);
    
    // Contar solo archivos (no subdirectorios)
    let count = 0;
    for (const file of files) {
      const filePath = path + file;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists && !(fileInfo as any).isDirectory) {
        count++;
      }
    }
    
    return count;
  } catch (error) {
    console.warn('[Folders] Error contando archivos:', error);
    return 0;
  }
}

/**
 * Listar todas las carpetas en /exports/
 * Retorna tipos predefinidos + carpetas custom
 */
export async function listFolders(): Promise<FolderInfo[]> {
  const exportsDir = getExportsDir();
  const folders: FolderInfo[] = [];

  // Carpetas de tipo predefinidas
  const typeFolders: Array<{ type: 'pdf' | 'csv' | 'zip'; name: string }> = [
    { type: 'pdf', name: 'PDF' },
    { type: 'csv', name: 'CSV' },
    { type: 'zip', name: 'ZIP' },
  ];

  for (const { type, name } of typeFolders) {
    const path = folderPath(name.toLowerCase(), type);
    
    try {
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        const filesCount = await countFilesInFolder(path);
        folders.push({
          name,
          path,
          type,
          filesCount,
        });
      }
    } catch (error) {
      console.warn(`[Folders] Error leyendo ${type}:`, error);
    }
  }

  // Carpetas custom
  const customDir = `${exportsDir}custom/`;
  
  try {
    const customDirInfo = await FileSystem.getInfoAsync(customDir);
    
    if (customDirInfo.exists && (customDirInfo as any).isDirectory) {
      const customFolders = await FileSystem.readDirectoryAsync(customDir);
      
      for (const folderName of customFolders) {
        const path = customDir + folderName + '/';
        const info = await FileSystem.getInfoAsync(path);
        
        if (info.exists && (info as any).isDirectory) {
          const filesCount = await countFilesInFolder(path);
          folders.push({
            name: folderName,
            path,
            type: 'custom',
            filesCount,
          });
        }
      }
    }
  } catch (error) {
    console.warn('[Folders] Error leyendo custom:', error);
  }

  console.log('[Folders] Listadas:', folders.length);
  return folders;
}

/**
 * Crear carpeta personalizada
 * Normaliza el nombre y crea en /exports/custom/<nombre>/
 */
export async function createFolder(name: string): Promise<FolderInfo> {
  const normalized = normalizeFolderName(name);
  const path = folderPath(normalized, 'custom');

  console.log('[Folders] Creando carpeta:', { original: name, normalized, path });

  // Verificar si ya existe
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    throw new Error(`La carpeta "${normalized}" ya existe`);
  }

  // Crear directorio
  await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  
  console.log('[Folders] ✓ Carpeta creada:', normalized);

  return {
    name: normalized,
    path,
    type: 'custom',
    filesCount: 0,
  };
}

/**
 * Renombrar carpeta personalizada
 * Solo permitido en carpetas custom (no pdf/csv/zip)
 */
export async function renameFolder(oldName: string, newName: string): Promise<FolderInfo> {
  const oldNormalized = normalizeFolderName(oldName);
  const newNormalized = normalizeFolderName(newName);

  if (oldNormalized === newNormalized) {
    throw new Error('El nuevo nombre es igual al anterior');
  }

  const oldPath = folderPath(oldNormalized, 'custom');
  const newPath = folderPath(newNormalized, 'custom');

  console.log('[Folders] Renombrando:', { from: oldNormalized, to: newNormalized });

  // Verificar que la carpeta origen existe
  const oldInfo = await FileSystem.getInfoAsync(oldPath);
  if (!oldInfo.exists) {
    throw new Error(`La carpeta "${oldNormalized}" no existe`);
  }

  // Verificar que el nuevo nombre no existe
  const newInfo = await FileSystem.getInfoAsync(newPath);
  if (newInfo.exists) {
    throw new Error(`Ya existe una carpeta llamada "${newNormalized}"`);
  }

  // Renombrar (mover)
  await FileSystem.moveAsync({
    from: oldPath,
    to: newPath,
  });

  const filesCount = await countFilesInFolder(newPath);

  console.log('[Folders] ✓ Carpeta renombrada:', newNormalized);

  return {
    name: newNormalized,
    path: newPath,
    type: 'custom',
    filesCount,
  };
}

/**
 * Eliminar carpeta personalizada (solo si está vacía)
 * No permite eliminar carpetas de tipo (pdf/csv/zip)
 */
export async function deleteFolder(name: string): Promise<void> {
  const normalized = normalizeFolderName(name);
  const path = folderPath(normalized, 'custom');

  console.log('[Folders] Eliminando carpeta:', normalized);

  // Verificar que existe
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    throw new Error(`La carpeta "${normalized}" no existe`);
  }

  // Contar archivos
  const filesCount = await countFilesInFolder(path);
  if (filesCount > 0) {
    throw new Error(
      `La carpeta "${normalized}" contiene ${filesCount} archivo(s). ` +
      'Debe estar vacía para poder eliminarla.'
    );
  }

  // Eliminar directorio vacío
  await FileSystem.deleteAsync(path, { idempotent: true });
  
  console.log('[Folders] ✓ Carpeta eliminada:', normalized);
}

/**
 * Verificar si una carpeta existe
 */
export async function folderExists(name: string, type?: 'pdf' | 'csv' | 'zip' | 'legacy' | 'custom'): Promise<boolean> {
  try {
    const path = folderPath(name, type);
    const info = await FileSystem.getInfoAsync(path);
    return info.exists && (info as any).isDirectory;
  } catch {
    return false;
  }
}
