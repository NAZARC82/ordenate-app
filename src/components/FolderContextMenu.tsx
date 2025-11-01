// src/components/FolderContextMenu.tsx
// FASE 6.4-CORE: Menú contextual para carpetas con opciones de metadatos

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FolderContextMenuProps {
  visible: boolean;
  folderName: string;
  onRename: () => void;
  onChangeColor: () => void;
  onChangeIcon: () => void;
  onClose: () => void;
}

interface MenuOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

export default function FolderContextMenu({
  visible,
  folderName,
  onRename,
  onChangeColor,
  onChangeIcon,
  onClose,
}: FolderContextMenuProps) {
  const options: MenuOption[] = [
    {
      id: 'rename',
      label: 'Renombrar',
      icon: 'create-outline',
      color: '#6A5ACD',
      onPress: () => {
        onClose();
        onRename();
      },
    },
    {
      id: 'color',
      label: 'Cambiar color',
      icon: 'color-palette-outline',
      color: '#3E7D75',
      onPress: () => {
        onClose();
        onChangeColor();
      },
    },
    {
      id: 'icon',
      label: 'Cambiar ícono',
      icon: 'images-outline',
      color: '#FF6B6B',
      onPress: () => {
        onClose();
        onChangeIcon();
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.overlay}>
          <TouchableWithoutFeedback>
            <View style={s.container}>
              {/* Header */}
              <View style={s.header}>
                <View style={s.headerLeft}>
                  <Ionicons name="folder" size={20} color="#6A5ACD" />
                  <Text style={s.title} numberOfLines={1}>
                    {folderName}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Options */}
              <View style={s.options}>
                {options.map((option, index) => (
                  <React.Fragment key={option.id}>
                    <TouchableOpacity
                      style={s.option}
                      onPress={option.onPress}
                      accessibilityLabel={option.label}
                    >
                      <View style={[s.iconCircle, { backgroundColor: `${option.color}15` }]}>
                        <Ionicons name={option.icon} size={20} color={option.color} />
                      </View>
                      <Text style={s.optionLabel}>{option.label}</Text>
                      <Ionicons name="chevron-forward" size={18} color="#CCC" />
                    </TouchableOpacity>
                    {index < options.length - 1 && <View style={s.separator} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  options: {
    padding: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 60,
  },
});
