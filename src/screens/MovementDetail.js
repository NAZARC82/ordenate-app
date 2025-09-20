// src/screens/MovementDetail.js
import React, { useMemo, useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MovimientosContext } from '../state/MovimientosContext';
import { fmtCurrency, fmtDateTime } from '../utils/fmt';
import ReminderSheet from '../components/ReminderSheet';

const H = Dimensions.get('window').height;

export default function MovementDetail() {
  const route = useRoute();
  const nav = useNavigation();
  const { movimiento } = route.params || {}; // Cambio: usar 'movimiento' en lugar de 'id'
  const { movimientos } = useContext(MovimientosContext);

  // Si viene 'movimiento' directo, lo usamos; si no, buscamos por ID
  const item = useMemo(() => {
    if (movimiento) return movimiento;
    // Fallback para compatibilidad si viene 'id'
    const { id } = route.params || {};
    return movimientos?.find(i => i.id === id) || null;
  }, [movimiento, movimientos, route.params]);

  // Estado de "Desde/Hasta" elegido para el aviso
  const [edge, setEdge] = useState('to'); // 'from' | 'to'
  // controla el modal
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderDate, setReminderDate] = useState(null);
  const [fromReminder, setFromReminder] = useState(null); // Date o null
  const [toReminder, setToReminder] = useState(null);     // Date o null
  // fecha y hora elegidas dentro del modal
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  // Anticipación (lo dejamos preparado; si no lo necesitas hoy, déjalo fijo en 60)
  const [leadMin, setLeadMin] = useState(60);

  if (!item) {
    return (
      <View style={s.container}>
        <Text>Movimiento no encontrado.</Text>
      </View>
    );
  }

  // Helpers
  const combinedDateTime = useMemo(() => {
    const d = new Date(date);
    d.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return d;
  }, [date, time]);

  const openFrom = () => setReminderOpen(true);
  const openTo   = () => setReminderOpen(true);
  const closeSheet = () => setReminderOpen(false);

  const handleSave = (finalDate) => {
    if (edge === 'from') setFromReminder(finalDate);
    if (edge === 'to') setToReminder(finalDate);
    // (opcional) aquí podés programar la notificación con expo-notifications
    closeSheet();
  };

  // Helper para mostrar nota limpia (igual que en HistoryPanel)
  const displayNota = (m) => (m.nota && m.nota.trim()) || (m.concepto && m.concepto.trim()) || 'Movimiento';
  
  // Fecha consistente en formato dd/mm/aaaa
  const dateLabel = item.fecha
    ? new Date(item.fecha).toLocaleDateString('es-UY', { day:'2-digit', month:'2-digit', year:'numeric' })
    : '—';

  return (
    <View style={s.container}>
      <Text style={s.title}>{displayNota(item)}</Text>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        bounces
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta resumen */}
        <View style={s.card}>
          <Text style={s.muted}>Tipo: {item.tipo === 'pago' ? 'Pago' : 'Cobro'}</Text>
          <Text style={s.muted}>Fecha: {dateLabel}</Text>
          <Text style={s.amount}>{fmtCurrency(item.monto)}</Text>
        </View>

        {/* Toggle Desde / Hasta */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <TouchableOpacity onPress={openFrom} style={chip()}>
            <Ionicons name="notifications-outline" size={16} color="#222" />
            <Text style={chipTxt()}>
              {fromReminder ? `Desde: ${fmtDateTime(fromReminder, true)}` : 'Desde'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={openTo} style={chip()}>
            <Ionicons name="notifications-outline" size={16} color="#222" />
            <Text style={chipTxt()}>
              {toReminder ? `Hasta: ${fmtDateTime(toReminder, true)}` : 'Hasta'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fecha seleccionada (se refleja aquí) */}
        <View style={[s.badgeLarge]}>
          <Text style={s.badgeLargeTxt}>
            {edge === 'from' ? 'Desde' : 'Hasta'}: {fmtDateTime(combinedDateTime, true)}
          </Text>
        </View>

        {/* Botón para abrir Sheet */}
        <TouchableOpacity style={s.primaryBtn} activeOpacity={0.8} onPress={() => setReminderOpen(true)}>
          <Ionicons name="calendar-outline" size={18} />
          <Text style={s.primaryBtnTxt}>Elegir fecha y hora</Text>
        </TouchableOpacity>

        {/* Opcional: anticipación rápida */}
        <Text style={[s.sectionTitle, { marginTop: 16 }]}>Avisar con</Text>
        <View style={s.rowWrap}>
          {[15, 60, 180, 1440].map(m => (
            <TouchableOpacity
              key={m}
              style={[s.pill, leadMin === m && s.pillActive]}
              onPress={() => setLeadMin(m)}
            >
              <Ionicons name="time-outline" size={14} />
              <Text style={s.pillTxt}>
                {m >= 60 ? `${m / 60} h antes` : `${m} min antes`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ReminderSheet
        visible={reminderOpen}
        initialDate={reminderDate ?? new Date()}
        onClose={() => setReminderOpen(false)}
        onSave={(finalDate) => {
          setReminderDate(finalDate);
          setReminderOpen(false);
          console.log('Guardado:', finalDate.toISOString());
        }}
      />
    </View>
  );
}

const chip = () => ({
  flexDirection: 'row', alignItems: 'center', gap: 6,
  paddingHorizontal: 12, paddingVertical: 8,
  borderRadius: 10, backgroundColor: '#e9eef5'
});
const chipTxt = () => ({ fontWeight: '600', color: '#222' });

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF7', paddingHorizontal: 18, paddingTop: 12 },
  title: { fontSize: 32, fontWeight: '800', color: '#111', marginBottom: 10 },

  card: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e7e7e2',
    padding: 14, marginBottom: 12,
  },
  muted: { color: '#666', fontSize: 14, marginBottom: 4 },
  amount: { fontSize: 24, fontWeight: '800', marginTop: 6 },

  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  toggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#e9eef5',
  },
  toggleActive: { backgroundColor: '#d8e9ff' },
  toggleTxt: { fontWeight: '700', color: '#111' },

  badgeLarge: {
    backgroundColor: '#e9eef5', paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 14, marginBottom: 12,
  },
  badgeLargeTxt: { fontWeight: '700', color: '#111' },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#111', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  primaryBtnTxt: { color: '#fff', fontWeight: '700' },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#444', marginBottom: 6 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eef1f5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  pillActive: { backgroundColor: '#d7eaff' },
  pillTxt: { fontWeight: '600', color: '#111' },

  // Sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // altura máxima para que quepa fecha + hora
    maxHeight: H * 0.7,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,          // sube un poquito todo
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 14,
  },

  handleArea: { paddingTop: 8, paddingBottom: 6 },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#d9d9de',
  },

  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  section: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 6 },

  // Action buttons styles
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 6,
    paddingBottom: 4,
  },

  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },

  btnGhost: { backgroundColor: '#f1f1f4' },
  btnGhostTxt: { color: '#333', fontWeight: '600' },

  btnPrimary: { backgroundColor: '#e5ffe9' },
  btnPrimaryTxt: { color: '#0a7f42', fontWeight: '700' },

  // Nuevos estilos para los pickers
  datePicker: { width: '100%' },
  timePicker: { width: '100%', height: 200 }, // más alto para que el spinner se vea entero

  // truco para el umbral del swipe (propiedad temporal)
  _startY: 0,
});
