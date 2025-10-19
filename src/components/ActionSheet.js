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
import * as Print from 'expo-print';
import { presentOpenWithSafely } from '../utils/openWith';
import { deleteRecent } from '../features/documents/registry';

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
    try {
      console.log('[ActionSheet] ========================================');
      console.log('[ActionSheet] handleOpenWith iniciado');
      console.log('[ActionSheet] fileUri:', fileUri);
      console.log('[ActionSheet] mimeType:', mimeType);
      console.log('[ActionSheet] ========================================');
      
      if (!fileUri) {
        Alert.alert('Error', 'No hay archivo para abrir');
        return;
      }

      // Cerrar el ActionSheet primero
      console.log('[ActionSheet] Paso 1: Cerrando ActionSheet...');
      onClose();
      
      console.log('[ActionSheet] Paso 2: Esperando estabilización...');
      // Esperar un momento antes de abrir Share Sheet
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[ActionSheet] Paso 3: Llamando a presentOpenWithSafely...');
      
      // Usar presentOpenWithSafely con modal ya cerrado
      const success = await presentOpenWithSafely({
        uri: fileUri,
        mime: mimeType,
        setModalVisible: undefined // Ya cerramos el modal arriba
      });

      console.log('[ActionSheet] ========================================');
      console.log('[ActionSheet] presentOpenWithSafely resultado:', success);
      console.log('[ActionSheet] ========================================');
      
      if (success) {
        console.log('[ActionSheet] ✓ Archivo compartido exitosamente');
      } else {
        console.log('[ActionSheet] ⚠️ Usuario canceló o error al compartir');
      }
    } catch (error) {
      console.error('[ActionSheet] ❌ Error en handleOpenWith:', error);
      if (error.code !== 'UserCancel' && !error.message?.includes('cancelled')) {
        Alert.alert('Error', `No se pudo abrir el archivo: ${error.message}`);
      }
    }
  };

  // 📄 Ver en visor interno
  const handleViewInternal = async () => {
    try {
      if (!fileUri) {
        Alert.alert('Error', 'No hay archivo para visualizar');
        return;
      }

      if (mimeType === 'application/pdf') {
        // Para PDF, usar Print.printAsync que muestra el PDF en un visor
        await Print.printAsync({ uri: fileUri });
      } else {
        // Para CSV u otros, mostrar alerta con info
        Alert.alert(
          'Vista previa',
          `Archivo: ${fileName}\n\nPara visualizar archivos CSV, usa la opción "Abrir con..." y selecciona una aplicación compatible (Excel, Google Sheets, etc.)`,
          [{ text: 'OK' }]
        );
      }
      
      onClose();
    } catch (error) {
      console.error('[ActionSheet] Error al ver archivo:', error);
      Alert.alert('Error', 'No se pudo abrir el visor de documentos');
      onClose();
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