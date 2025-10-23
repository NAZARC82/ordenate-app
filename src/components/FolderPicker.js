// src/components/FolderPicker.js
/**
 * Modal para seleccionar carpeta custom donde guardar exportaciones
 * 
 * Características:
 * - Lista carpetas custom existentes
 * - Crear nueva carpeta inline
 * - Normalización automática de nombres
 * - Devuelve subfolder seleccionado
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listFolders, createFolder, normalizeFolderName } from '../features/documents/folders';

export default function FolderPicker({ visible, onClose, onSelect }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFolders();
    }
  }, [visible]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const all = await listFolders();
      
      // Filtrar solo carpetas custom (no incluir pdf/, csv/, zip/)
      const custom = all.filter(f => f.type === 'custom');
      
      setFolders(custom);
      console.log('[FolderPicker] Carpetas custom cargadas:', custom.length);
    } catch (error) {
      console.error('[FolderPicker] Error cargando carpetas:', error);
      Alert.alert('Error', 'No se pudieron cargar las carpetas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (folderName) => {
    console.log('[FolderPicker] Seleccionado:', folderName);
    onSelect(`custom/${folderName}`);
    onClose();
  };

  const handleCreateNew = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para la carpeta');
      return;
    }

    try {
      setCreating(true);
      
      // Normalizar nombre antes de crear
      const normalized = normalizeFolderName(newFolderName);
      
      console.log('[FolderPicker] Creando carpeta:', { original: newFolderName, normalized });
      
      // Crear carpeta
      const newFolder = await createFolder(normalized);
      
      // Recargar lista
      await loadFolders();
      
      // Resetear input
      setNewFolderName('');
      setShowCreateInput(false);
      
      // Seleccionar automáticamente la carpeta recién creada
      handleSelect(newFolder.name);
      
    } catch (error) {
      console.error('[FolderPicker] Error creando carpeta:', error);
      
      let message = error.message;
      if (message.includes('ya existe')) {
        message = 'Ya existe una carpeta con ese nombre';
      } else if (message.includes('vacío')) {
        message = 'El nombre de la carpeta no puede estar vacío';
      }
      
      Alert.alert('Error', message);
    } finally {
      setCreating(false);
    }
  };

  const renderFolder = ({ item }) => (
    <TouchableOpacity
      style={styles.folderItem}
      onPress={() => handleSelect(item.name)}
    >
      <View style={styles.folderIcon}>
        <Ionicons name="folder" size={24} color="#6A5ACD" />
      </View>
      <View style={styles.folderInfo}>
        <Text style={styles.folderName}>{item.name}</Text>
        <Text style={styles.folderCount}>
          {item.filesCount} archivo{item.filesCount !== 1 ? 's' : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Seleccionar Carpeta</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6A5ACD" />
              <Text style={styles.loadingText}>Cargando carpetas...</Text>
            </View>
          ) : (
            <>
              {/* Lista de carpetas */}
              {folders.length > 0 ? (
                <FlatList
                  data={folders}
                  renderItem={renderFolder}
                  keyExtractor={(item) => item.name}
                  style={styles.list}
                  contentContainerStyle={styles.listContent}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="folder-open-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyTitle}>Sin carpetas personalizadas</Text>
                  <Text style={styles.emptySubtitle}>
                    Crea una carpeta para organizar tus exportaciones
                  </Text>
                </View>
              )}

              {/* Botón "Nueva carpeta" o input */}
              {!showCreateInput ? (
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => setShowCreateInput(true)}
                >
                  <Ionicons name="add-circle" size={24} color="#6A5ACD" />
                  <Text style={styles.createButtonText}>Nueva carpeta...</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.createInputContainer}>
                  <TextInput
                    style={styles.createInput}
                    placeholder="Nombre de la carpeta"
                    value={newFolderName}
                    onChangeText={setNewFolderName}
                    autoFocus
                    maxLength={50}
                  />
                  <TouchableOpacity
                    style={styles.createConfirmButton}
                    onPress={handleCreateNew}
                    disabled={creating}
                  >
                    {creating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.createCancelButton}
                    onPress={() => {
                      setShowCreateInput(false);
                      setNewFolderName('');
                    }}
                  >
                    <Ionicons name="close" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100, // Espacio para botón "Nueva carpeta"
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  folderIcon: {
    marginRight: 12,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  folderCount: {
    fontSize: 13,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6A5ACD',
    marginLeft: 8,
  },
  createInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginRight: 8,
  },
  createConfirmButton: {
    backgroundColor: '#6A5ACD',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  createCancelButton: {
    backgroundColor: '#F5F5F5',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
