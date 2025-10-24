// src/components/MoveToSheet.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listFolders, createFolder, FolderInfo } from '../features/documents/folders';
import { moveToKind, moveToFolder } from '../features/documents/move';
import { showToast, showErrorToast } from '../utils/toast';

interface MoveToSheetProps {
  visible: boolean;
  fileUri: string;
  fileName: string;
  currentFolder?: string; // Carpeta actual (opcional)
  onClose: () => void;
  onMoveComplete: () => void;
}

export default function MoveToSheet({
  visible,
  fileUri,
  fileName,
  currentFolder,
  onClose,
  onMoveComplete,
}: MoveToSheetProps) {
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFolders();
    }
  }, [visible]);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const list = await listFolders();
      setFolders(list);
    } catch (error) {
      console.error('[move] Error al cargar carpetas:', error);
      showErrorToast('No se pudieron cargar las carpetas');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToType = async (kind: 'pdf' | 'csv' | 'zip') => {
    try {
      console.log('[move]', fileName, '->', kind);
      await moveToKind(fileUri, kind);
      showToast(`✅ Movido a ${kind.toUpperCase()}/`);
      onMoveComplete();
    } catch (error: any) {
      console.error('[move] Error:', error);
      showErrorToast(error.message || 'No se pudo mover el archivo');
    }
  };

  const handleMoveToCustom = async (folderName: string) => {
    try {
      console.log('[move]', fileName, '-> custom/' + folderName);
      await moveToFolder(fileUri, folderName);
      showToast(`✅ Movido a ${folderName}`);
      onMoveComplete();
    } catch (error: any) {
      console.error('[move] Error:', error);
      showErrorToast(error.message || 'No se pudo mover el archivo');
    }
  };

  const handleCreateAndMove = async () => {
    if (!newFolderName.trim()) {
      showErrorToast('Ingresa un nombre para la carpeta');
      return;
    }

    setCreating(true);
    try {
      console.log('[move] Crear y mover:', newFolderName);
      
      // Crear carpeta
      await createFolder(newFolderName.trim());
      console.log('[move] Carpeta creada');
      
      // Mover archivo
      await moveToFolder(fileUri, newFolderName.trim());
      console.log('[move] Archivo movido');
      
      showToast(`✅ Carpeta creada y archivo movido`);
      setNewFolderName('');
      setShowCreateNew(false);
      onMoveComplete();
    } catch (error: any) {
      console.error('[move] Error:', error);
      showErrorToast(error.message || 'No se pudo completar la operación');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Mover a...</Text>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} testID="btn-close-move">
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>
            {/* Info del archivo */}
            <View style={s.fileInfo}>
              <Ionicons name="document" size={20} color="#666" />
              <Text style={s.fileName} numberOfLines={1}>
                {fileName}
              </Text>
            </View>

            {loading ? (
              <View style={s.loadingState}>
                <ActivityIndicator size="large" color="#3E7D75" />
              </View>
            ) : (
              <>
                {/* Tipos predefinidos */}
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Tipos</Text>
                  
                  {['pdf', 'csv', 'zip'].map((kind) => {
                    const folder = folders.find((f) => f.type === kind);
                    const isCurrent = currentFolder === kind;

                    return (
                      <TouchableOpacity
                        key={kind}
                        style={[s.option, isCurrent && s.optionDisabled]}
                        onPress={() => !isCurrent && handleMoveToType(kind as any)}
                        disabled={isCurrent}
                        testID={`move-to-${kind}`}
                      >
                        <View style={s.optionIcon}>
                          <Ionicons
                            name={
                              kind === 'pdf'
                                ? 'document-text'
                                : kind === 'csv'
                                ? 'grid'
                                : 'folder-outline'
                            }
                            size={24}
                            color={isCurrent ? '#ccc' : '#3E7D75'}
                          />
                        </View>
                        <View style={s.optionContent}>
                          <Text style={[s.optionText, isCurrent && s.optionTextDisabled]}>
                            {kind.toUpperCase()}
                          </Text>
                          {folder && (
                            <Text style={s.optionCount}>
                              {folder.filesCount} archivo{folder.filesCount !== 1 ? 's' : ''}
                            </Text>
                          )}
                        </View>
                        {isCurrent && (
                          <Text style={s.currentBadge}>Actual</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Carpetas personalizadas */}
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Carpetas personalizadas</Text>
                    <TouchableOpacity
                      style={s.addBtn}
                      onPress={() => setShowCreateNew(!showCreateNew)}
                      testID="btn-create-new-folder"
                    >
                      <Ionicons
                        name={showCreateNew ? 'remove-circle' : 'add-circle'}
                        size={24}
                        color="#6A5ACD"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Input crear carpeta */}
                  {showCreateNew && (
                    <View style={s.createRow}>
                      <TextInput
                        style={s.input}
                        value={newFolderName}
                        onChangeText={setNewFolderName}
                        placeholder="Nombre de la carpeta..."
                        autoFocus
                        editable={!creating}
                        testID="input-new-folder-name"
                      />
                      <TouchableOpacity
                        style={[s.createBtn, creating && s.createBtnDisabled]}
                        onPress={handleCreateAndMove}
                        disabled={creating}
                        testID="btn-confirm-create-and-move"
                      >
                        {creating ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Ionicons name="checkmark" size={20} color="white" />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Lista de carpetas custom */}
                  {folders.filter((f) => f.type === 'custom').length === 0 ? (
                    <View style={s.emptyState}>
                      <Ionicons name="folder-open-outline" size={40} color="#ccc" />
                      <Text style={s.emptyText}>No hay carpetas personalizadas</Text>
                    </View>
                  ) : (
                    folders
                      .filter((f) => f.type === 'custom')
                      .map((folder) => {
                        const isCurrent = currentFolder === `custom/${folder.name}`;
                        
                        return (
                          <TouchableOpacity
                            key={folder.name}
                            style={[s.option, isCurrent && s.optionDisabled]}
                            onPress={() => !isCurrent && handleMoveToCustom(folder.name)}
                            disabled={isCurrent}
                            testID={`move-to-custom-${folder.name}`}
                          >
                            <View style={s.optionIcon}>
                              <Ionicons
                                name="folder"
                                size={24}
                                color={isCurrent ? '#ccc' : '#6A5ACD'}
                              />
                            </View>
                            <View style={s.optionContent}>
                              <Text style={[s.optionText, isCurrent && s.optionTextDisabled]}>
                                {folder.name}
                              </Text>
                              <Text style={s.optionCount}>
                                {folder.filesCount} archivo{folder.filesCount !== 1 ? 's' : ''}
                              </Text>
                            </View>
                            {isCurrent && (
                              <Text style={s.currentBadge}>Actual</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FCFCF8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4D3527',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 40,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 12,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4D3527',
    marginBottom: 12,
  },
  addBtn: {
    padding: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4D3527',
    marginBottom: 2,
  },
  optionTextDisabled: {
    color: '#999',
  },
  optionCount: {
    fontSize: 12,
    color: '#999',
  },
  currentBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A5ACD',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  createBtn: {
    backgroundColor: '#3E7D75',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});
