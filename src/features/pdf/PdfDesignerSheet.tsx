// src/features/pdf/PdfDesignerSheet.tsx
// Modal de diseño visual de PDF con preview en tiempo real

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// @ts-ignore - Slider viene con React Native por defecto
import Slider from '@react-native-community/slider';

import { usePdfPrefs } from './usePdfPrefs';
import { PdfPreferences } from './prefs';

interface PdfDesignerSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply?: () => void;
}

export function PdfDesignerSheet({ visible, onClose, onApply }: PdfDesignerSheetProps) {
  const { prefs, updatePrefs, reset, loading } = usePdfPrefs();
  const [localPrefs, setLocalPrefs] = useState<PdfPreferences>(prefs);

  // Actualizar local cuando cambian prefs externos
  React.useEffect(() => {
    setLocalPrefs(prefs);
  }, [prefs]);

  const handleSave = async () => {
    try {
      await updatePrefs(localPrefs);
      Alert.alert('✓ Guardado', 'Preferencias de PDF actualizadas');
      onApply?.();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar las preferencias');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Restaurar defaults',
      '¿Volver a los colores y opciones originales?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            await reset();
            setLocalPrefs(prefs);
          }
        }
      ]
    );
  };

  const updateLocal = (updates: Partial<PdfPreferences>) => {
    setLocalPrefs(prev => ({ ...prev, ...updates }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#4D3527" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Diseño de PDF</Text>
          <TouchableOpacity onPress={handleReset} style={styles.headerButton}>
            <Ionicons name="refresh" size={22} color="#6A5ACD" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Sección: Intensidad de colores */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Intensidad de Colores</Text>
            <Text style={styles.sectionDesc}>
              Controla qué tan vibrantes se ven los colores en el resumen
            </Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>
                {localPrefs.colorIntensity === 1.0 ? 'Intenso' : 
                 localPrefs.colorIntensity >= 0.7 ? 'Medio' : 'Suave'}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                value={localPrefs.colorIntensity}
                onValueChange={value => updateLocal({ colorIntensity: value })}
                minimumTrackTintColor="#6A5ACD"
                maximumTrackTintColor="#DDD"
                thumbTintColor="#6A5ACD"
              />
            </View>

            {/* Preview visual */}
            <View style={[
              styles.previewBox,
              { 
                backgroundColor: localPrefs.accentColor,
                opacity: 0.45 + (localPrefs.colorIntensity * 0.5)
              }
            ]}>
              <Text style={styles.previewText}>Preview del resumen</Text>
            </View>
          </View>

          {/* Sección: Tonalidad de negativos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tonalidad de Rojos (Pagos)</Text>
            <Text style={styles.sectionDesc}>
              Elige qué tan fuerte se ve el rojo en montos negativos
            </Text>

            <View style={styles.optionsRow}>
              {(['strong', 'medium', 'soft'] as const).map(level => {
                const colors = { strong: '#C0392B', medium: '#E74C3C', soft: '#EC7063' };
                const labels = { strong: 'Fuerte', medium: 'Medio', soft: 'Suave' };
                const selected = localPrefs.negativeRed === level;

                return (
                  <TouchableOpacity
                    key={level}
                    style={[styles.optionButton, selected && styles.optionButtonSelected]}
                    onPress={() => updateLocal({ negativeRed: level })}
                  >
                    <View style={[styles.colorDot, { backgroundColor: colors[level] }]} />
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {labels[level]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sección: Opciones de contenido */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contenido del PDF</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Mostrar cantidad de movimientos</Text>
              <Switch
                value={localPrefs.showMovementCount}
                onValueChange={val => updateLocal({ showMovementCount: val })}
                trackColor={{ false: '#CCC', true: '#6A5ACD' }}
                thumbColor={Platform.OS === 'android' ? '#FFF' : undefined}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Mostrar fecha de generación</Text>
              <Switch
                value={localPrefs.showGenerationDate}
                onValueChange={val => updateLocal({ showGenerationDate: val })}
                trackColor={{ false: '#CCC', true: '#6A5ACD' }}
                thumbColor={Platform.OS === 'android' ? '#FFF' : undefined}
              />
            </View>
          </View>

          {/* Nota informativa */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#6A5ACD" />
            <Text style={styles.infoText}>
              Los cambios se aplicarán la próxima vez que exportes un PDF
            </Text>
          </View>
        </ScrollView>

        {/* Footer con botones */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="checkmark" size={20} color="#FFF" />
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCF8'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  headerButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4D3527'
  },
  content: {
    flex: 1,
    paddingHorizontal: 16
  },
  section: {
    marginTop: 24,
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4D3527',
    marginBottom: 4
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  sliderContainer: {
    marginBottom: 12
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6A5ACD',
    marginBottom: 8,
    textAlign: 'center'
  },
  slider: {
    width: '100%',
    height: 40
  },
  previewBox: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 8
  },
  previewText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700'
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF'
  },
  optionButtonSelected: {
    borderColor: '#6A5ACD',
    backgroundColor: '#F5F3FF'
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 6
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666'
  },
  optionTextSelected: {
    color: '#6A5ACD'
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  switchLabel: {
    fontSize: 15,
    color: '#4D3527',
    flex: 1
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F3FF',
    padding: 16,
    borderRadius: 12,
    marginVertical: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#6A5ACD'
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666'
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#6A5ACD'
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF'
  }
});
