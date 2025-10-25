// src/features/folders/useFolderLinks.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { showToast } from '../../utils/toast';
import {
  addItemToFolder,
  removeItemFromFolder,
  findFoldersForItem,
  FolderItemType,
  PagoItem,
  CobroItem,
  RecordatorioItem
} from './folders.data';

/**
 * HOOK: Gestión de vínculos entre carpetas y elementos internos
 * 
 * Permite añadir pagos, cobros y recordatorios a carpetas,
 * buscar en qué carpetas están, y desvincularlos.
 */

export interface AddToFolderOptions {
  type: 'pago' | 'cobro' | 'recordatorio';
  refId: string;
  folderName: string;
  // Datos específicos según tipo
  monto?: number;
  concepto?: string;
  fecha: string;
  estado?: 'pendiente' | 'pronto' | 'urgente' | 'pagado';
  titulo?: string;
  prioridad?: 'baja' | 'media' | 'alta';
  completado?: boolean;
}

export function useFolderLinks() {
  const [loading, setLoading] = useState(false);
  const [linkedFolders, setLinkedFolders] = useState<string[]>([]);

  /**
   * Añade un elemento a una carpeta
   */
  const addToFolder = useCallback(async (options: AddToFolderOptions): Promise<boolean> => {
    setLoading(true);
    
    try {
      let item: Omit<PagoItem, 'id'> | Omit<CobroItem, 'id'> | Omit<RecordatorioItem, 'id'>;
      
      // Construir item según tipo
      if (options.type === 'pago') {
        item = {
          type: 'pago',
          refId: options.refId,
          monto: options.monto || 0,
          concepto: options.concepto || 'Sin concepto',
          fecha: options.fecha,
          estado: options.estado || 'pendiente'
        };
      } else if (options.type === 'cobro') {
        item = {
          type: 'cobro',
          refId: options.refId,
          monto: options.monto || 0,
          concepto: options.concepto || 'Sin concepto',
          fecha: options.fecha,
          estado: options.estado || 'pendiente'
        };
      } else {
        // recordatorio
        item = {
          type: 'recordatorio',
          refId: options.refId,
          titulo: options.titulo || 'Sin título',
          fecha: options.fecha,
          prioridad: options.prioridad || 'media',
          completado: options.completado || false
        };
      }
      
      await addItemToFolder(options.folderName, item);
      
      // Feedback con toast
      showToast(`✅ Añadido a carpeta "${options.folderName}"`);
      
      return true;
      
    } catch (error) {
      console.error('[useFolderLinks] Error añadiendo a carpeta:', error);
      
      Alert.alert(
        '❌ Error',
        'No se pudo añadir el elemento a la carpeta. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
      
      return false;
      
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca en qué carpetas está un elemento
   */
  const findLinkedFolders = useCallback(async (
    type: FolderItemType,
    refId: string
  ): Promise<string[]> => {
    try {
      const folders = await findFoldersForItem(type, refId);
      setLinkedFolders(folders);
      return folders;
    } catch (error) {
      console.error('[useFolderLinks] Error buscando carpetas:', error);
      return [];
    }
  }, []);

  /**
   * Desvincula un elemento de una carpeta específica
   */
  const removeFromFolder = useCallback(async (
    folderName: string,
    itemId: string
  ): Promise<boolean> => {
    setLoading(true);
    
    try {
      await removeItemFromFolder(folderName, itemId);
      
      showToast(`✅ Eliminado de carpeta "${folderName}"`);
      
      return true;
      
    } catch (error) {
      console.error('[useFolderLinks] Error eliminando de carpeta:', error);
      
      Alert.alert(
        '❌ Error',
        'No se pudo eliminar el elemento de la carpeta.',
        [{ text: 'OK' }]
      );
      
      return false;
      
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    linkedFolders,
    addToFolder,
    findLinkedFolders,
    removeFromFolder
  };
}
