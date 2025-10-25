// src/components/FolderExplorer.tsx
import React, { useEffect, useState } from 'react';
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
import { getFolderContent, FolderItem, FileItem, PagoItem, CobroItem, RecordatorioItem } from '../features/folders/folders.data';
import ActionSheet from './ActionSheet';
import MoveToSheet from './MoveToSheet';

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

  useEffect(() => {
    loadFiles();
    loadFolderItems();
  }, [folderType]);

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
    console.log('[explorer] Item vinculado seleccionado:', item.type, item.id);
    
    if (!navigation) {
      Alert.alert('Info', 'Navegación no disponible en este contexto');
      return;
    }
    
    // Navegar según tipo
    if (item.type === 'pago' || item.type === 'cobro') {
      const mov = item as PagoItem | CobroItem;
      console.log('[explorer] Navegando a MovementDetail, refId:', mov.refId);
      
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
      console.log('[explorer] Navegando a ReminderForm, refId:', rem.refId);
      
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
      console.log('[explorer] Iniciando importación de archivos...');
      
      // Abrir DocumentPicker
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      
      console.log('[explorer] DocumentPicker result:', result);
      
      // Usuario canceló
      if (result.canceled) {
        console.log('[explorer] Importación cancelada por el usuario');
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
      
      console.log('[explorer] Importación completada:', { success: successCount, failed: failCount });
      
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
      
      // Mostrar detalles de errores si los hay
      const errors = results.filter(r => !r.success);
      if (errors.length > 0 && errors.length <= 3) {
        const errorMessages = errors.map(e => e.error).join('\n');
        Alert.alert('Algunos archivos no se importaron', errorMessages);
      }
      
    } catch (error: any) {
      console.error('[explorer] Error al importar:', error);
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

  const renderPagoItem = (item: PagoItem, index: number) => (
    <TouchableOpacity
      key={`pago-${item.id}`}
      style={s.itemCard}
      onPress={() => handleItemPress(item)}
      onLongPress={() => handleItemLongPress(item)}
      testID={`pago-${index}`}
    >
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

  const renderCobroItem = (item: CobroItem, index: number) => (
    <TouchableOpacity
      key={`cobro-${item.id}`}
      style={s.itemCard}
      onPress={() => handleItemPress(item)}
      onLongPress={() => handleItemLongPress(item)}
      testID={`cobro-${index}`}
    >
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
                {files.length} archivo{files.length !== 1 ? 's' : ''}
              </Text>
            </View>
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

          {/* Body */}
          <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>
            {loading ? (
              <View style={s.emptyState}>
                <ActivityIndicator size="large" color="#3E7D75" />
                <Text style={s.muted}>Cargando archivos...</Text>
              </View>
            ) : files.length === 0 && folderItems.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="folder-open-outline" size={64} color="#ccc" />
                <Text style={s.muted}>Carpeta vacía</Text>
                <Text style={s.mutedSmall}>
                  {folderType.startsWith('custom/')
                    ? 'Los archivos y elementos vinculados aparecerán aquí'
                    : 'Los archivos exportados aparecerán aquí'}
                </Text>
              </View>
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
    </>
  );
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
});
