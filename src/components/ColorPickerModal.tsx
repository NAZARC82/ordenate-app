// src/components/ColorPickerModal.tsx
// FASE 6.4-CORE: Modal para seleccionar color de carpeta

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FOLDER_COLORS, getRandomColor } from '../features/folders/types';
import { setFolderColor } from '../features/folders/metadata.service';
import { showToast, showErrorToast } from '../utils/toast';

interface ColorPickerModalProps {
  visible: boolean;
  folderName: string;
  initialColor?: string;
  onConfirm: (color: string) => void;
  onCancel: () => void;
}

export default function ColorPickerModal({
  visible,
  folderName,
  initialColor,
  onConfirm,
  onCancel,
}: ColorPickerModalProps) {
  const [selectedColor, setSelectedColor] = useState(initialColor || FOLDER_COLORS[0].hex);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selectedColor) {
      showErrorToast('Selecciona un color');
      return;
    }

    setSaving(true);
    
    try {
      await setFolderColor(folderName, selectedColor);
      showToast('✅ Color actualizado');
      onConfirm(selectedColor);
    } catch (error: any) {
      console.error('[ColorPicker] Error setting color:', error);
      showErrorToast(error.message || 'No se pudo guardar, reintentá');
    } finally {
      setSaving(false);
    }
  };

  const handleRandomColor = () => {
    const randomColor = getRandomColor();
    setSelectedColor(randomColor);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={s.overlay}>
        <View style={s.container}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Cambiar color</Text>
            <TouchableOpacity onPress={onCancel} disabled={saving}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={s.previewContainer}>
            <View style={[s.previewSwatch, { backgroundColor: selectedColor }]} />
            <Text style={s.previewText}>{selectedColor}</Text>
          </View>

          {/* Color Grid */}
          <ScrollView style={s.scrollView}>
            <View style={s.grid}>
              {FOLDER_COLORS.map((color) => (
                <TouchableOpacity
                  key={color.hex}
                  style={[
                    s.colorItem,
                    { backgroundColor: color.hex },
                    selectedColor === color.hex && s.colorItemSelected,
                  ]}
                  onPress={() => setSelectedColor(color.hex)}
                  disabled={saving}
                  accessibilityLabel={`Color ${color.name}`}
                >
                  {selectedColor === color.hex && (
                    <Ionicons name="checkmark" size={24} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Random button */}
            <TouchableOpacity
              style={s.randomButton}
              onPress={handleRandomColor}
              disabled={saving}
            >
              <Ionicons name="shuffle" size={20} color="#6A5ACD" />
              <Text style={s.randomButtonText}>Color aleatorio</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Actions */}
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.button, s.cancelButton]}
              onPress={onCancel}
              disabled={saving}
            >
              <Text style={s.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.button, s.confirmButton]}
              onPress={handleConfirm}
              disabled={saving || !selectedColor}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={s.confirmButtonText}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  previewSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  previewText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  scrollView: {
    maxHeight: 400,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  colorItem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorItemSelected: {
    borderColor: '#333',
    borderWidth: 3,
  },
  randomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6A5ACD',
    gap: 8,
  },
  randomButtonText: {
    fontSize: 16,
    color: '#6A5ACD',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#6A5ACD',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
