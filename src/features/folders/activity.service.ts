// src/features/folders/activity.service.ts
// FASE 6.4-CORE: Servicio de auditoría de carpetas

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FolderAction, FolderActivityEvent, TargetKind } from './types';

const ACTIVITY_KEY = 'folders:activity:v1';

/**
 * Generar ID único para evento
 */
function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Cargar todos los eventos de actividad
 */
async function loadAllActivity(): Promise<FolderActivityEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVITY_KEY);
    if (!raw) return [];
    
    const events = JSON.parse(raw) as FolderActivityEvent[];
    return events;
  } catch (error) {
    console.error('[FolderActivity] Error loading activity:', error);
    return [];
  }
}

/**
 * Guardar todos los eventos de actividad
 */
async function saveAllActivity(events: FolderActivityEvent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVITY_KEY, JSON.stringify(events));
    console.log('[FolderActivity] Activity saved:', events.length, 'events');
  } catch (error) {
    console.error('[FolderActivity] Error saving activity:', error);
    throw error;
  }
}

/**
 * Registrar un evento de actividad
 */
export async function logFolderActivity(
  folderId: string,
  action: FolderAction,
  targetKind: TargetKind,
  targetId: string,
  meta?: Record<string, any>
): Promise<string> {
  console.log('[FolderActivity] Logging event:', {
    folderId,
    action,
    targetKind,
    targetId,
    meta,
  });

  const event: FolderActivityEvent = {
    id: generateEventId(),
    folder_id: folderId,
    actor: 'Usuario local', // Por ahora solo local, en 6.5 será multi-usuario
    action,
    target_kind: targetKind,
    target_id: targetId,
    meta: meta || {},
    created_at: Date.now(),
  };

  const allEvents = await loadAllActivity();
  allEvents.unshift(event); // Agregar al inicio (más reciente primero)

  // Limitar a últimos 1000 eventos para no llenar storage
  const trimmed = allEvents.slice(0, 1000);
  await saveAllActivity(trimmed);

  console.log('[FolderActivity] ✓ Event logged:', event.id);
  return event.id;
}

/**
 * Obtener actividad de una carpeta específica
 */
export async function getFolderActivity(
  folderId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<FolderActivityEvent[]> {
  const allEvents = await loadAllActivity();
  
  // Filtrar por carpeta
  const folderEvents = allEvents.filter(e => e.folder_id === folderId);
  
  // Ordenar por created_at desc (ya debería estar, pero asegurar)
  folderEvents.sort((a, b) => b.created_at - a.created_at);
  
  // Paginar
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  const paginated = folderEvents.slice(offset, offset + limit);
  
  console.log('[FolderActivity] Got activity for folder:', {
    folderId,
    total: folderEvents.length,
    returned: paginated.length,
  });
  
  return paginated;
}

/**
 * Obtener toda la actividad (para exportación)
 */
export async function getAllActivity(): Promise<FolderActivityEvent[]> {
  return loadAllActivity();
}

/**
 * Exportar actividad de una carpeta a JSON
 */
export async function exportFolderActivityJSON(
  folderId: string
): Promise<string> {
  const events = await getFolderActivity(folderId, { limit: 1000 });
  
  console.log('[FolderActivity] Exporting activity to JSON:', {
    folderId,
    events: events.length,
  });
  
  return JSON.stringify(events, null, 2);
}

/**
 * Exportar actividad de una carpeta a CSV
 */
export async function exportFolderActivityCSV(
  folderId: string
): Promise<string> {
  const events = await getFolderActivity(folderId, { limit: 1000 });
  
  console.log('[FolderActivity] Exporting activity to CSV:', {
    folderId,
    events: events.length,
  });
  
  // Header CSV
  const header = 'Fecha,Acción,Tipo,ID Objetivo,Actor,Detalles\n';
  
  // Rows
  const rows = events.map(event => {
    const date = new Date(event.created_at).toLocaleString('es-UY');
    const action = event.action;
    const kind = event.target_kind;
    const targetId = event.target_id;
    const actor = event.actor;
    const details = JSON.stringify(event.meta).replace(/"/g, '""'); // Escape quotes
    
    return `"${date}","${action}","${kind}","${targetId}","${actor}","${details}"`;
  }).join('\n');
  
  return header + rows;
}

/**
 * Limpiar actividad antigua (mantener solo últimos N días)
 */
export async function cleanOldActivity(daysToKeep: number = 90): Promise<number> {
  const allEvents = await loadAllActivity();
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  const filtered = allEvents.filter(e => e.created_at >= cutoffTime);
  const removed = allEvents.length - filtered.length;
  
  if (removed > 0) {
    await saveAllActivity(filtered);
    console.log('[FolderActivity] Cleaned old activity:', {
      removed,
      kept: filtered.length,
    });
  }
  
  return removed;
}
