// src/features/folders/metadata.service.ts
// FASE 6.4-CORE: Gestión de metadatos de carpetas (color, ícono, renombrado)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  FolderMetadata, 
  normalizeHexColor, 
  normalizeIconName,
  isValidHexColor,
  DEFAULT_FOLDER_COLOR,
  DEFAULT_FOLDER_ICON,
  FolderAction,
} from './types';
import { logFolderActivity } from './activity.service';
import { normalizeFolderName } from '../documents/folders';

const METADATA_KEY = 'folders:metadata:v1';

/**
 * Estructura de almacenamiento de metadatos
 */
interface FolderMetadataStore {
  [folderName: string]: FolderMetadata;
}

/**
 * Cargar todos los metadatos
 */
async function loadAllMetadata(): Promise<FolderMetadataStore> {
  try {
    const raw = await AsyncStorage.getItem(METADATA_KEY);
    if (!raw) return {};
    
    return JSON.parse(raw) as FolderMetadataStore;
  } catch (error) {
    console.error('[FolderMetadata] Error loading metadata:', error);
    return {};
  }
}

/**
 * Guardar todos los metadatos
 */
async function saveAllMetadata(metadata: FolderMetadataStore): Promise<void> {
  try {
    await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
    console.log('[FolderMetadata] Metadata saved:', Object.keys(metadata).length, 'folders');
  } catch (error) {
    console.error('[FolderMetadata] Error saving metadata:', error);
    throw error;
  }
}

/**
 * Obtener metadatos de una carpeta
 */
export async function getFolderMetadata(folderName: string): Promise<FolderMetadata> {
  const allMetadata = await loadAllMetadata();
  const metadata = allMetadata[folderName];
  
  // Retornar defaults si no existe
  if (!metadata) {
    return {
      color: DEFAULT_FOLDER_COLOR,
      icon: DEFAULT_FOLDER_ICON,
      updated_at: Date.now(),
    };
  }
  
  return metadata;
}

/**
 * Establecer color de carpeta
 */
export async function setFolderColor(
  folderName: string,
  color: string
): Promise<void> {
  console.log('[FolderMetadata] Setting folder color:', { folderName, color });
  
  // Validar color
  if (!isValidHexColor(color)) {
    throw new Error('Color no válido. Use formato hex (#RRGGBB)');
  }
  
  // Normalizar
  const normalizedColor = normalizeHexColor(color);
  
  // Cargar metadatos actuales
  const allMetadata = await loadAllMetadata();
  const currentMetadata = allMetadata[folderName] || {
    color: DEFAULT_FOLDER_COLOR,
    icon: DEFAULT_FOLDER_ICON,
    updated_at: Date.now(),
  };
  
  const oldColor = currentMetadata.color || DEFAULT_FOLDER_COLOR;
  
  // Actualizar
  allMetadata[folderName] = {
    ...currentMetadata,
    color: normalizedColor,
    updated_at: Date.now(),
  };
  
  await saveAllMetadata(allMetadata);
  
  // Registrar actividad
  await logFolderActivity(
    folderName,
    FolderAction.SET_FOLDER_COLOR,
    'folder',
    folderName,
    { before: oldColor, after: normalizedColor }
  );
  
  console.log('[FolderMetadata] ✓ Folder color updated:', { folderName, color: normalizedColor });
}

/**
 * Establecer ícono de carpeta
 */
export async function setFolderIcon(
  folderName: string,
  icon: string
): Promise<void> {
  console.log('[FolderMetadata] Setting folder icon:', { folderName, icon });
  
  // Normalizar (ya valida y usa default si no existe)
  const normalizedIcon = normalizeIconName(icon);
  
  // Cargar metadatos actuales
  const allMetadata = await loadAllMetadata();
  const currentMetadata = allMetadata[folderName] || {
    color: DEFAULT_FOLDER_COLOR,
    icon: DEFAULT_FOLDER_ICON,
    updated_at: Date.now(),
  };
  
  const oldIcon = currentMetadata.icon || DEFAULT_FOLDER_ICON;
  
  // Actualizar
  allMetadata[folderName] = {
    ...currentMetadata,
    icon: normalizedIcon,
    updated_at: Date.now(),
  };
  
  await saveAllMetadata(allMetadata);
  
  // Registrar actividad
  await logFolderActivity(
    folderName,
    FolderAction.SET_FOLDER_ICON,
    'folder',
    folderName,
    { before: oldIcon, after: normalizedIcon }
  );
  
  console.log('[FolderMetadata] ✓ Folder icon updated:', { folderName, icon: normalizedIcon });
}

/**
 * Renombrar carpeta (actualiza metadatos)
 */
export async function renameFolderMetadata(
  oldName: string,
  newName: string
): Promise<void> {
  console.log('[FolderMetadata] Renaming folder metadata:', { oldName, newName });
  
  // Normalizar nuevo nombre
  const normalizedNewName = normalizeFolderName(newName);
  
  // Si el nombre normalizado es igual, no hacer nada
  if (oldName === normalizedNewName) {
    console.log('[FolderMetadata] No rename needed (same normalized name)');
    return;
  }
  
  // Cargar metadatos
  const allMetadata = await loadAllMetadata();
  const oldMetadata = allMetadata[oldName];
  
  if (!oldMetadata) {
    console.warn('[FolderMetadata] No metadata found for folder:', oldName);
    return;
  }
  
  // Mover metadatos al nuevo nombre
  allMetadata[normalizedNewName] = {
    ...oldMetadata,
    updated_at: Date.now(),
  };
  
  // Eliminar metadata vieja
  delete allMetadata[oldName];
  
  await saveAllMetadata(allMetadata);
  
  // Registrar actividad (en el nuevo nombre)
  await logFolderActivity(
    normalizedNewName,
    FolderAction.RENAME_FOLDER,
    'folder',
    normalizedNewName,
    { before: oldName, after: normalizedNewName }
  );
  
  console.log('[FolderMetadata] ✓ Folder metadata renamed:', { oldName, newName: normalizedNewName });
}

/**
 * Eliminar metadatos de carpeta
 */
export async function deleteFolderMetadata(folderName: string): Promise<void> {
  console.log('[FolderMetadata] Deleting folder metadata:', folderName);
  
  const allMetadata = await loadAllMetadata();
  
  if (!allMetadata[folderName]) {
    console.warn('[FolderMetadata] No metadata found for folder:', folderName);
    return;
  }
  
  delete allMetadata[folderName];
  await saveAllMetadata(allMetadata);
  
  console.log('[FolderMetadata] ✓ Folder metadata deleted:', folderName);
}

/**
 * Obtener todos los metadatos (para lista de carpetas)
 */
export async function getAllFolderMetadata(): Promise<FolderMetadataStore> {
  return loadAllMetadata();
}
