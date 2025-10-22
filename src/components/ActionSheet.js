import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy'; // Legacy API para leer CSV
import { fileExists } from '../utils/fsExists'; // ✅ API nueva con fallback
import { presentOpenWithSafely, viewInternallySafely } from '../utils/openWith';
import { deleteRecent } from '../features/documents/registry';
import { showToast } from '../utils/toast';

const ActionSheet = ({ 
  visible, 
  onClose, 
  fileUri, 
  fileName, 
  mimeType = 'application/pdf',
  documentId, // ID del documento en Recientes para poder eliminarlo
  navigation // Para navegar a DocumentManager/Diseño
}) => {
  
  // 📂 Abrir con... (Share Sheet nativo)
  const handleOpenWith = async () => {
    // Guardar referencia a onClose para evitar problemas si el componente se desmonta
    const closeModal = onClose;
    
    try {
      if (!fileUri) {
        Alert.alert('Error', 'No hay archivo para abrir');
        return;
      }

      console.log('[ActionSheet] Abrir con...:', { fileUri, mimeType });
      
      // Determinar tipo de archivo
      const kind = mimeType === 'text/csv' ? 'csv' : 
                   mimeType === 'application/zip' ? 'zip' : 
                   'pdf';
      
      console.log('[ActionSheet] Llamando a presentOpenWithSafely con kind:', kind);
      
      // Usar API con cierre de modal integrado
      await presentOpenWithSafely(fileUri, kind, { closeModal });
      
      console.log('[ActionSheet] ✓ presentOpenWithSafely completado');
      
    } catch (error) {
      console.error('[ActionSheet] Error en handleOpenWith:', error);
      Alert.alert(
        'Error al compartir',
        'No se pudo abrir el menú para compartir el archivo. Intenta nuevamente.'
      );
    }
  };

  // 📄 Ver en visor interno
  const handleViewInternal = async () => {
    // Guardar referencia a onClose para evitar problemas si el componente se desmonta
    const closeModal = onClose;
    
    try {
      if (!fileUri) {
        Alert.alert('Error', 'No hay archivo para visualizar');
        return;
      }

      console.log('[ActionSheet] Ver interno:', { fileUri, mimeType });

      // Determinar tipo de archivo
      const kind = mimeType === 'text/csv' ? 'csv' : 
                   mimeType === 'application/zip' ? 'zip' : 
                   'pdf';
      
      console.log('[ActionSheet] Llamando a viewInternallySafely con kind:', kind);
      
      // Usar API con cierre de modal integrado
      await viewInternallySafely(fileUri, kind, { closeModal });
      
      console.log('[ActionSheet] ✓ viewInternallySafely completado');
      
    } catch (error) {
      console.error('[ActionSheet] Error al ver archivo:', error);
      Alert.alert(
        'Error al visualizar',
        'No se pudo abrir el visor del archivo. Intenta nuevamente.'
      );
    }
  };

  // 🗑 Eliminar de Recientes
  const handleDelete = async () => {
    if (!documentId) {
      Alert.alert('Error', 'No se puede eliminar: ID de documento no disponible');
      return;
    }

    Alert.alert(
      '¿Eliminar de Recientes?',
      `Se eliminará "${fileName}" de la lista de documentos recientes.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecent(documentId);
              console.log('[ActionSheet] Documento eliminado de recientes:', documentId);
              Alert.alert('✓', 'Documento eliminado de Recientes');
              onClose();
            } catch (error) {
              console.error('[ActionSheet] Error al eliminar:', error);
              Alert.alert('Error', 'No se pudo eliminar el documento');
            }
          }
        }
      ]
    );
  };

  // 🗑️ Eliminar del dispositivo (archivo físico + registro)
  const handleDeletePhysical = async () => {
    if (!documentId || !fileUri) {
      Alert.alert('Error', 'No se puede eliminar: información incompleta');
      return;
    }

    Alert.alert(
      '⚠️ Eliminar del Dispositivo',
      `Se borrará el archivo "${fileName}" del dispositivo y de Recientes.\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Verificar si el archivo existe
              const exists = await fileExists(fileUri);
              
              if (!exists) {
                console.log('[ActionSheet] Archivo ya no existe, solo limpiando registro');
                showToast('⚠️ El archivo ya no estaba disponible');
                await deleteRecent(documentId);
                onClose();
                return;
              }

              // 2. Eliminar archivo físico
              console.log('[ActionSheet] Eliminando archivo físico:', fileUri);
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
              console.log('[ActionSheet] Archivo físico eliminado');

              // 3. Eliminar de Recientes
              await deleteRecent(documentId);
              console.log('[ActionSheet] Registro eliminado de Recientes');

              showToast('✅ Archivo eliminado del dispositivo');
              onClose();
            } catch (error) {
              console.error('[ActionSheet] Error al eliminar físicamente:', error);
              Alert.alert('Error', 'No se pudo eliminar el archivo del dispositivo');
            }
          }
        }
      ]
    );
  };

  // Acciones disponibles (sin opción de modificar contenido post-export)
  const actions = [
    {
      id: 'openwith',
      title: 'Abrir con...',
      icon: 'share-outline',
      color: '#3E7D75',
      onPress: handleOpenWith,
      show: true
    },
    {
      id: 'view',
      title: 'Ver en visor interno',
      icon: mimeType === 'application/pdf' ? 'document-text' : 'grid',
      color: '#6A5ACD',
      onPress: handleViewInternal,
      show: true
    },
    {
      id: 'delete',
      title: 'Eliminar de Recientes',
      icon: 'trash-outline',
      color: '#E74C3C',
      onPress: handleDelete,
      show: true
    },
    {
      id: 'delete-physical',
      title: 'Eliminar del Dispositivo',
      icon: 'trash-bin',
      color: '#C0392B',
      onPress: handleDeletePhysical,
      show: true
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>📄 {fileName}</Text>
            <Text style={styles.subtitle}>
              {mimeType === 'application/pdf' ? 'Documento PDF' : 'Archivo CSV'}
            </Text>
            <Text style={styles.uri} numberOfLines={1} ellipsizeMode="middle">
              {fileUri}
            </Text>
          </View>

          {/* Actions con Scroll */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.actionsContainer}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
          >
            {actions.filter(a => a.show).map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionItem}
                onPress={action.onPress}
                activeOpacity={0.7}
                testID={`action-${action.id}`}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons 
                    name={action.icon} 
                    size={24} 
                    color={action.color} 
                  />
                </View>
                <Text style={styles.actionText}>{action.title}</Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color="#64748b" 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Cancel Button */}
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouch: {
    flex: 1,
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '80%', // Aumentado de 60% para más contenido
  },
  scrollView: {
    maxHeight: '60%', // Limitar altura del scroll
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  uri: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  cancelButton: {
    marginTop: 12,
    marginHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
});

export default ActionSheet;