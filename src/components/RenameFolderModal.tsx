// src/components/RenameFolderModal.tsx
// FASE 6.4-CORE: Modal para renombrar carpeta con validación en tiempo real

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalizeFolderName } from '../features/documents/folders';
import { renameFolderMetadata } from '../features/folders/metadata.service';
import { showToast, showErrorToast } from '../utils/toast';

interface RenameFolderModalProps {
  visible: boolean;
  currentName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

const MAX_LENGTH = 48;
const INVALID_CHARS = /[<>:"/\\|?*]/g;

export default function RenameFolderModal({
  visible,
  currentName,
  onConfirm,
  onCancel,
}: RenameFolderModalProps) {
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset al abrir modal
  useEffect(() => {
    if (visible) {
      setNewName(currentName);
      setError(null);
    }
  }, [visible, currentName]);

  // Validación en tiempo real
  const validateName = (name: string): string | null => {
    const trimmed = name.trim();
    
    if (!trimmed) {
      return 'El nombre no puede estar vacío';
    }

    if (trimmed.length > MAX_LENGTH) {
      return `Máximo ${MAX_LENGTH} caracteres`;
    }

    if (INVALID_CHARS.test(trimmed)) {
      return 'Caracteres inválidos: < > : " / \\ | ? *';
    }

    const normalized = normalizeFolderName(trimmed);
    const currentNormalized = normalizeFolderName(currentName);
    
    if (normalized === currentNormalized) {
      return 'El nombre es igual al actual';
    }

    return null;
  };

  const handleTextChange = (text: string) => {
    setNewName(text);
    setError(validateName(text));
  };

  const handleConfirm = async () => {
    const trimmed = newName.trim();
    const validationError = validateName(trimmed);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      await renameFolderMetadata(currentName, trimmed);
      showToast('✅ Carpeta renombrada');
      onConfirm(trimmed);
    } catch (error: any) {
      console.error('[RenameFolderModal] Error renaming:', error);
      showErrorToast(error.message || 'No se pudo renombrar, reintentá');
    } finally {
      setSaving(false);
    }
  };

  const isValid = !error && newName.trim().length > 0;
  const charCount = newName.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.container}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Renombrar carpeta</Text>
            <TouchableOpacity onPress={onCancel} disabled={saving}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={s.inputContainer}>
            <Text style={s.label}>Nombre actual</Text>
            <Text style={s.currentName}>{currentName}</Text>

            <Text style={[s.label, { marginTop: 16 }]}>Nuevo nombre</Text>
            <TextInput
              style={[s.input, error && s.inputError]}
              value={newName}
              onChangeText={handleTextChange}
              placeholder="Ingresá el nuevo nombre"
              maxLength={MAX_LENGTH}
              autoFocus
              editable={!saving}
              selectTextOnFocus
            />

            {/* Character counter */}
            <View style={s.counterRow}>
              <Text style={s.counter}>
                {charCount}/{MAX_LENGTH}
              </Text>
            </View>

            {/* Error message */}
            {error && (
              <View style={s.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#E53E3E" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* Info */}
            <View style={s.infoContainer}>
              <Ionicons name="information-circle-outline" size={16} color="#666" />
              <Text style={s.infoText}>
                Se actualizarán metadatos (color, ícono)
              </Text>
            </View>
          </View>

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
              style={[
                s.button,
                s.confirmButton,
                (!isValid || saving) && s.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!isValid || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={s.confirmButtonText}>Renombrar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  inputContainer: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  currentName: {
    fontSize: 16,
    color: '#333',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  input: {
    fontSize: 16,
    color: '#333',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  inputError: {
    borderColor: '#E53E3E',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  counter: {
    fontSize: 12,
    color: '#999',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEE',
    borderRadius: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#E53E3E',
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
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
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
