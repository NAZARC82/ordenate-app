// src/features/folders/folders.data.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * MODELO DE DATOS EXTENDIDO PARA CARPETAS
 * Soporta vínculos a archivos, pagos, cobros y recordatorios
 */

// ============================================================================
// TIPOS
// ============================================================================

export type FolderItemType = 'file' | 'pago' | 'cobro' | 'recordatorio';

export type FolderItem =
  | FileItem
  | PagoItem
  | CobroItem
  | RecordatorioItem;

export interface FileItem {
  type: 'file';
  id: string;
  name: string;
  uri: string;
  kind: 'pdf' | 'csv' | 'zip';
  date: string; // ISO 8601
  size?: number;
}

export interface PagoItem {
  type: 'pago';
  id: string; // ID único del vínculo
  refId: string; // ID del movimiento en MovimientosContext
  monto: number;
  concepto: string;
  fecha: string; // ISO 8601
  estado: 'pendiente' | 'pronto' | 'urgente' | 'pagado';
}

export interface CobroItem {
  type: 'cobro';
  id: string;
  refId: string;
  monto: number;
  concepto: string;
  fecha: string; // ISO 8601
  estado: 'pendiente' | 'pronto' | 'urgente' | 'pagado';
}

export interface RecordatorioItem {
  type: 'recordatorio';
  id: string;
  refId: string; // ID del recordatorio en ReminderService
  titulo: string;
  fecha: string; // ISO 8601
  prioridad: 'baja' | 'media' | 'alta';
  completado?: boolean;
}

/**
 * Registro de contenido de una carpeta
 */
