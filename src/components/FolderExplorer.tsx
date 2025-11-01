// src/components/FolderExplorer.tsx
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { folderPath } from '../features/documents/folders';
import { showToast, showErrorToast } from '../utils/toast';
import { importMultipleIntoFolder } from '../utils/imports';
import { getFolderContent, FolderItem, FileItem, PagoItem, CobroItem, RecordatorioItem, addItemToFolder, findFoldersForItem } from '../features/folders/folders.data';
import { showFolderToast } from '../utils/toastUtils'; // FASE6.1
import { MovimientosContext } from '../state/MovimientosContext'; // FASE6.2
import ActionSheet from './ActionSheet';
import MoveToSheet from './MoveToSheet';
import InternalItemPicker, { InternalItem } from './InternalItemPicker'; // FASE6.1-b
import ExportOptionsModal from './ExportOptionsModal'; // FASE6.2b
// FASE 6.4-CORE: Metadatos y actividad
import { useFolderMetadataUI } from '../hooks/useFolderMetadataUI';
import ColorPickerModal from './ColorPickerModal';
import IconPickerModal from './IconPickerModal';
import RenameFolderModal from './RenameFolderModal';
import { getFolderActivity, exportFolderActivityJSON, exportFolderActivityCSV } from '../features/folders/activity.service';
import type { FolderActivityEvent } from '../features/folders/types';
import { DEFAULT_FOLDER_COLOR, DEFAULT_FOLDER_ICON } from '../features/folders/types';

interface FileInfo {
  name: string;
  uri: string;
  size: number;
  modificationTime: number;
}

interface FolderExplorerProps {
  folderType: string; // 'pdf' | 'csv' | 'zip' | 'custom/<nombre>'
  onClose: () => void;
  navigation?: any; // Navigation prop para navegar a detalles
}

