// src/components/Calendar/CalendarDropdown.js
import React, { useState } from 'react';
import { View, Text, Pressable, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

function fmt(date) {
  try {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch { return ''; }
}

export default function CalendarDropdown({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  allowClear = true,
  showInlineActions = true,
  // modo controlado (opcional)
  isOpen,
  onRequestOpen,
  onRequestClose,
}) {
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const controlled = typeof isOpen === 'boolean';
  const open = controlled ? isOpen : openUncontrolled;
  const [temp, setTemp] = useState(value ? new Date(value) : new Date());

  const show = () => {
    setTemp(value ? new Date(value) : new Date());
    controlled ? onRequestOpen?.() : setOpenUncontrolled(true);
  };
  const hide = () => (controlled ? onRequestClose?.() : setOpenUncontrolled(false));

  const onPick = (_, date) => {
    if (Platform.OS !== 'ios') {
      hide();
      if (date) onChange?.(date.toISOString());
    } else {
      if (date) setTemp(date);
    }
  };

  const confirmIOS = () => {
    hide();
    if (temp) onChange?.(temp.toISOString());
  };

  const cancelIOS = () => {
    hide(); // no cambia el valor
  };

  const clear = () => onChange?.(null);

  return (
    <View>
      <Pressable style={styles.input} onPress={show}>
        <Text style={styles.inputText}>
          {value ? fmt(value) : placeholder}
        </Text>
        {allowClear && value ? (
          <TouchableOpacity onPress={clear} hitSlop={8}>
            <Ionicons name="close" size={18} color="#4D3527" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="calendar" size={18} color="#4D3527" />
        )}
      </Pressable>

      {open && (
        <View>
          <DateTimePicker
            value={temp || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            locale="es-UY"
            onChange={onPick}
          />
          {Platform.OS === 'ios' && showInlineActions && (
            <View style={styles.iosActions}>
              <TouchableOpacity style={[styles.iosBtn, styles.iosCancel]} onPress={cancelIOS}>
                <Text style={styles.iosCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iosBtn, styles.iosOk]} onPress={confirmIOS}>
                <Text style={styles.iosOkText}>Listo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0D8CC',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: { color: '#4D3527', fontSize: 16 },
  iosActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  iosBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  iosCancel: { backgroundColor: '#EEE9E2' },
  iosOk: { backgroundColor: '#3E7D75' },
  iosCancelText: { color: '#4D3527', fontWeight: '600' },
  iosOkText: { color: '#F5F1E8', fontWeight: '600' },
});