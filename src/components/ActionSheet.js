import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

const ActionSheet = ({ visible, onClose, fileUri, fileName, mimeType = 'application/pdf' }) => {
  
  // Compartir por WhatsApp
  const handleWhatsAppShare = async () => {
    try {
      if (!fileUri) {
        Alert.alert('Error', 'No hay archivo para compartir');
        return;
      }

      // Usar el sharing nativo que puede detectar WhatsApp
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: `Compartir ${fileName}`,
          UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text',
        });
      }
      
      onClose();
    } catch (error) {
      // Manejar cancelación sin mostrar error
      if (error.code !== 'UserCancel' && !error.message?.includes('cancelled')) {
        console.error('Error al compartir por WhatsApp:', error);
        Alert.alert('Error', 'No se pudo compartir el archivo');
      }
      onClose();
    }
  };

  // Enviar por email
  const handleEmailShare = async () => {
    try {
      if (!fileUri) {
        Alert.alert('Error', 'No hay archivo para compartir');
        return;
      }

      // Usar Share API nativo
      const result = await Share.share({
        title: `Reporte - ${fileName}`,
        message: 'Te adjunto el reporte financiero generado desde Ordenate App.',
        url: fileUri,
      }, {
        subject: `Reporte Financiero - ${fileName}`,
        dialogTitle: 'Enviar por email'
      });

      // Solo cerrar si no fue cancelado
      if (result.action === Share.sharedAction) {
        onClose();
      } else if (result.action === Share.dismissedAction) {
        // Cancelado por el usuario - no mostrar error
        onClose();
      }
      
    } catch (error) {
      // Manejar cancelación sin mostrar error
      if (error.code !== 'UserCancel' && !error.message?.includes('cancelled')) {
        console.error('Error al compartir por email:', error);
        Alert.alert('Error', 'No se pudo enviar el archivo por email');
      }
      onClose();
    }
  };

  // Abrir con otras apps
  const handleOpenWith = async () => {
    try {
      if (!fileUri) {
        Alert.alert('Error', 'No hay archivo para abrir');
        return;
      }

      // Usar sharing que mostrará opciones de apps
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: 'Abrir con...',
          UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert(
          'No disponible',
          'La función de compartir no está disponible en este dispositivo'
        );
      }
      
      onClose();
    } catch (error) {
      // Manejar cancelación sin mostrar error
      if (error.code !== 'UserCancel' && !error.message?.includes('cancelled')) {
        console.error('Error al abrir archivo:', error);
        Alert.alert('Error', 'No se pudo abrir el archivo');
      }
      onClose();
    }
  };

  const actions = [
    {
      id: 'whatsapp',
      title: 'Compartir por WhatsApp',
      icon: 'logo-whatsapp',
      color: '#25D366',
      onPress: handleWhatsAppShare
    },
    {
      id: 'email',
      title: 'Enviar por email',
      icon: 'mail',
      color: '#3498db',
      onPress: handleEmailShare
    },
    {
      id: 'open',
      title: 'Abrir en...',
      icon: 'open',
      color: '#9b59b6',
      onPress: handleOpenWith
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
            <Text style={styles.title}>Compartir archivo</Text>
            <Text style={styles.subtitle}>{fileName}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionItem}
                onPress={action.onPress}
                activeOpacity={0.7}
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
          </View>

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
    maxHeight: '60%',
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