export default function FolderExplorer({ folderType, onClose, navigation }: FolderExplorerProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [folderItems, setFolderItems] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [selectedItem, setSelectedItem] = useState<FolderItem | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showMoveSheet, setShowMoveSheet] = useState(false);
  
  // FASE6: Estados para selección múltiple y exportación
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // FASE6.1-b: Estado para InternalItemPicker
  const [showInternalPicker, setShowInternalPicker] = useState(false);

  // FASE6.2: Context para resolver movimientos
  const movimientosContext = useContext(MovimientosContext);
  
  // FASE6.2b: Estado para ExportOptionsModal
  const [showExportModal, setShowExportModal] = useState(false);
  const [preFilteredMovements, setPreFilteredMovements] = useState<any[]>([]);

  // FASE 6.4-CORE: Estados para metadatos y actividad
  const { metadata, loading: loadingMetadata, refresh: refreshMetadata, getMetadataForFolder } = useFolderMetadataUI();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [activityEvents, setActivityEvents] = useState<FolderActivityEvent[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityCursor, setActivityCursor] = useState(0);
  const [hasMoreActivity, setHasMoreActivity] = useState(true);
  const [showActivityPanel, setShowActivityPanel] = useState(false);

  // ============================================================================
  // FASE6.2: Helper - Obtener movimientos de una carpeta
  // ============================================================================
  
  /**
   * Resuelve todos los pagos/cobros vinculados a una carpeta
   * desde folders.data + MovimientosContext
   * @returns Array de movimientos listos para exportadores
   */
  const getMovementsFromFolder = async (folderName: string): Promise<any[]> => {
    console.log('[FASE6.2] getMovementsFromFolder:', folderName);
    
    try {
      // Cargar vínculos de la carpeta
      const content = await getFolderContent(folderName);
      const linkedPagosCobros = content.items.filter(
        (item) => item.type === 'pago' || item.type === 'cobro'
      );

      console.log('[FASE6.2] Linked items in folder:', linkedPagosCobros.length);

      // Resolver movimientos desde MovimientosContext
      const allMovements = movimientosContext?.movimientos || [];
      const movements: any[] = [];

      for (const linkedItem of linkedPagosCobros) {
        const refId = (linkedItem as PagoItem | CobroItem).refId;
        const movement = allMovements.find((m: any) => m.id === refId);
        
        if (movement) {
          movements.push(movement);
        } else {
          console.warn('[FASE6.2] Movement not found for refId:', refId);
        }
      }

      const pagosCount = movements.filter((m) => m.tipo === 'pago').length;
      const cobrosCount = movements.filter((m) => m.tipo === 'cobro').length;

      console.log('[FASE6.2] export folder', {
        folderName,
        pagos: pagosCount,
        cobros: cobrosCount,
        total: movements.length,
      });

      return movements;
    } catch (error) {
      console.error('[FASE6.2] Error getting movements from folder:', error);
      return [];
    }
  };

  // ============================================================================
  // FASE 6.4-CORE: Metadatos y Actividad
  // ============================================================================

  /**
   * Carga actividad de la carpeta con paginación
   */
  const loadActivity = async (reset: boolean = true) => {
    if (!isCustomFolder()) return;

    const folderName = getFolderName();
    setActivityLoading(true);

    try {
      const cursor = reset ? 0 : activityCursor;
      const limit = 50;

      console.log('[FASE6.4] Loading activity:', { folderName, cursor, limit });

      const events = await getFolderActivity(folderName, { limit, offset: cursor });
      
      if (reset) {
        setActivityEvents(events);
      } else {
        setActivityEvents(prev => [...prev, ...events]);
      }

      setActivityCursor(cursor + events.length);
      setHasMoreActivity(events.length === limit);

      console.log('[FASE6.4] Activity loaded:', events.length, 'events');
    } catch (error) {
      console.error('[FASE6.4] Error loading activity:', error);
      showErrorToast('No se pudo cargar la actividad');
    } finally {
      setActivityLoading(false);
    }
  };

  const handleMetadataRefresh = async () => {
    console.log('[FASE6.4] Refreshing metadata...');
    await refreshMetadata();
    await loadFiles();
    await loadFolderItems();
    await loadActivity(true);
  };

  const handleColorConfirm = async (color: string) => {
    console.log('[FASE6.4] Color updated:', color);
    setShowColorPicker(false);
    showToast('✅ Color actualizado');
    await handleMetadataRefresh();
  };

  const handleIconConfirm = async (icon: string) => {
    console.log('[FASE6.4] Icon updated:', icon);
    setShowIconPicker(false);
    showToast('✅ Ícono actualizado');
    await handleMetadataRefresh();
  };

  const handleRenameConfirm = async (newName: string) => {
    console.log('[FASE6.4] Folder renamed to:', newName);
    setShowRenameModal(false);
    showToast('✅ Carpeta renombrada');
    
    // Actualizar folderType para reflejar nuevo nombre
    const newFolderType = `custom/${newName}`;
    
    // Recargar todo con nuevo nombre
    await handleMetadataRefresh();
  };

  const handleExportActivity = async (format: 'json' | 'csv') => {
    if (!isCustomFolder()) return;

    const folderName = getFolderName();

    try {
      console.log('[FASE6.4] Exporting activity:', format);

      const content = format === 'json'
        ? await exportFolderActivityJSON(folderName)
        : await exportFolderActivityCSV(folderName);

      const fileName = `activity_${folderName}_${Date.now()}.${format}`;
      const path = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 });

      console.log('[FASE6.4] Activity exported:', path);
      showToast(`✅ Actividad exportada: ${fileName}`);

      // TODO: Abrir/compartir si prefs.showOpenWithAfterExport
    } catch (error) {
      console.error('[FASE6.4] Error exporting activity:', error);
      showErrorToast('No se pudo exportar la actividad');
    }
  };

  useEffect(() => {
    loadFiles();
    loadFolderItems();
    loadActivity(); // FASE 6.4-CORE: Cargar actividad inicial
  }, [folderType]);

  // ============================================================================
  // FASE 6.4-CORE: Helpers
  // ============================================================================

  /**
   * Obtiene el nombre de la carpeta desde folderType
   * Ejemplo: 'custom/Facturas' → 'Facturas'
   */
  const getFolderName = (): string => {
    if (folderType.startsWith('custom/')) {
      return folderType.replace('custom/', '');
    }
    return folderType;
  };

  const isCustomFolder = (): boolean => {
    return folderType.startsWith('custom/');
  };

  const loadFiles = async () => {
    setLoading(true);
    try {
      console.log('[explorer] Cargando archivos de:', folderType);

      // Determinar si es tipo predefinido o custom
      const isCustom = folderType.startsWith('custom/');
      const folderName = isCustom ? folderType.replace('custom/', '') : folderType;
      const type = isCustom ? 'custom' : 'predefined';

      const path = folderPath(folderName, type as any);
      console.log('[explorer] Path:', path);

      // Verificar si existe
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) {
        console.log('[explorer] Carpeta no existe, creándola...');
        await FileSystem.makeDirectoryAsync(path, { intermediates: true });
      }

      // Leer archivos
      const items = await FileSystem.readDirectoryAsync(path);
      console.log('[explorer] Archivos encontrados:', items.length);

      // Obtener info de cada archivo
      const filesInfo = await Promise.all(
        items.map(async (name) => {
          const uri = `${path}${name}`;
          const fileInfo = await FileSystem.getInfoAsync(uri);
          return {
            name,
            uri,
            size: (fileInfo as any).size || 0,
            modificationTime: (fileInfo as any).modificationTime || 0,
          };
        })
      );

      // Ordenar por fecha más reciente
      filesInfo.sort((a, b) => b.modificationTime - a.modificationTime);
      setFiles(filesInfo);
    } catch (error) {
      console.error('[explorer] Error al cargar archivos:', error);
      showErrorToast('No se pudieron cargar los archivos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga items vinculados (pagos, cobros, recordatorios) desde folders.data
   */
  const loadFolderItems = async () => {
    try {
      // Solo carpetas custom tienen items vinculados
      if (!folderType.startsWith('custom/')) {
        setFolderItems([]);
        return;
      }

      const folderName = folderType.replace('custom/', '');
      console.log('[explorer] Cargando items vinculados de:', folderName);

      const content = await getFolderContent(folderName);
      console.log('[explorer] Items encontrados:', content.items.length);

      // Ordenar por fecha descendente
      const sorted = [...content.items].sort((a, b) => {
        const dateA = new Date(a.type === 'file' ? a.date : (a as any).fecha);
        const dateB = new Date(b.type === 'file' ? b.date : (b as any).fecha);
        return dateB.getTime() - dateA.getTime();
      });

      setFolderItems(sorted);
    } catch (error) {
      console.error('[explorer] Error al cargar items vinculados:', error);
    }
  };

  const handleFilePress = (file: FileInfo) => {
    console.log('[explorer] Archivo seleccionado:', file.name);
    setSelectedFile(file);
    setShowActionSheet(true);
  };

  const handleOpenMoveSheet = () => {
    setShowActionSheet(false);
    setShowMoveSheet(true);
  };

  const handleMoveComplete = async () => {
    setShowMoveSheet(false);
    setSelectedFile(null);
    await loadFiles(); // Refrescar lista después de mover
  };

  const handleItemPress = (item: FolderItem) => {
    console.log('[FASE6.1] Navigation to internal item from folder:', item.type, item.id);
    
    if (!navigation) {
      Alert.alert('Info', 'Navegación no disponible en este contexto');
      return;
    }
    
    // Navegar según tipo
    if (item.type === 'pago' || item.type === 'cobro') {
      const mov = item as PagoItem | CobroItem;
      console.log('[FASE6.1] Navigation to MovementDetail from folder, refId:', mov.refId);
      
      // Cerrar modal y navegar
      onClose();
      
      // Intentar navegar al root navigator
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('MovementDetail', { mode: 'view', id: mov.refId });
      } else {
        navigation.navigate('MovementDetail', { mode: 'view', id: mov.refId });
      }
    } else if (item.type === 'recordatorio') {
      const rem = item as RecordatorioItem;
      console.log('[FASE6.1] Navigation to ReminderForm from folder, refId:', rem.refId);
      
      // Cerrar modal y navegar
      onClose();
      
      // Intentar navegar al root navigator
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('ReminderForm', { mode: 'edit', id: rem.refId });
      } else {
        navigation.navigate('ReminderForm', { mode: 'edit', id: rem.refId });
      }
    }
  };

  const handleItemLongPress = (item: FolderItem) => {
    console.log('[explorer] Long press en item:', item.type, item.id);
    
    // Solo permitir long press en carpetas custom (items vinculados)
    if (!folderType.startsWith('custom/')) {
      console.warn('[explorer] Long press solo disponible en carpetas custom');
      return;
    }
    
    const folderName = folderType.replace('custom/', '');
    
    Alert.alert(
      'Opciones',
      `¿Qué deseas hacer con este elemento?`,
      [
        {
          text: 'Eliminar de carpeta',
          style: 'destructive',
          onPress: async () => {
            try {
              const { removeItemFromFolder } = await import('../features/folders/folders.data');
              await removeItemFromFolder(folderName, item.id);
              showToast('✅ Eliminado de carpeta');
              await loadFolderItems();
            } catch (error) {
              console.error('[explorer] Error eliminando item:', error);
              showErrorToast('No se pudo eliminar');
            }
          }
        },
        {
          text: 'Ver detalle',
          onPress: () => handleItemPress(item)
        },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const handleImport = async () => {
    try {
      console.log('[IMPORT] Iniciando importación de archivos...');
      
      // Abrir DocumentPicker
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      
      console.log('[IMPORT] DocumentPicker result:', result);
      
      // Usuario canceló
      if (result.canceled) {
        console.log('[IMPORT] Importación cancelada por el usuario');
        return;
      }
      
      // Validar que hay archivos
      if (!result.assets || result.assets.length === 0) {
        showErrorToast('No se seleccionaron archivos');
        return;
      }
      
      setImporting(true);
      
      // Importar archivos
      const results = await importMultipleIntoFolder(result.assets, folderType);
      
      // Contar éxitos y fallos
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      console.log('[IMPORT] Importación completada:', { success: successCount, failed: failCount });
      
      // Refrescar lista
      await loadFiles();
      await loadFolderItems();
      
      // Mostrar resultado
      if (failCount === 0) {
        showToast(`✅ ${successCount} archivo${successCount > 1 ? 's importados' : ' importado'}`);
      } else if (successCount > 0) {
        showToast(`⚠️ ${successCount} importados, ${failCount} fallidos`);
      } else {
        showErrorToast('No se pudo importar ningún archivo');
      }
      
      // NUEVO: Si se importó un solo archivo exitosamente, abrirlo inmediatamente
      if (results.length === 1 && results[0].success) {
        const imported = results[0];
        console.log('[IMPORT] Auto-opening imported file', { name: imported.name, uri: imported.uri });
        
        // Crear FileInfo mock para abrir con ActionSheet
        const fileInfo: FileInfo = {
          name: imported.name!,
          uri: imported.uri!,
          size: result.assets[0].size || 0,
          modificationTime: Date.now() / 1000
        };
        
        setSelectedFile(fileInfo);
        setShowActionSheet(true);
      }
      
      // Mostrar detalles de errores si los hay
      const errors = results.filter(r => !r.success);
      if (errors.length > 0 && errors.length <= 3) {
        const errorMessages = errors.map(e => e.error).join('\n');
        Alert.alert('Algunos archivos no se importaron', errorMessages);
      }
      
    } catch (error: any) {
      console.error('[IMPORT] Error al importar:', error);
      showErrorToast('Error al importar archivos');
    } finally {
      setImporting(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getFolderTitle = (): string => {
    if (folderType === 'pdf') return 'PDF';
    if (folderType === 'csv') return 'CSV';
    if (folderType === 'zip') return 'ZIP';
    return folderType.replace('custom/', '');
  };

  const getFileIcon = (fileName: string): any => {
    if (fileName.endsWith('.pdf')) return 'document-text';
    if (fileName.endsWith('.csv')) return 'grid';
    if (fileName.endsWith('.zip')) return 'folder-outline';
    return 'document';
  };

  /**
   * Separa los items por tipo para mostrar en secciones
   */
  const getSectionedItems = () => {
    const pagos = folderItems.filter(i => i.type === 'pago') as PagoItem[];
    const cobros = folderItems.filter(i => i.type === 'cobro') as CobroItem[];
    const recordatorios = folderItems.filter(i => i.type === 'recordatorio') as RecordatorioItem[];
    
    return { pagos, cobros, recordatorios };
  };

  const renderSectionHeader = (icon: string, title: string, count: number) => {
    if (count === 0) return null;
    
    return (
      <View style={s.sectionHeader}>
        <Ionicons name={icon as any} size={18} color="#3E7D75" style={s.sectionIcon} />
        <Text style={s.sectionTitle}>{title}</Text>
        <Text style={s.sectionCount}>{count}</Text>
      </View>
    );
  };

  const renderPagoItem = (item: PagoItem, index: number) => {
    const isSelected = selectedItems.has(item.id);
    
    return (
      <TouchableOpacity
        key={`pago-${item.id}`}
        style={[s.itemCard, isSelected && s.itemCardSelected]}
        onPress={() => selectionMode ? toggleItemSelection(item.id) : handleItemPress(item)}
        onLongPress={() => !selectionMode && handleItemLongPress(item)}
        testID={`pago-${index}`}
      >
        {/* FASE6: Checkbox en modo selección */}
        {selectionMode && (
          <View style={s.checkbox}>
            <Ionicons 
              name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={isSelected ? "#3E7D75" : "#ccc"} 
            />
          </View>
        )}
        <View style={[s.itemIcon, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="arrow-up-outline" size={24} color="#FF6B35" />
        </View>
      <View style={s.itemContent}>
        <Text style={s.itemTitle} numberOfLines={1}>
          {item.concepto}
        </Text>
        <View style={s.itemMetaRow}>
          <Text style={s.itemAmount}>${(item.monto || 0).toFixed(2)}</Text>
          <Text style={s.itemMeta}> • </Text>
          <Text style={[s.itemBadge, getEstadoBadgeStyle(item.estado)]}>
            {item.estado}
          </Text>
        </View>
        <Text style={s.itemDate}>{formatItemDate(item.fecha)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
    );
  };

  const renderCobroItem = (item: CobroItem, index: number) => {
    const isSelected = selectedItems.has(item.id);
    
    return (
      <TouchableOpacity
        key={`cobro-${item.id}`}
        style={[s.itemCard, isSelected && s.itemCardSelected]}
        onPress={() => selectionMode ? toggleItemSelection(item.id) : handleItemPress(item)}
        onLongPress={() => !selectionMode && handleItemLongPress(item)}
        testID={`cobro-${index}`}
      >
        {/* FASE6: Checkbox en modo selección */}
        {selectionMode && (
          <View style={s.checkbox}>
            <Ionicons 
              name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={isSelected ? "#3E7D75" : "#ccc"} 
            />
          </View>
        )}
        <View style={[s.itemIcon, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="arrow-down-outline" size={24} color="#4CAF50" />
        </View>
        <View style={s.itemContent}>
          <Text style={s.itemTitle} numberOfLines={1}>
            {item.concepto}
          </Text>
          <View style={s.itemMetaRow}>
            <Text style={[s.itemAmount, { color: '#4CAF50' }]}>${(item.monto || 0).toFixed(2)}</Text>
            <Text style={s.itemMeta}> • </Text>
            <Text style={[s.itemBadge, getEstadoBadgeStyle(item.estado)]}>
              {item.estado}
            </Text>
          </View>
          <Text style={s.itemDate}>{formatItemDate(item.fecha)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  const renderRecordatorioItem = (item: RecordatorioItem, index: number) => (
    <TouchableOpacity
      key={`recordatorio-${item.id}`}
      style={s.itemCard}
      onPress={() => handleItemPress(item)}
      onLongPress={() => handleItemLongPress(item)}
      testID={`recordatorio-${index}`}
    >
      <View style={[s.itemIcon, { backgroundColor: '#F3E5F5' }]}>
        <Ionicons name="notifications-outline" size={24} color="#9C27B0" />
      </View>
      <View style={s.itemContent}>
        <Text style={s.itemTitle} numberOfLines={1}>
          {item.titulo}
        </Text>
        <View style={s.itemMetaRow}>
          <Text style={[s.itemBadge, getPrioridadBadgeStyle(item.prioridad)]}>
            {item.prioridad}
          </Text>
          {item.completado && (
            <>
              <Text style={s.itemMeta}> • </Text>
              <Text style={[s.itemBadge, { backgroundColor: '#E8F5E9', color: '#4CAF50' }]}>
                completado
              </Text>
            </>
          )}
        </View>
        <Text style={s.itemDate}>{formatItemDate(item.fecha)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const getEstadoBadgeStyle = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return { backgroundColor: '#E8F5E9', color: '#4CAF50' };
      case 'urgente':
        return { backgroundColor: '#FFEBEE', color: '#F44336' };
      case 'pronto':
        return { backgroundColor: '#FFF3E0', color: '#FF9800' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#757575' };
    }
  };

  const getPrioridadBadgeStyle = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return { backgroundColor: '#FFEBEE', color: '#F44336' };
      case 'media':
        return { backgroundColor: '#FFF3E0', color: '#FF9800' };
      default:
        return { backgroundColor: '#F5F5F5', color: '#757575' };
    }
  };

  const formatItemDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-UY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // FASE6: Funciones de selección múltiple
  const toggleSelectionMode = () => {
    console.log('[FASE6] Toggle selection mode');
    setSelectionMode(!selectionMode);
    setSelectedItems(new Set());
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  // FASE6: Exportar items seleccionados (MVP - solo PDF/CSV de pagos/cobros)
  // FASE6.2b: Exportar carpeta completa
  const handleExportFolder = async () => {
    console.log('[FASE6.2b] Exporting entire folder:', folderType);
    
    if (!folderType.startsWith('custom/')) {
      Alert.alert('Error', 'Solo se pueden exportar carpetas personalizadas');
      return;
    }
    
    const folderName = folderType.replace('custom/', '');
    
    try {
      const movements = await getMovementsFromFolder(folderName);
      
      if (movements.length === 0) {
        Alert.alert(
          'Carpeta vacía',
          'No hay pagos ni cobros en esta carpeta para exportar.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log('[FASE6.2b] Opening ExportOptionsModal with', movements.length, 'movements');
      setPreFilteredMovements(movements);
      setShowExportModal(true);
    } catch (error) {
      console.error('[FASE6.2b] Error preparing folder export:', error);
      showErrorToast('Error al preparar exportación');
    }
  };

  const handleExportSelected = () => {
    console.log('[FASE6] Export selected items:', selectedItems.size);
    
    if (selectedItems.size === 0) {
      Alert.alert('Sin selección', 'Selecciona al menos un elemento para exportar');
      return;
    }
    
    // Filtrar items seleccionados (solo pagos y cobros)
    const itemsToExport = folderItems.filter(item => 
      selectedItems.has(item.id) && (item.type === 'pago' || item.type === 'cobro')
    );
    
    if (itemsToExport.length === 0) {
      Alert.alert(
        'Sin elementos exportables',
        'Solo se pueden exportar pagos y cobros.\nLos recordatorios no son exportables desde aquí.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // FASE6.2b: Resolver movimientos seleccionados y abrir modal de exportación
    const allMovements = movimientosContext?.movimientos || [];
    const resolvedMovements: any[] = [];
    
    for (const item of itemsToExport) {
      const refId = (item as PagoItem | CobroItem).refId;
      const movement = allMovements.find((m: any) => m.id === refId);
      
      if (movement) {
        resolvedMovements.push(movement);
      }
    }
    
    if (resolvedMovements.length === 0) {
      Alert.alert('Error', 'No se pudieron resolver los movimientos seleccionados');
      return;
    }
    
    console.log('[FASE6.2b] Opening ExportOptionsModal with', resolvedMovements.length, 'selected movements');
    setPreFilteredMovements(resolvedMovements);
    setShowExportModal(true);
    setSelectionMode(false);
    setSelectedItems(new Set());
  };

  // FASE6.1-b: Handlers para InternalItemPicker
  const handleOpenInternalPicker = () => {
    console.log('[INTP] openLinkExisting');
    setShowInternalPicker(true);
  };

  const handleConfirmInternalPicker = async (selected: InternalItem[]) => {
    console.log('[INTP] confirm', { selected: selected.map(s => ({ type: s.type, refId: s.refId })) });
    
    if (!folderType.startsWith('custom/')) {
      console.warn('[INTP] Solo carpetas custom soportan vínculos internos');
      return;
    }

    // Limpiar prefijo custom/ del folderName (nunca guardarlo en storage)
    const currentFolderName = folderType.replace('custom/', '');
    console.log('[INTP] folder cleaned', { original: folderType, clean: currentFolderName });
    let added = 0;
    let skipped = 0;

    try {
      for (const item of selected) {
        // Verificar si ya está vinculado (evitar duplicados)
        const existingFolders = await findFoldersForItem(item.type, item.refId);
        if (existingFolders.includes(currentFolderName)) {
          console.log('[INTP] item already linked, skip', { type: item.type, refId: item.refId });
          skipped++;
          continue;
        }

        // Añadir vínculo (currentFolderName ya está limpio, sin custom/)
        console.log('[INTP] adding item to folder', { folder: currentFolderName, type: item.type, refId: item.refId });
        await addItemToFolder(currentFolderName, {
          type: item.type,
          refId: item.refId,
          monto: item.monto ?? 0,
          concepto: item.titulo,
          fecha: item.fecha,
          estado: item.estado ?? 'pendiente',
        } as any);

        added++;
      }

      console.log('[INTP] pickerConfirm complete', { added, skipped, folder: currentFolderName });

      // Toast feedback
      if (added > 0) {
        showFolderToast('add', currentFolderName);
      }

      if (skipped > 0) {
        Alert.alert(
          'Algunos ya estaban vinculados',
          `${added} añadido${added !== 1 ? 's' : ''}, ${skipped} omitido${skipped !== 1 ? 's' : ''} (ya estaba${skipped === 1 ? '' : 'n'} en la carpeta)`,
          [{ text: 'OK' }]
        );
      }

      // Cerrar picker y refrescar
      setShowInternalPicker(false);
      await loadFolderItems();
    } catch (error) {
      console.error('[FASE6.1-b] Error al vincular items:', error);
      Alert.alert('Error', 'No se pudieron vincular algunos elementos');
    }
  };

  return (
    <>
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <View style={s.container}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={onClose} testID="btn-back">
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={s.headerTitle}>
              <Text style={s.title}>{getFolderTitle()}</Text>
              <Text style={s.subtitle}>
                {selectionMode 
                  ? `${selectedItems.size} seleccionado${selectedItems.size !== 1 ? 's' : ''}`
                  : `${files.length} archivo${files.length !== 1 ? 's' : ''}`
                }
              </Text>
            </View>
            
            {/* FASE6: Botones de acción según modo */}
            {selectionMode ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity 
                  style={s.importBtn} 
                  onPress={handleExportSelected}
                  disabled={selectedItems.size === 0}
                  testID="btn-export-selected"
                >
                  <Ionicons 
                    name="download-outline" 
                    size={24} 
                    color={selectedItems.size > 0 ? "#3E7D75" : "#ccc"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={s.importBtn} 
                  onPress={toggleSelectionMode}
                  testID="btn-cancel-selection"
                >
                  <Ionicons name="close" size={24} color="#999" />
                </TouchableOpacity>
              </View>
            ) : folderType.startsWith('custom/') && folderItems.length > 0 ? (
              // FASE6.1-b: Header con contenido - botón "➕ Agregar"
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {/* FASE6.2b: Botón exportar carpeta */}
                <TouchableOpacity 
                  style={s.importBtn} 
                  onPress={handleExportFolder}
                  testID="btn-export-folder"
                >
                  <Ionicons name="share-outline" size={24} color="#3E7D75" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={s.importBtn} 
                  onPress={handleOpenInternalPicker}
                  testID="btn-add-internal"
                >
                  <Ionicons name="add-circle-outline" size={24} color="#3E7D75" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={s.importBtn} 
                  onPress={toggleSelectionMode}
                  testID="btn-select-mode"
                >
                  <Ionicons name="checkmark-circle-outline" size={24} color="#3E7D75" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={s.importBtn} 
                  onPress={handleImport}
                  disabled={importing || loading}
                  testID="btn-import"
                >
                  {importing ? (
                    <ActivityIndicator size="small" color="#3E7D75" />
                  ) : (
                    <Ionicons name="cloud-upload-outline" size={24} color="#3E7D75" />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={s.importBtn} 
                onPress={handleImport}
                disabled={importing || loading}
                testID="btn-import"
              >
                {importing ? (
                  <ActivityIndicator size="small" color="#3E7D75" />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={24} color="#3E7D75" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* FASE 6.4-CORE: Header con metadatos (solo carpetas custom) */}
          {isCustomFolder() && (
            <View style={s.metadataHeader}>
              <View style={s.metadataChips}>
                {/* Chip de Color */}
                <TouchableOpacity
                  style={s.metadataChip}
                  onPress={() => setShowColorPicker(true)}
                  accessibilityLabel={`Color de carpeta ${getMetadataForFolder(getFolderName()).color || DEFAULT_FOLDER_COLOR}`}
                >
                  <View style={[s.colorSwatch, { backgroundColor: getMetadataForFolder(getFolderName()).color || DEFAULT_FOLDER_COLOR }]} />
                  <Text style={s.chipLabel}>Color</Text>
                  <Ionicons name="chevron-down" size={14} color="#999" />
                </TouchableOpacity>

                {/* Chip de Ícono */}
                <TouchableOpacity
                  style={s.metadataChip}
                  onPress={() => setShowIconPicker(true)}
                  accessibilityLabel={`Ícono de carpeta ${getMetadataForFolder(getFolderName()).icon || DEFAULT_FOLDER_ICON}`}
                >
                  <Ionicons name={(getMetadataForFolder(getFolderName()).icon || DEFAULT_FOLDER_ICON) as any} size={18} color="#6A5ACD" />
                  <Text style={s.chipLabel}>Ícono</Text>
                  <Ionicons name="chevron-down" size={14} color="#999" />
                </TouchableOpacity>

                {/* Botón Renombrar */}
                <TouchableOpacity
                  style={s.metadataChip}
                  onPress={() => setShowRenameModal(true)}
                >
                  <Ionicons name="create-outline" size={18} color="#3E7D75" />
                  <Text style={s.chipLabel}>Renombrar</Text>
                </TouchableOpacity>

                {/* Botón Actividad */}
                <TouchableOpacity
                  style={s.metadataChip}
                  onPress={() => setShowActivityPanel(!showActivityPanel)}
                >
                  <Ionicons name="time-outline" size={18} color="#FF6B6B" />
                  <Text style={s.chipLabel}>Actividad</Text>
                  <Ionicons name={showActivityPanel ? "chevron-up" : "chevron-down"} size={14} color="#999" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Body */}
          <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>
            {loading ? (
              <View style={s.emptyState}>
                <ActivityIndicator size="large" color="#3E7D75" />
                <Text style={s.muted}>Cargando archivos...</Text>
              </View>
            ) : files.length === 0 && folderItems.length === 0 ? (
              // FASE6.1-b: CTA doble cuando carpeta vacía (solo custom)
              folderType.startsWith('custom/') ? (
                <View style={s.emptyState}>
                  <Ionicons name="folder-open-outline" size={64} color="#ccc" />
                  <Text style={s.muted}>Carpeta vacía</Text>
                  <Text style={s.mutedSmall}>
                    Puedes vincular elementos existentes o importar archivos
                  </Text>
                  
                  <View style={s.ctaContainer}>
                    <TouchableOpacity 
                      style={s.ctaBtn}
                      onPress={handleOpenInternalPicker}
                      testID="btn-cta-link-existing"
                    >
                      <Ionicons name="link-outline" size={24} color="#3E7D75" />
                      <Text style={s.ctaBtnText}>Vincular elemento existente</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[s.ctaBtn, s.ctaBtnSecondary]}
                      onPress={handleImport}
                      testID="btn-cta-import"
                    >
                      <Ionicons name="cloud-upload-outline" size={24} color="#6A5ACD" />
                      <Text style={[s.ctaBtnText, s.ctaBtnTextSecondary]}>Importar archivo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={s.emptyState}>
                  <Ionicons name="folder-open-outline" size={64} color="#ccc" />
                  <Text style={s.muted}>Carpeta vacía</Text>
                  <Text style={s.mutedSmall}>
                    Los archivos exportados aparecerán aquí
                  </Text>
                </View>
              )
            ) : (
              <>
                {/* Sección: Items Vinculados (solo carpetas custom) */}
                {folderType.startsWith('custom/') && folderItems.length > 0 && (() => {
                  const { pagos, cobros, recordatorios } = getSectionedItems();
                  return (
                    <>
                      {/* Pagos */}
                      {renderSectionHeader('arrow-up-circle', 'Pagos', pagos.length)}
                      {pagos.map((item, idx) => renderPagoItem(item, idx))}
                      
                      {/* Cobros */}
                      {renderSectionHeader('arrow-down-circle', 'Cobros', cobros.length)}
                      {cobros.map((item, idx) => renderCobroItem(item, idx))}
                      
                      {/* Recordatorios */}
                      {renderSectionHeader('notifications', 'Recordatorios', recordatorios.length)}
                      {recordatorios.map((item, idx) => renderRecordatorioItem(item, idx))}
                      
                      {/* Separador si también hay archivos */}
                      {files.length > 0 && <View style={s.sectionDivider} />}
                    </>
                  );
                })()}

                {/* Sección: Archivos */}
                {files.length > 0 && (
                  <>
                    {renderSectionHeader('document', 'Archivos', files.length)}
                    {files.map((file, index) => (
                      <TouchableOpacity
                        key={`${file.uri}-${index}`}
                        style={s.fileCard}
                        onPress={() => handleFilePress(file)}
                        testID={`file-${index}`}
                      >
                        <View style={s.fileIcon}>
                          <Ionicons name={getFileIcon(file.name)} size={28} color="#3E7D75" />
                        </View>
                        <View style={s.fileContent}>
                          <Text style={s.fileName} numberOfLines={2}>
                            {file.name}
                          </Text>
                          <View style={s.fileMetaRow}>
                            <Text style={s.fileMeta}>{formatSize(file.size)}</Text>
                            <Text style={s.fileMeta}> • </Text>
                            <Text style={s.fileMeta}>{formatDate(file.modificationTime)}</Text>
                          </View>
                        </View>
                        <Ionicons name="ellipsis-horizontal" size={20} color="#ccc" />
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </>
            )}

            {/* FASE 6.4-CORE: Panel de Actividad */}
            {isCustomFolder() && showActivityPanel && (
              <View style={s.activityPanel}>
                <View style={s.activityHeader}>
                  <Text style={s.activityTitle}>📋 Actividad</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={s.activityExportBtn}
                      onPress={() => handleExportActivity('json')}
                    >
                      <Ionicons name="code-outline" size={16} color="#6A5ACD" />
                      <Text style={s.activityExportText}>JSON</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.activityExportBtn}
                      onPress={() => handleExportActivity('csv')}
                    >
                      <Ionicons name="grid-outline" size={16} color="#6A5ACD" />
                      <Text style={s.activityExportText}>CSV</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {activityLoading && activityEvents.length === 0 ? (
                  <View style={s.activityEmpty}>
                    <ActivityIndicator size="small" color="#999" />
                    <Text style={s.activityEmptyText}>Cargando actividad...</Text>
                  </View>
                ) : activityEvents.length === 0 ? (
                  <View style={s.activityEmpty}>
                    <Ionicons name="time-outline" size={32} color="#ccc" />
                    <Text style={s.activityEmptyText}>Sin actividad registrada</Text>
                  </View>
                ) : (
                  <>
                    {activityEvents.map((event, index) => (
                      <View key={event.id || index} style={s.activityItem}>
                        <View style={s.activityIcon}>
                          <Ionicons
                            name={getActivityIcon(event.action)}
                            size={16}
                            color={getActivityColor(event.action)}
                          />
                        </View>
                        <View style={s.activityContent}>
                          <Text style={s.activityAction}>{formatActivityAction(event.action)}</Text>
                          <Text style={s.activityDetail}>{formatActivityDetail(event)}</Text>
                          <Text style={s.activityDate}>{formatActivityDate(event.created_at)}</Text>
                        </View>
                      </View>
                    ))}

                    {/* Botón "Cargar más" */}
                    {hasMoreActivity && (
                      <TouchableOpacity
                        style={s.loadMoreBtn}
                        onPress={() => loadActivity(false)}
                        disabled={activityLoading}
                      >
                        {activityLoading ? (
                          <ActivityIndicator size="small" color="#6A5ACD" />
                        ) : (
                          <>
                            <Ionicons name="chevron-down" size={16} color="#6A5ACD" />
                            <Text style={s.loadMoreText}>Cargar más</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ActionSheet estándar - solo Abrir con y Ver */}
      {selectedFile && showActionSheet && (
        <ActionSheet
          visible={showActionSheet}
          onClose={() => {
            setShowActionSheet(false);
            setSelectedFile(null);
          }}
          fileUri={selectedFile.uri}
          fileName={selectedFile.name}
          mimeType={
            selectedFile.name.endsWith('.pdf')
              ? 'application/pdf'
              : selectedFile.name.endsWith('.csv')
              ? 'text/csv'
              : 'application/zip'
          }
          documentId={undefined}
          navigation={undefined}
          onMovePress={handleOpenMoveSheet}
        />
      )}

      {/* MoveToSheet para mover archivo */}
      {selectedFile && showMoveSheet && (
        <MoveToSheet
          visible={showMoveSheet}
          fileUri={selectedFile.uri}
          fileName={selectedFile.name}
          currentFolder={folderType}
          onClose={() => {
            setShowMoveSheet(false);
            setSelectedFile(null);
          }}
          onMoveComplete={handleMoveComplete}
        />
      )}

      {/* FASE6.1-b: InternalItemPicker para vincular elementos internos */}
      <InternalItemPicker
        visible={showInternalPicker}
        onClose={() => setShowInternalPicker(false)}
        onConfirm={handleConfirmInternalPicker}
        currentFolder={folderType.startsWith('custom/') ? folderType.replace('custom/', '') : undefined}
      />

      {/* FASE6.2b: ExportOptionsModal para exportar carpeta/selección */}
      <ExportOptionsModal
        visible={showExportModal}
        onClose={() => {
          setShowExportModal(false);
          setPreFilteredMovements([]);
        }}
        onExport={() => {
          // Modal maneja exportación internamente
          console.log('[FASE6.2b] Export completed from folder');
        }}
        prefilterMovements={preFilteredMovements}
      />

      {/* FASE 6.4-CORE: Modales de metadatos */}
      {isCustomFolder() && showColorPicker && (
        <ColorPickerModal
          visible={showColorPicker}
          folderName={getFolderName()}
          initialColor={getMetadataForFolder(getFolderName()).color}
          onConfirm={handleColorConfirm}
          onCancel={() => setShowColorPicker(false)}
        />
      )}

      {isCustomFolder() && showIconPicker && (
        <IconPickerModal
          visible={showIconPicker}
          folderName={getFolderName()}
          initialIcon={getMetadataForFolder(getFolderName()).icon}
          onConfirm={handleIconConfirm}
          onCancel={() => setShowIconPicker(false)}
        />
      )}

      {isCustomFolder() && showRenameModal && (
        <RenameFolderModal
          visible={showRenameModal}
          currentName={getFolderName()}
          onConfirm={handleRenameConfirm}
          onCancel={() => setShowRenameModal(false)}
        />
      )}
    </>
  );
}

// ============================================================================
// FASE 6.4-CORE: Helper functions para formatear actividad
// ============================================================================

function getActivityIcon(action: string): any {
  switch (action) {
    case 'CREATE_FOLDER': return 'add-circle';
    case 'RENAME_FOLDER': return 'create';
    case 'SET_FOLDER_COLOR': return 'color-palette';
    case 'SET_FOLDER_ICON': return 'images';
    case 'DELETE_FOLDER': return 'trash';
    case 'LINK_ITEM': return 'link';
    case 'UNLINK_ITEM': return 'unlink';
    case 'MOVE_ITEM': return 'move';
    case 'IMPORT_FILE': return 'cloud-upload';
    case 'EXPORT_FOLDER': return 'share';
    default: return 'ellipse';
  }
}

function getActivityColor(action: string): string {
  switch (action) {
    case 'CREATE_FOLDER': return '#27AE60';
    case 'RENAME_FOLDER': return '#6A5ACD';
    case 'SET_FOLDER_COLOR': return '#3E7D75';
    case 'SET_FOLDER_ICON': return '#FF6B6B';
    case 'DELETE_FOLDER': return '#E74C3C';
    case 'LINK_ITEM': return '#2980B9';
    case 'UNLINK_ITEM': return '#E67E22';
    case 'MOVE_ITEM': return '#8E44AD';
    case 'IMPORT_FILE': return '#16A085';
    case 'EXPORT_FOLDER': return '#3498DB';
    default: return '#999';
  }
}

function formatActivityAction(action: string): string {
  switch (action) {
    case 'CREATE_FOLDER': return 'Creada';
    case 'RENAME_FOLDER': return 'Renombrada';
    case 'SET_FOLDER_COLOR': return 'Color cambiado';
    case 'SET_FOLDER_ICON': return 'Ícono cambiado';
    case 'DELETE_FOLDER': return 'Eliminada';
    case 'LINK_ITEM': return 'Item vinculado';
    case 'UNLINK_ITEM': return 'Item desvinculado';
    case 'MOVE_ITEM': return 'Item movido';
    case 'IMPORT_FILE': return 'Archivo importado';
    case 'EXPORT_FOLDER': return 'Carpeta exportada';
    default: return action;
  }
}

function formatActivityDetail(event: FolderActivityEvent): string {
  const meta = event.meta || {};
  
  switch (event.action) {
    case 'RENAME_FOLDER':
      return `"${meta.before || '?'}" → "${meta.after || '?'}"`;
    case 'SET_FOLDER_COLOR':
      return `${meta.before || '#---'} → ${meta.after || '#---'}`;
    case 'SET_FOLDER_ICON':
      return `${meta.before || '?'} → ${meta.after || '?'}`;
    case 'LINK_ITEM':
    case 'UNLINK_ITEM':
      return `${event.target_kind}: ${event.target_id || '?'}`;
    case 'MOVE_ITEM':
      return `${meta.from || '?'} → ${meta.to || '?'}`;
    case 'IMPORT_FILE':
      return meta.fileName || 'archivo';
    default:
      return meta.detail || '';
  }
}

function formatActivityDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  
  return date.toLocaleDateString('es-UY', { day: '2-digit', month: 'short' });
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  importBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F7F6',
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4D3527',
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  muted: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  mutedSmall: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Sección headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4D3527',
    flex: 1,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: 16,
  },
  // Items vinculados (pagos, cobros, recordatorios)
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4D3527',
    marginBottom: 4,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B35',
  },
  itemMeta: {
    fontSize: 12,
    color: '#ccc',
  },
  itemBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  // Archivos
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileContent: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4D3527',
    marginBottom: 4,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileMeta: {
    fontSize: 12,
    color: '#999',
  },
  // FASE6: Estilos para selección múltiple
  checkbox: {
    marginRight: 12,
  },
  itemCardSelected: {
    backgroundColor: '#F0F7F6',
    borderWidth: 2,
    borderColor: '#3E7D75',
  },
  // FASE6.1-b: Estilos para CTA de carpeta vacía
  ctaContainer: {
    width: '100%',
    paddingHorizontal: 32,
    marginTop: 24,
    gap: 12,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3E7D75',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaBtnSecondary: {
    backgroundColor: '#6A5ACD',
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  ctaBtnTextSecondary: {
    color: '#fff',
  },
  // FASE 6.4-CORE: Estilos para metadatos
  metadataHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  metadataChips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metadataChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  // FASE 6.4-CORE: Estilos para panel de actividad
  activityPanel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4D3527',
  },
  activityExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F0EBFF',
  },
  activityExportText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A5ACD',
  },
  activityEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  activityEmptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4D3527',
    marginBottom: 2,
  },
  activityDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 11,
    color: '#999',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6A5ACD',
  },
});
