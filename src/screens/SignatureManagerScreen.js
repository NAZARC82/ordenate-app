// src/screens/SignatureManagerScreen.js
// Pantalla independiente para gestionar firmas

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import SignatureCapture from '../components/SignatureCapture';
import {
  loadSignatureConfig,
  saveSignature,
  deleteSignature,
  updateDefaultMeta,
  generateSignatureOptions
} from '../utils/signatureStorage';
import { formatDate } from '../utils/format';

export default function SignatureManagerScreen() {
  const navigation = useNavigation();
  
  // Estados
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [captureVisible, setCaptureVisible] = useState(false);
  const [captureType, setCaptureType] = useState('cliente');
  
  // Estados para edición de metadatos
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({
    lugar: '',
    clienteNombre: '',
    responsableNombre: '',
    firmaRequerida: true
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const loadedConfig = await loadSignatureConfig();
      setConfig(loadedConfig);
      setMetaForm({
        lugar: loadedConfig.defaultMeta.lugar || '',
        clienteNombre: loadedConfig.defaultMeta.clienteNombre || '',
        responsableNombre: loadedConfig.defaultMeta.responsableNombre || '',
        firmaRequerida: loadedConfig.defaultMeta.firmaRequerida ?? true
      });
    } catch (error) {
      console.error('Error cargando configuración:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración de firmas');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignature = async (signatureData) => {
    const result = await saveSignature(captureType, signatureData);
    if (result.success) {
      Alert.alert('Éxito', `Firma de ${captureType} guardada correctamente`);
      loadConfig(); // Recargar configuración
    } else {
      Alert.alert('Error', `No se pudo guardar la firma: ${result.error}`);
    }
  };

  const handleDeleteSignature = (type) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Está seguro de que desea eliminar la firma de ${type}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteSignature(type);
            if (result.success) {
              Alert.alert('Éxito', `Firma de ${type} eliminada`);
              loadConfig();
            } else {
              Alert.alert('Error', `No se pudo eliminar la firma: ${result.error}`);
            }
          }
        }
      ]
    );
  };

  const handleSaveMeta = async () => {
    const result = await updateDefaultMeta(metaForm);
    if (result.success) {
      Alert.alert('Éxito', 'Configuración guardada');
      setEditingMeta(false);
      loadConfig();
    } else {
      Alert.alert('Error', `No se pudo guardar: ${result.error}`);
    }
  };

  const openCaptureModal = (type) => {
    setCaptureType(type);
    setCaptureVisible(true);
  };

  const renderSignatureCard = (type, signature, title) => (
    <View style={styles.signatureCard}>
      <View style={styles.signatureCardHeader}>
        <Text style={styles.signatureCardTitle}>{title}</Text>
        <View style={styles.signatureCardActions}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => openCaptureModal(type)}
          >
            <Ionicons 
              name={signature ? "pencil" : "add"} 
              size={20} 
              color="#3E7D75" 
            />
          </TouchableOpacity>
          {signature && (
            <TouchableOpacity 
              style={[styles.iconButton, styles.deleteButton]} 
              onPress={() => handleDeleteSignature(type)}
            >
              <Ionicons name="trash" size={20} color="#E74C3C" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {signature ? (
        <View style={styles.signaturePreview}>
          <Image 
            source={{ uri: signature.dataURL }} 
            style={styles.signatureImage}
            resizeMode="contain"
          />
          <View style={styles.signatureInfo}>
            <Text style={styles.signatureName}>{signature.name}</Text>
            <Text style={styles.signatureDate}>
              Guardada: {formatDate(new Date(signature.timestamp).toISOString())}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.noSignature}>
          <Ionicons name="create-outline" size={48} color="#CCC" />
          <Text style={styles.noSignatureText}>Sin firma guardada</Text>
          <Text style={styles.noSignatureSubtext}>Toque + para agregar</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Cargando configuración...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestor de Firmas</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Configuración General */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚙️ Configuración General</Text>
            <TouchableOpacity 
              onPress={() => setEditingMeta(!editingMeta)}
              style={styles.editButton}
            >
              <Ionicons 
                name={editingMeta ? "checkmark" : "create"} 
                size={20} 
                color={editingMeta ? "#27AE60" : "#3E7D75"} 
              />
            </TouchableOpacity>
          </View>
          
          {editingMeta ? (
            <View style={styles.metaForm}>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Lugar por defecto</Text>
                <TextInput
                  style={styles.formInput}
                  value={metaForm.lugar}
                  onChangeText={(text) => setMetaForm(prev => ({ ...prev, lugar: text }))}
                  placeholder="Ej: Montevideo, Uruguay"
                />
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Nombre del cliente</Text>
                <TextInput
                  style={styles.formInput}
                  value={metaForm.clienteNombre}
                  onChangeText={(text) => setMetaForm(prev => ({ ...prev, clienteNombre: text }))}
                  placeholder="Ej: Cliente"
                />
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Nombre del responsable</Text>
                <TextInput
                  style={styles.formInput}
                  value={metaForm.responsableNombre}
                  onChangeText={(text) => setMetaForm(prev => ({ ...prev, responsableNombre: text }))}
                  placeholder="Ej: Responsable"
                />
              </View>
              
              <View style={[styles.formRow, styles.switchRow]}>
                <Text style={styles.formLabel}>Firma requerida por defecto</Text>
                <Switch
                  value={metaForm.firmaRequerida}
                  onValueChange={(value) => setMetaForm(prev => ({ ...prev, firmaRequerida: value }))}
                  trackColor={{ false: '#E0E0E0', true: '#3E7D75' }}
                />
              </View>
              
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveMeta}>
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.metaDisplay}>
              <Text style={styles.metaText}>📍 {config?.defaultMeta?.lugar || 'No configurado'}</Text>
              <Text style={styles.metaText}>👤 Cliente: {config?.defaultMeta?.clienteNombre || 'No configurado'}</Text>
              <Text style={styles.metaText}>👔 Responsable: {config?.defaultMeta?.responsableNombre || 'No configurado'}</Text>
              <Text style={styles.metaText}>
                ✅ Firma requerida: {config?.defaultMeta?.firmaRequerida ? 'Sí' : 'No'}
              </Text>
            </View>
          )}
        </View>

        {/* Firmas Guardadas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🖋️ Firmas Guardadas</Text>
          
          {renderSignatureCard(
            'cliente', 
            config?.clienteSignature, 
            '👤 Firma del Cliente'
          )}
          
          {renderSignatureCard(
            'responsable', 
            config?.responsableSignature, 
            '👔 Firma del Responsable'
          )}
        </View>

        {/* Test de Exportación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Probar Firmas</Text>
          <Text style={styles.sectionSubtitle}>
            Estas opciones generan ejemplos de cómo se verán las firmas en las exportaciones
          </Text>
          
          <View style={styles.testButtons}>
            <TouchableOpacity 
              style={styles.testButton}
              onPress={async () => {
                const options = await generateSignatureOptions('lines');
                Alert.alert('Test - Líneas', JSON.stringify(options.meta, null, 2));
              }}
            >
              <Ionicons name="remove" size={20} color="#3E7D75" />
              <Text style={styles.testButtonText}>Test Líneas</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.testButton}
              onPress={async () => {
                const options = await generateSignatureOptions('images');
                Alert.alert('Test - Imágenes', `Cliente: ${options.images?.cliente ? 'Sí' : 'No'}\nResponsable: ${options.images?.responsable ? 'Sí' : 'No'}`);
              }}
            >
              <Ionicons name="image" size={20} color="#3E7D75" />
              <Text style={styles.testButtonText}>Test Imágenes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal de captura */}
      <SignatureCapture
        visible={captureVisible}
        onClose={() => setCaptureVisible(false)}
        onSave={handleSaveSignature}
        title={`Capturar Firma - ${captureType === 'cliente' ? 'Cliente' : 'Responsable'}`}
        initialName={captureType === 'cliente' ? config?.defaultMeta?.clienteNombre : config?.defaultMeta?.responsableNombre}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCF8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  editButton: {
    padding: 8,
  },
  metaDisplay: {
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  metaForm: {
    gap: 16,
  },
  formRow: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#3E7D75',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signatureCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  signatureCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  signatureCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  signatureCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  deleteButton: {
    backgroundColor: '#FFF5F5',
  },
  signaturePreview: {
    alignItems: 'center',
    gap: 12,
  },
  signatureImage: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  signatureInfo: {
    alignItems: 'center',
    gap: 4,
  },
  signatureName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  signatureDate: {
    fontSize: 12,
    color: '#666',
  },
  noSignature: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  noSignatureText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  noSignatureSubtext: {
    fontSize: 12,
    color: '#999',
  },
  testButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3E7D75',
    borderRadius: 8,
    backgroundColor: '#F8FFFE',
  },
  testButtonText: {
    color: '#3E7D75',
    fontSize: 14,
    fontWeight: '500',
  },
});