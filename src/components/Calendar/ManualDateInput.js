// src/components/Calendar/ManualDateInput.js
import React, { useMemo, useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function toDisplay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function toISO(ddmmyyyy) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy);
  if (!m) return null;
  const [_, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (isNaN(d) || d.getFullYear() != Number(yyyy) || d.getMonth() != Number(mm) - 1 || d.getDate() != Number(dd)) {
    return null;
  }
  return d.toISOString();
}

export default function ManualDateInput({ value, onChange, placeholder = 'dd/mm/aaaa' }) {
  const [text, setText] = useState(toDisplay(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setText(toDisplay(value));
    setInvalid(false);
  }, [value]);

  const onChangeText = (t) => {
    // solo dígitos y /
    t = t.replace(/[^\d]/g, '');
    // auto slash
    if (t.length > 2) t = `${t.slice(0,2)}/${t.slice(2)}`;
    if (t.length > 5) t = `${t.slice(0,5)}/${t.slice(5,9)}`;
    t = t.slice(0, 10);
    setText(t);
    setInvalid(false);
  };

  const commit = () => {
    if (!text) { onChange?.(null); setInvalid(false); return; }
    const iso = toISO(text);
    if (iso) { onChange?.(iso); setInvalid(false); }
    else { setInvalid(true); }
  };

  const clear = () => { setText(''); onChange?.(null); setInvalid(false); };

  return (
    <View style={[styles.wrap, invalid && styles.wrapInvalid]}>
      <TextInput
        value={text}
        onChangeText={onChangeText}
        onBlur={commit}
        placeholder={placeholder}
        keyboardType="number-pad"
        style={styles.input}
        returnKeyType="done"
        onSubmitEditing={commit}
        maxLength={10}
      />
      {text ? (
        <TouchableOpacity onPress={clear} hitSlop={8}>
          <Ionicons name="close" size={18} color="#4D3527" />
        </TouchableOpacity>
      ) : (
        <Ionicons name="calendar" size={18} color="#4D3527" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
  wrapInvalid: { borderColor: '#C62828' },
  input: { flex: 1, color: '#4D3527', fontSize: 16, marginRight: 8 },
});