// src/components/IconPickerModal.tsx
// FASE 6.4-CORE: Modal para seleccionar ícono de carpeta

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
import { FOLDER_ICONS, DEFAULT_FOLDER_ICON } from '../features/folders/types';
import { setFolderIcon } from '../features/folders/metadata.service';
import { showToast, showErrorToast } from '../utils/toast';

interface IconPickerModalProps {
  visible: boolean;
  folderName: string;
  initialIcon?: string;
  onConfirm: (icon: string) => void;
  onCancel: () => void;
}

export default function IconPickerModal({
  visible,
  folderName,
  initialIcon,
  onConfirm,
  onCancel,
}: IconPickerModalProps) {
  const [selectedIcon, setSelectedIcon] = useState(initialIcon || DEFAULT_FOLDER_ICON);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selectedIcon) {
      showErrorToast('Selecciona un ícono');
      return;
    }

    setSaving(true);
    
    try {
      await setFolderIcon(folderName, selectedIcon);
      showToast('✅ Ícono actualizado');
      onConfirm(selectedIcon);
    } catch (error: any) {
      console.error('[IconPicker] Error setting icon:', error);
      showErrorToast(error.message || 'No se pudo guardar, reintentá');
    } finally {
      setSaving(false);
    }
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
            <Text style={s.title}>Cambiar ícono</Text>
            <TouchableOpacity onPress={onCancel} disabled={saving}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={s.previewContainer}>
            <View style={s.previewIcon}>
              <Ionicons name={selectedIcon as any} size={48} color="#6A5ACD" />
            </View>
            <Text style={s.previewText}>
              {FOLDER_ICONS.find(i => i.name === selectedIcon)?.label || selectedIcon}
            </Text>
          </View>

          {/* Icon Grid */}
          <ScrollView style={s.scrollView}>
            <View style={s.grid}>
              {FOLDER_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon.name}
                  style={[
                    s.iconItem,
                    selectedIcon === icon.name && s.iconItemSelected,
                  ]}
                  onPress={() => setSelectedIcon(icon.name)}
                  disabled={saving}
                  accessibilityLabel={`Ícono ${icon.label}`}
                >
                  <Ionicons
                    name={icon.name as any}
                    size={32}
                    color={selectedIcon === icon.name ? '#6A5ACD' : '#666'}
                  />
                  <Text style={[
                    s.iconLabel,
                    selectedIcon === icon.name && s.iconLabelSelected,
                  ]}>
                    {icon.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
              disabled={saving || !selectedIcon}
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
  previewIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
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
  iconItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 8,
  },
  iconItemSelected: {
    borderColor: '#6A5ACD',
    backgroundColor: '#F0EBFF',
  },
  iconLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  iconLabelSelected: {
    color: '#6A5ACD',
    fontWeight: '600',
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
