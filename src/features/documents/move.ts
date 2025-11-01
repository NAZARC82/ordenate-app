// src/features/documents/move.ts
/**
 * Mover archivos entre carpetas y actualizar registry
 * 
 * @module features/documents/move
 */

import * as FileSystem from 'expo-file-system/legacy';
import { folderPath, folderExists } from './folders';
import { getRecents, addRecent, deleteRecent, DocKind, FolderType } from './registry';
import { fileExists } from '../../utils/fileExists';

export interface MoveResult {
  success: boolean;
  newUri: string;
  newFolder: FolderType;
}

/**
 * Extraer el nombre del archivo de una URI
 */
function extractFileName(uri: string): string {
  const parts = uri.split('/');
  return parts[parts.length - 1] || 'file';
}

/**
 * Detectar DocKind desde extensión de archivo
 */
function detectKind(fileName: string): DocKind {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'csv') return 'csv';
  if (ext === 'zip') return 'zip';
  return 'pdf'; // fallback
}

/**
 * Mover archivo a carpeta personalizada (custom/<name>/)
 * Actualiza el registry automáticamente
 */
export async function moveToFolder(fileUri: string, targetFolderName: string): Promise<MoveResult> {
  console.log('[Move] Moviendo a carpeta:', { fileUri, targetFolderName });

  // Verificar que el archivo existe
  const exists = await fileExists(fileUri);
  if (!exists) {
    // Limpiar de recientes
    const recents = await getRecents();
    const doc = recents.find(d => d.uri === fileUri);
    if (doc) {
      await deleteRecent(doc.id);
      console.log('[Move] Archivo no encontrado, limpiado de recientes');
    }
    throw new Error('El archivo no existe');
  }

  // Verificar/crear carpeta destino
  const targetPath = folderPath(targetFolderName, 'custom');
  const targetExists = await folderExists(targetFolderName, 'custom');
  
  if (!targetExists) {
    console.log('[Move] Creando carpeta destino:', targetPath);
    await FileSystem.makeDirectoryAsync(targetPath, { intermediates: true });
  }

  // Construir URI destino
  const fileName = extractFileName(fileUri);
  const newUri = targetPath + fileName;

  console.log('[Move] Moviendo archivo:', { from: fileUri, to: newUri });

  // Eliminar archivo existente en destino si hay
  try {
    await FileSystem.deleteAsync(newUri, { idempotent: true });
  } catch {
    // Ignorar si no existe
  }

  // Mover archivo
  await FileSystem.moveAsync({
    from: fileUri,
    to: newUri,
  });

  // Normalizar URI con file://
  const normalizedUri = newUri.startsWith('file://') ? newUri : `file://${newUri}`;

  // Actualizar registry
  const recents = await getRecents();
  const doc = recents.find(d => d.uri === fileUri);
  
  if (doc) {
    // Eliminar entrada vieja
    await deleteRecent(doc.id);
    
    // Agregar con nueva URI y folder (sin custom/ - se agrega en UI)
    await addRecent({
      id: doc.id,
      kind: doc.kind,
      name: doc.name,
      uri: normalizedUri,
      folder: targetFolderName as FolderType, // ✅ Sin custom/ prefix
    });
    
    console.log('[Move] ✓ Registry actualizado con folder:', targetFolderName);
  }

  console.log('[Move] ✓ Archivo movido exitosamente');

  return {
    success: true,
    newUri: normalizedUri,
    newFolder: `custom/${targetFolderName}`,
  };
}

/**
 * Mover archivo a carpeta de tipo (pdf/, csv/, zip/)
 * Actualiza el registry automáticamente
 */
export async function moveToKind(fileUri: string, kind: DocKind): Promise<MoveResult> {
  console.log('[Move] Moviendo a tipo:', { fileUri, kind });

  // Verificar que el archivo existe
  const exists = await fileExists(fileUri);
  if (!exists) {
    // Limpiar de recientes
    const recents = await getRecents();
    const doc = recents.find(d => d.uri === fileUri);
    if (doc) {
      await deleteRecent(doc.id);
      console.log('[Move] Archivo no encontrado, limpiado de recientes');
    }
    throw new Error('El archivo no existe');
  }

  // Verificar/crear carpeta destino
  const targetPath = folderPath(kind, kind);
  const targetExists = await folderExists(kind, kind);
  
  if (!targetExists) {
    console.log('[Move] Creando carpeta de tipo:', targetPath);
    await FileSystem.makeDirectoryAsync(targetPath, { intermediates: true });
  }

  // Construir URI destino
  const fileName = extractFileName(fileUri);
  const newUri = targetPath + fileName;

  console.log('[Move] Moviendo archivo:', { from: fileUri, to: newUri });

  // Eliminar archivo existente en destino si hay
  try {
    await FileSystem.deleteAsync(newUri, { idempotent: true });
  } catch {
    // Ignorar si no existe
  }

  // Mover archivo
  await FileSystem.moveAsync({
    from: fileUri,
    to: newUri,
  });

  // Normalizar URI con file://
  const normalizedUri = newUri.startsWith('file://') ? newUri : `file://${newUri}`;

  // Actualizar registry
  const recents = await getRecents();
  const doc = recents.find(d => d.uri === fileUri);
  
  if (doc) {
    // Eliminar entrada vieja
    await deleteRecent(doc.id);
    
    // Agregar con nueva URI y folder
    await addRecent({
      id: doc.id,
      kind: doc.kind,
      name: doc.name,
      uri: normalizedUri,
      folder: kind,
    });
    
    console.log('[Move] ✓ Registry actualizado');
  }

  console.log('[Move] ✓ Archivo movido exitosamente');

  return {
    success: true,
    newUri: normalizedUri,
    newFolder: kind,
  };
}
