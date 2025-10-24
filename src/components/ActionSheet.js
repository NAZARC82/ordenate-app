import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator
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
  navigation, // Para navegar a DocumentManager/Diseño
  onMovePress, // Callback opcional para abrir MoveToSheet
}) => {
  // Estado para prevenir cierre durante operaciones
  const [isProcessing, setIsProcessing] = useState(false);
  
  // ⚠️ CRÍTICO: Resetear estado cuando el modal se abre/cierra
  useEffect(() => {
    if (visible) {
      console.log('[ActionSheet] Modal abierto, reseteando estado');
      setIsProcessing(false); // Resetear estado al abrir
    }
  }, [visible]);
  
  // 📂 Abrir con... (Share Sheet nativo)
  const handleOpenWith = async () => {
    try {
      if (!fileUri) {
        Alert.alert('Error', 'No hay archivo para abrir');
        return;
      }

      setIsProcessing(true); // ⚠️ Bloquear cierre durante operación
      console.log('[ActionSheet] Abrir con...:', { fileUri, mimeType });
      
      // Determinar tipo de archivo
      const kind = mimeType === 'text/csv' ? 'csv' : 
                   mimeType === 'application/zip' ? 'zip' : 
                   'pdf';
      
      console.log('[ActionSheet] Llamando a presentOpenWithSafely con kind:', kind);
      
      // ⚠️ NO pasar closeModal - lo haremos manualmente después
      await presentOpenWithSafely(fileUri, kind);
      
      console.log('[ActionSheet] ✓ presentOpenWithSafely completado');
      
      // ✅ Cerrar modal DESPUÉS de que Share Sheet esté abierto
      // Usar setTimeout para que no interrumpa el Share Sheet
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 500);
      
    } catch (error) {
      console.error('[ActionSheet] Error en handleOpenWith:', error);
      setIsProcessing(false); // ⚠️ Resetear en caso de error
      Alert.alert(
        'Error al compartir',
        'No se pudo abrir el menú para compartir el archivo. Intenta nuevamente.'
      );
    }
  };

  // 📄 Ver en visor interno
  const handleViewInternal = async () => {
    try {
      if (!fileUri) {
        Alert.alert('Error', 'No hay archivo para visualizar');
        return;
      }

      setIsProcessing(true); // ⚠️ Bloquear cierre durante operación
      console.log('[ActionSheet] Ver interno:', { fileUri, mimeType });

      // Determinar tipo de archivo
      const kind = mimeType === 'text/csv' ? 'csv' : 
                   mimeType === 'application/zip' ? 'zip' : 
                   'pdf';
      
      console.log('[ActionSheet] Llamando a viewInternallySafely con kind:', kind);
      
      // ⚠️ NO pasar closeModal - lo haremos manualmente después
      await viewInternallySafely(fileUri, kind);
      
      console.log('[ActionSheet] ✓ viewInternallySafely completado');
      
      // ✅ Cerrar modal DESPUÉS de que visor esté abierto
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 500);
      
    } catch (error) {
      console.error('[ActionSheet] Error al ver archivo:', error);
      setIsProcessing(false); // ⚠️ Resetear en caso de error
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
      id: 'move',
      title: 'Mover a...',
      icon: 'folder-open-outline',
      color: '#8E44AD',
      onPress: () => {
        if (onMovePress) {
          console.log('[ActionSheet] Abriendo MoveToSheet');
          onMovePress();
        } else {
          Alert.alert('Info', 'Función "Mover a..." no disponible en este contexto');
        }
      },
      show: !!onMovePress // Solo mostrar si se provee el callback
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
      onRequestClose={() => {
        // ⚠️ Prevenir cierre si hay operación en curso
        if (!isProcessing) {
          onClose();
        } else {
          console.log('[ActionSheet] Cierre bloqueado: operación en curso');
        }
      }}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={() => {
            // ⚠️ Prevenir cierre accidental si hay operación en curso
            if (!isProcessing) {
              onClose();
            }
          }}
          disabled={isProcessing} // Deshabilitar tap durante procesamiento
        />
        
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>📄 {fileName}</Text>
            <Text style={styles.subtitle}>
              {mimeType === 'application/pdf' ? 'Documento PDF' : 
               mimeType === 'text/csv' ? 'Archivo CSV' :
               mimeType === 'application/zip' ? 'Archivo ZIP' : 'Documento'}
            </Text>
            <Text style={styles.uri} numberOfLines={1} ellipsizeMode="middle">
              {fileUri}
            </Text>
            
            {/* Indicador de procesamiento */}
            {isProcessing && (
              <View style={styles.processingIndicator}>
                <ActivityIndicator size="small" color="#3E7D75" />
                <Text style={styles.processingText}>Procesando...</Text>
              </View>
            )}
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
                style={[
                  styles.actionItem,
                  isProcessing && styles.actionItemDisabled
                ]}
                onPress={action.onPress}
                activeOpacity={0.7}
                testID={`action-${action.id}`}
                disabled={isProcessing} // ⚠️ Deshabilitar durante procesamiento
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons 
                    name={action.icon} 
                    size={24} 
                    color={isProcessing ? '#ccc' : action.color} 
                  />
                </View>
                <Text style={[
                  styles.actionText,
                  isProcessing && styles.actionTextDisabled
                ]}>
                  {action.title}
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={isProcessing ? '#ccc' : '#64748b'} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Cancel Button */}
          <TouchableOpacity 
            style={[
              styles.cancelButton,
              isProcessing && styles.cancelButtonDisabled
            ]}
            onPress={onClose}
            disabled={isProcessing} // ⚠️ No permitir cancelar durante procesamiento
          >
            <Text style={[
              styles.cancelText,
              isProcessing && styles.cancelTextDisabled
            ]}>
              {isProcessing ? 'Procesando...' : 'Cancelar'}
            </Text>
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
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E8F5F3',
    borderRadius: 20,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#3E7D75',
    fontWeight: '600',
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
  actionItemDisabled: {
    opacity: 0.5,
    backgroundColor: '#f1f5f9',
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
  actionTextDisabled: {
    color: '#94a3b8',
  },
  cancelButton: {
    marginTop: 12,
    marginHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  cancelButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#e2e8f0',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  cancelTextDisabled: {
    color: '#94a3b8',
  },
});

export default ActionSheet;