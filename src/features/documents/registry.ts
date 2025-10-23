// src/features/documents/registry.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { fileExists } from '../../utils/fileExists';

export type DocKind = 'pdf' | 'csv' | 'zip';
export type FolderType = 'pdf' | 'csv' | 'zip' | 'legacy' | `custom/${string}`;

export type RecentDoc = { 
  id: string; 
  kind: DocKind; 
  name: string; 
  uri: string; 
  ts: number;
  folder?: FolderType; // Carpeta donde está el archivo
};

const KEY = 'documents:recent';

/**
 * Normaliza URIs para asegurar que siempre empiecen con file://
 * Evita errores con FileSystem.getInfoAsync y compartir archivos
 * @param uri - URI a normalizar
 * @returns URI normalizado con file:// al inicio
 */
function normalizeUri(uri: string): string {
  if (!uri) return uri;
  
  // Ya tiene file://
  if (uri.startsWith('file://')) {
    return uri;
  }
  
  // Agregar file:// y remover slashes iniciales redundantes
  return `file://${uri.replace(/^\/+/, '')}`;
}

export async function addRecent(doc: Omit<RecentDoc, 'ts'>) {
  // Normalizar URI antes de guardar
  const uri = normalizeUri(doc.uri);
  const rec: RecentDoc = { ...doc, uri, ts: Date.now() };
  
  console.log('[Registry] Registrando documento:', { name: rec.name, uri: rec.uri });
  
  const list = await getRecents();
  const dedup = [rec, ...list.filter(x => x.uri !== rec.uri)].slice(0, 20);
  await AsyncStorage.setItem(KEY, JSON.stringify(dedup));
  return dedup;
}

export async function getRecents(): Promise<RecentDoc[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try { 
    return JSON.parse(raw) as RecentDoc[]; 
  } catch { 
    return []; 
  }
}

export async function clearRecents() {
  await AsyncStorage.removeItem(KEY);
}

/**
 * Elimina un documento de la lista de recientes por ID
 * @param id - ID del documento a eliminar
 * @returns Lista actualizada de documentos recientes
 */
export async function deleteRecent(id: string): Promise<RecentDoc[]> {
  const list = await getRecents();
  const next = list.filter(d => d.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  console.log(`[Registry] Documento eliminado: ${id}`);
  return next;
}

/**
 * Elimina documentos de recientes cuyos archivos físicos ya no existen
 * Usa la nueva API FileSystem.File para evitar warnings deprecados
 * @returns Lista actualizada de documentos recientes
 */
export async function purgeMissing(): Promise<RecentDoc[]> {
  const list = await getRecents();
  const keep: RecentDoc[] = [];
  
  for (const d of list) {
    try {
      // Normalizar URI antes de verificar
      const normalizedUri = normalizeUri(d.uri);
      
      // Usar nueva API FileSystem.File en lugar de getInfoAsync (deprecated)
      const exists = await fileExists(normalizedUri);
      
      if (exists) {
        // Guardar con URI normalizado
        keep.push({ ...d, uri: normalizedUri });
      } else {
        console.log(`[Registry] Archivo no encontrado, purgando: ${d.name}`);
      }
    } catch (err) {
      console.warn(`[Registry] Error verificando ${d.name}:`, err);
    }
  }
  
  await AsyncStorage.setItem(KEY, JSON.stringify(keep));
  console.log(`[Registry] Purgados ${list.length - keep.length} documentos inexistentes`);
  return keep;
}
