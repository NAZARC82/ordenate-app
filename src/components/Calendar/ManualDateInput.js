// src/components/Calendar/ManualDateInput.js
import React, { useMemo, useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseFechaUsuario } from '../../utils/date';

function toDisplay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

export default function ManualDateInput({ value, onChange, placeholder = 'dd/mm/aaaa' }) {
  const [text, setText] = useState(toDisplay(value));
  const [invalid, setInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setText(toDisplay(value));
    setInvalid(false);
    setErrorMessage('');
  }, [value]);

  const onChangeText = (t) => {
    // Allow digits and slashes
    t = t.replace(/[^\d\/]/g, '');
    
    // Auto-format slashes
    if (t.length > 2 && t[2] !== '/') t = `${t.slice(0,2)}/${t.slice(2)}`;
    if (t.length > 5 && t[5] !== '/') t = `${t.slice(0,5)}/${t.slice(5)}`;
    
    // Limit length
    t = t.slice(0, 10);
    
    setText(t);
    setInvalid(false);
    setErrorMessage('');
  };

  const commit = () => {
    if (!text.trim()) { 
      onChange?.(null); 
      setInvalid(false);
      setErrorMessage('');
      return; 
    }
    
    const result = parseFechaUsuario(text);
    if (result.error) {
      setInvalid(true);
      setErrorMessage(result.error);
    } else {
      // Update text to show complete format
      setText(result.displayValue);
      onChange?.(result.iso);
      setInvalid(false);
      setErrorMessage('');
    }
  };

  const clear = () => { setText(''); onChange?.(null); setInvalid(false); };

  return (
    <View>
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
      {errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
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
  errorText: {
    fontSize: 12,
    color: '#C62828',
    marginTop: 4,
    marginLeft: 4,
  },
});