export interface FolderContent {
  folderName: string; // Nombre de la carpeta (sin 'custom/')
  items: FolderItem[];
  lastUpdated: string; // ISO 8601
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const FOLDER_CONTENT_KEY = 'folders:content:v1';

// ============================================================================
// HELPERS PRIVADOS
// ============================================================================

/**
 * Genera ID único para vínculos
 */
function generateItemId(type: FolderItemType, refId: string): string {
  return `${type}_${refId}_${Date.now()}`;
}

/**
 * Carga todo el registro de contenidos
 */
async function loadAllFolderContents(): Promise<Record<string, FolderContent>> {
  try {
    const raw = await AsyncStorage.getItem(FOLDER_CONTENT_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (error) {
    console.error('[folders.data] Error cargando contenidos:', error);
    return {};
  }
}

/**
 * Guarda todo el registro de contenidos
 */
async function saveAllFolderContents(contents: Record<string, FolderContent>): Promise<void> {
  try {
    await AsyncStorage.setItem(FOLDER_CONTENT_KEY, JSON.stringify(contents));
    console.log('[folders.data] Contenidos guardados:', Object.keys(contents).length, 'carpetas');
  } catch (error) {
    console.error('[folders.data] Error guardando contenidos:', error);
    throw error;
  }
}

// ============================================================================
// API PÚBLICA
// ============================================================================

/**
 * Obtiene el contenido completo de una carpeta
 */
export async function getFolderContent(folderName: string): Promise<FolderContent> {
  const allContents = await loadAllFolderContents();
  const content = allContents[folderName];
  
  if (!content) {
    return {
      folderName,
      items: [],
      lastUpdated: new Date().toISOString()
    };
  }
  
  return content;
}

/**
 * Añade un elemento a una carpeta
 * @param folderName - Nombre de la carpeta (sin 'custom/')
 * @param item - Elemento a añadir (sin id, se genera automático)
 */
export async function addItemToFolder(
  folderName: string,
  item: Omit<FolderItem, 'id'>
): Promise<FolderItem> {
  console.log('[folders.data] Añadiendo item a carpeta:', { folderName, type: item.type });
  
  const allContents = await loadAllFolderContents();
  const content = allContents[folderName] || {
    folderName,
    items: [],
    lastUpdated: new Date().toISOString()
  };
  
  // Generar ID único
  const fullItem: FolderItem = {
    ...item,
    id: generateItemId(item.type, (item as any).refId || (item as any).uri)
  } as FolderItem;
  
  // Verificar si ya existe (evitar duplicados por refId)
  const refId = (fullItem as any).refId || (fullItem as any).uri;
  const exists = content.items.some(i => {
    const existingRefId = (i as any).refId || (i as any).uri;
    return i.type === fullItem.type && existingRefId === refId;
  });
  
  if (exists) {
    console.warn('[folders.data] Item ya existe en carpeta, no se añade duplicado');
    return fullItem;
  }
  
  // Añadir item
  content.items.push(fullItem);
  content.lastUpdated = new Date().toISOString();
  
  // Guardar
  allContents[folderName] = content;
  await saveAllFolderContents(allContents);
  
  console.log('[folders.data] ✓ Item añadido:', fullItem.id);
  return fullItem;
}

/**
 * Elimina un elemento de una carpeta por su ID
 */
export async function removeItemFromFolder(
  folderName: string,
  itemId: string
): Promise<void> {
  console.log('[folders.data] Eliminando item:', { folderName, itemId });
  
  const allContents = await loadAllFolderContents();
  const content = allContents[folderName];
  
  if (!content) {
    console.warn('[folders.data] Carpeta no encontrada');
    return;
  }
  
  const initialLength = content.items.length;
  content.items = content.items.filter(i => i.id !== itemId);
  content.lastUpdated = new Date().toISOString();
  
  if (content.items.length === initialLength) {
    console.warn('[folders.data] Item no encontrado');
    return;
  }
  
  allContents[folderName] = content;
  await saveAllFolderContents(allContents);
  
  console.log('[folders.data] ✓ Item eliminado');
}

/**
 * Elimina un elemento de TODAS las carpetas por su refId
 * Útil cuando se elimina un pago/cobro/recordatorio del sistema
 */
export async function removeItemByRefId(
  type: FolderItemType,
  refId: string
): Promise<number> {
  console.log('[folders.data] Eliminando item por refId en todas las carpetas:', { type, refId });
  
  const allContents = await loadAllFolderContents();
  let removedCount = 0;
  
  for (const folderName in allContents) {
    const content = allContents[folderName];
    const initialLength = content.items.length;
    
    content.items = content.items.filter(i => {
      if (i.type !== type) return true;
      const itemRefId = (i as any).refId;
      return itemRefId !== refId;
    });
    
    if (content.items.length < initialLength) {
      removedCount += initialLength - content.items.length;
      content.lastUpdated = new Date().toISOString();
      allContents[folderName] = content;
    }
  }
  
  if (removedCount > 0) {
    await saveAllFolderContents(allContents);
    console.log('[folders.data] ✓ Items eliminados:', removedCount);
  }
  
  return removedCount;
}

/**
 * Elimina todo el contenido de una carpeta
 * Usado al eliminar la carpeta completa
 */
export async function clearFolderContent(folderName: string): Promise<void> {
  console.log('[folders.data] Limpiando contenido de carpeta:', folderName);
  
  const allContents = await loadAllFolderContents();
  delete allContents[folderName];
  await saveAllFolderContents(allContents);
  
  console.log('[folders.data] ✓ Contenido eliminado');
}

/**
 * Busca en qué carpeta(s) está un elemento por su refId
 */
export async function findFoldersForItem(
  type: FolderItemType,
  refId: string
): Promise<string[]> {
  const allContents = await loadAllFolderContents();
  const folders: string[] = [];
  
  for (const folderName in allContents) {
    const content = allContents[folderName];
    const found = content.items.some(i => {
      if (i.type !== type) return false;
      const itemRefId = (i as any).refId;
      return itemRefId === refId;
    });
    
    if (found) {
      folders.push(folderName);
    }
  }
  
  return folders;
}

/**
 * Renombra una carpeta (migra su contenido al nuevo nombre)
 */
export async function renameFolderContent(
  oldName: string,
  newName: string
): Promise<void> {
  console.log('[folders.data] Renombrando contenido de carpeta:', { oldName, newName });
  
  const allContents = await loadAllFolderContents();
  const content = allContents[oldName];
  
  if (!content) {
    console.warn('[folders.data] Carpeta origen no encontrada');
    return;
  }
  
  // Mover contenido al nuevo nombre
  content.folderName = newName;
  content.lastUpdated = new Date().toISOString();
  allContents[newName] = content;
  delete allContents[oldName];
  
  await saveAllFolderContents(allContents);
  console.log('[folders.data] ✓ Contenido renombrado');
}

/**
 * Obtiene estadísticas de una carpeta
 */
export async function getFolderStats(folderName: string): Promise<{
  files: number;
  pagos: number;
  cobros: number;
  recordatorios: number;
  total: number;
}> {
  const content = await getFolderContent(folderName);
  
  return {
    files: content.items.filter(i => i.type === 'file').length,
    pagos: content.items.filter(i => i.type === 'pago').length,
    cobros: content.items.filter(i => i.type === 'cobro').length,
    recordatorios: content.items.filter(i => i.type === 'recordatorio').length,
    total: content.items.length
  };
}
