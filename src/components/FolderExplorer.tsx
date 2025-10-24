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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { folderPath } from '../features/documents/folders';
import { showToast, showErrorToast } from '../utils/toast';
import ActionSheet from './ActionSheet';

interface FileInfo {
  name: string;
  uri: string;
  size: number;
  modificationTime: number;
}

interface FolderExplorerProps {
  folderType: string; // 'pdf' | 'csv' | 'zip' | 'custom/<nombre>'
  onClose: () => void;
}

export default function FolderExplorer({ folderType, onClose }: FolderExplorerProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  useEffect(() => {
    loadFiles();
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

  const handleFilePress = (file: FileInfo) => {
    console.log('[explorer] Archivo seleccionado:', file.name);
    setSelectedFile(file);
    setShowActionSheet(true);
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
            <View style={{ width: 40 }} />
          </View>

          {/* Body */}
          <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>
            {loading ? (
              <View style={s.emptyState}>
                <ActivityIndicator size="large" color="#3E7D75" />
                <Text style={s.muted}>Cargando archivos...</Text>
              </View>
            ) : files.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="folder-open-outline" size={64} color="#ccc" />
                <Text style={s.muted}>Carpeta vacía</Text>
                <Text style={s.mutedSmall}>Los archivos exportados aparecerán aquí</Text>
              </View>
            ) : (
              files.map((file, index) => (
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
              ))
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
  },
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
