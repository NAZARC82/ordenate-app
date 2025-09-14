// src/screens/HistoryChips.js
console.log('MONTÓ HistoryChips ✅');
import { useState, useMemo, useEffect, useCallback } from "react";
import { ScrollView, TouchableOpacity, View, Text, StyleSheet, FlatList, Alert, Platform, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useMovimientos } from "../state/MovimientosContext";
import { fmtCurrency, fmtDateTime } from "../utils/fmt";
import * as Notifications from 'expo-notifications';

export default function HistoryChips() {
  const insets = useSafeAreaInsets();                       // 👈 agrega esto
  const { items, clearAll, removeById } = useMovimientos();

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    })();
  }, []);

  // Filtro por concepto (nombre del movimiento)
  const [conceptoFilter, setConceptoFilter] = useState(null);

  // Al salir de la pantalla, limpiamos el concepto para que no quede "pegado"
  useFocusEffect(
    useCallback(() => {
      return () => setConceptoFilter(null);
    }, [])
  );

  const [from, setFrom]   = useState(null);
  const [to, setTo]       = useState(null);
  
  // === PICKER DE FECHAS ===
  const [picker, setPicker] = useState({ open: false, type: null });

  const openPicker = (type) => {
    setPicker({ open: true, type });   // type = "from" | "to"
  };

  const closePicker = () => {
    setPicker({ open: false, type: null });
  };

  const onPick = (_e, date) => {
    if (!date) return;
    const d = new Date(date);

    if (picker.type === "from") {
      d.setHours(0, 0, 0, 0);      // comienzo del día
      setFrom(d);
    }
    if (picker.type === "to") {
      d.setHours(23, 59, 59, 999); // fin del día
      setTo(d);
    }
    closePicker();
  };

  // === AVISOS (sheet inferior) ===
  const [reminderOpen, setReminderOpen] = useState(null); // 'from' | 'to' | null
  const [reminderLeadMin, setReminderLeadMin] = useState(60); // cuánto antes
  const [reminderTime, setReminderTime] = useState(new Date()); // hora del aviso

  // Avisos guardados para mostrar en los chips
  const [reminders, setReminders] = useState({
    from: null,   // { time: Date, leadMin: number }
    to: null,     // { time: Date, leadMin: number }
  });

  const openReminder  = (target) => setReminderOpen(target);   // target: 'from' | 'to'
  const closeReminder = () => setReminderOpen(null);

  function reminderLabelFor(edge) {
    const r = reminders[edge];
    if (!r) return 'Aviso';
    const h = r.time.getHours().toString().padStart(2,'0');
    const m = r.time.getMinutes().toString().padStart(2,'0');
    const lead =
      r.leadMin === 15   ? '15 min antes' :
      r.leadMin === 60   ? '1 h antes'    :
      r.leadMin === 180  ? '3 h antes'    :
      r.leadMin === 1440 ? '24 h antes'   :
      `${r.leadMin} min antes`;
    return `${lead} • ${h}:${m}`;
  }

  const quitarFiltro = () => { setFrom(null); setTo(null); };

  // DATA filtrada (concepto + fechas)
  const data = useMemo(() => {
    return items.filter(i => {
      const d = new Date(i.fecha);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (conceptoFilter && i.concepto !== conceptoFilter) return false; // <- NUEVO
      return true;
    });
  }, [items, from, to, conceptoFilter]);

  const total = useMemo(
    () => data.reduce((acc, i) => acc + (i.tipo === "cobro" ? i.monto : -i.monto), 0),
    [data]
  );

  async function scheduleReminder(edge) {
    const base = edge === 'from' ? from : to;
    if (!base) return;

    const withTime = new Date(base);
    withTime.setHours(reminderTime.getHours(), reminderTime.getMinutes(), 0, 0);

    const triggerDate = new Date(withTime.getTime() - reminderLeadMin * 60 * 1000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Recordatorio',
        body: `${edge === 'from' ? 'Desde' : 'Hasta'}: ${fmtDateTime(withTime, true)} (${reminderLeadMin} min antes)`,
      },
      trigger: triggerDate,
    });

    setReminders(prev => ({
      ...prev,
      [edge]: { time: new Date(reminderTime), leadMin: reminderLeadMin },
    }));

    closeReminder();
  }

  console.log('MONTÓ HistoryChips ✅'); // 👈 verificación

  return (
    <View style={[s.container, { paddingTop: Math.max(12, insets.top + 6) }]}>
      <Text style={s.title}>Historial</Text>

      {/* TOTAL (fila 1) */}
      <View style={s.totalBox}>
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={[s.totalValue, { color: total >= 0 ? "#0a7f42" : "#a00" }]}>
            {fmtCurrency(Math.abs(total))}{total < 0 ? " (neto a pagar)" : ""}
          </Text>
        </View>

        {/* CHIPS (fila 2) */}
        {/* fila de chips ACTIVOS */}
        <View style={s.totalChipsRow}>
          {conceptoFilter && (
            <TouchableOpacity style={s.chipSm} onPress={() => setConceptoFilter(null)}>
              <Text style={s.chipSmTxt}>{conceptoFilter}  ✕</Text>
            </TouchableOpacity>
          )}
          {from && (
            <TouchableOpacity style={s.chipSm} onPress={() => setFrom(null)}>
              <Text style={s.chipSmTxt}>Desde: {fmtDateTime(from, true)}  ✕</Text>
            </TouchableOpacity>
          )}
          {to && (
            <TouchableOpacity style={s.chipSm} onPress={() => setTo(null)}>
              <Text style={s.chipSmTxt}>Hasta: {fmtDateTime(to, true)}  ✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* botones de acción */}
        <View style={s.totalChipsRow}>
          {/* Aviso para DESDE */}
          <TouchableOpacity
            style={s.chipBtn}
            onPress={() => {
              if (from) {
                openReminder('from');        // ya hay fecha: abre el sheet de aviso
              } else {
                openPicker('from');          // no hay fecha: primero pedimos la fecha
              }
            }}
          >
            <Ionicons name="notifications-outline" size={14} color="#222" />
            <Text style={s.chipBtnTxt}>
              {from ? reminderLabelFor('from') : 'Aviso'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.chipBtn} onPress={() => openPicker("from")}>
            <Ionicons name="calendar-outline" size={14} color="#222" />
            <Text style={s.chipBtnTxt}>Desde</Text>
          </TouchableOpacity>
          
          {/* HASTA (fecha) */}
          <TouchableOpacity style={s.chipBtn} onPress={() => openPicker("to")}>
            <Ionicons name="calendar-outline" size={14} color="#222" />
            <Text style={s.chipBtnTxt}>Hasta</Text>
          </TouchableOpacity>

          {/* Aviso para HASTA */}
          <TouchableOpacity
            style={s.chipBtn}
            onPress={() => {
              if (to) {
                openReminder('to');
              } else {
                openPicker('to');
              }
            }}
          >
            <Ionicons name="notifications-outline" size={14} color="#222" />
            <Text style={s.chipBtnTxt}>
              {to ? reminderLabelFor('to') : 'Aviso'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.chipBtn, { backgroundColor: "#ffe9e9" }]}
            onPress={() => { setFrom(null); setTo(null); setConceptoFilter(null); }}
          >
            <Ionicons name="trash-outline" size={14} color="#c00" />
            <Text style={[s.chipBtnTxt, { color: "#c00" }]}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {data.length === 0 ? (
        <Text style={{ color: "#666" }}>Sin movimientos para este período.</Text>
      ) : (
        <FlatList
          data={data.slice().reverse()}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={s.item}>
              <View style={[s.badge, item.tipo === "pago" ? s.badgePago : s.badgeCobro]}>
                <Text style={s.badgeTxt}>{item.tipo === "pago" ? "Pago" : "Cobro"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={() =>
                  setConceptoFilter(prev => (prev === item.concepto ? null : item.concepto))
                }>
                  <Text style={s.itemConcepto}>{item.concepto}</Text>
                </TouchableOpacity>
                <Text style={s.itemFecha}>{fmtDateTime(new Date(item.fecha))}</Text>
              </View>
              <Text style={s.itemMonto}>{fmtCurrency(item.monto)}</Text>
              <TouchableOpacity onPress={() => removeById(item.id)} style={{ marginLeft: 10 }}>
                <Ionicons name="close-circle-outline" size={22} color="#a00" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {picker.open && (
        <View style={{ marginTop: 10 }}>
          <DateTimePicker
            value={new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            locale="es-UY"
            onChange={onPick}
          />
          <View style={{ alignItems: "flex-end", marginTop: 8 }}>
            <TouchableOpacity onPress={closePicker} style={{ padding: 6, borderRadius: 6, backgroundColor: "#fdd" }}>
              <Text style={{ color: "#c00", fontWeight: "600" }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ===== Sheet de Aviso (hora + presets de cuánto antes) ===== */}
      {reminderOpen && (
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>
            Aviso para {reminderOpen === 'from' ? 'Desde' : 'Hasta'}
          </Text>

          {/* Hora del aviso */}
          <Text style={s.sheetSub}>Hora</Text>
          <DateTimePicker
            value={reminderTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            is24Hour
            onChange={(_, d) => d && setReminderTime(d)}
          />

          {/* Presets de cuánto antes */}
          <Text style={[s.sheetSub, { marginTop: 8 }]}>Cuánto antes</Text>
          <View style={s.rowWrap}>
            {[15, 60, 180, 1440].map(m => (
              <TouchableOpacity
                key={m}
                style={[s.pill, reminderLeadMin === m && s.pillActive]}
                onPress={() => setReminderLeadMin(m)}
              >
                <Ionicons name="notifications-outline" size={14} />
                <Text style={s.pillTxt}>
                  {m >= 60 ? `${m/60} h antes` : `${m} min antes`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Guardar aviso */}
          <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => scheduleReminder(reminderOpen)}
              style={[s.pill, { backgroundColor: '#e6f5ec' }]}
            >
              <Ionicons name="notifications" size={14} color="#0a7f42" />
              <Text style={[s.pillTxt, { color: '#0a7f42' }]}>Guardar aviso</Text>
            </TouchableOpacity>
          </View>

          {/* Cerrar */}
          <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
            <TouchableOpacity onPress={closeReminder} style={s.closeBtn}>
              <Text style={{ color: '#c00', fontWeight: '600' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, backgroundColor: "#FAFAF7" },
  title: { fontSize: 32, fontWeight: "800", color: "#111", marginBottom: 10 },

  totalBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e7e7e2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // <-- asegura alineación vertical
  },
  totalLabel: { fontSize: 16, color: "#333" },
  totalValue: { fontSize: 16, fontWeight: "800" },

  // chips debajo del importe, con wrap para que NO se entreveren
  totalChipsRow: { flexDirection:'row', flexWrap:'wrap', alignItems:'center', gap:8, marginTop:8 },

  chipSm: { backgroundColor:'#e9eef5', paddingHorizontal:10, paddingVertical:6, borderRadius:999, marginRight:8, marginTop:6 },
  chipSmTxt: { color:'#222', fontWeight:'600' },

  chipBtn: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:8, borderRadius:10, backgroundColor:'#e9eef5' },
  chipBtnTxt: { color:'#222', fontWeight:'600' },
  chipDisabled: { opacity: 0.4 },

  item: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e7e7e2", padding: 12, marginBottom: 10 },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, marginRight: 4 },
  badgePago: { backgroundColor: "#e2ecff" },
  badgeCobro: { backgroundColor: "#e5ffe9" },
  badgeTxt: { fontSize: 12, color: "#222", fontWeight: "600" },
  itemConcepto: { fontSize: 16, color: "#111", fontWeight: "600" },
  itemFecha: { fontSize: 12, color: "#777" },
  itemMonto: { fontSize: 16, fontWeight: "700", color: "#111" },

  // Nuevos estilos para el sheet
  sheet: { position:'absolute', left:0, right:0, bottom:0,
           backgroundColor:'#fff', padding:16, borderTopLeftRadius:16, borderTopRightRadius:16,
           shadowColor:'#000', shadowOpacity:0.15, shadowRadius:8, elevation:8 },
  sheetTitle: { fontSize:18, fontWeight:'800', marginBottom:6 },
  sheetSub: { fontSize:14, fontWeight:'700', color:'#333', marginBottom:6 },
  rowWrap: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  pill: { flexDirection:'row', alignItems:'center', gap:6,
          paddingHorizontal:12, paddingVertical:8, borderRadius:10, backgroundColor:'#e9eef5' },
  pillActive: { backgroundColor:'#d5e6ff' },
  pillTxt: { fontWeight:'600', color:'#222' },
  closeBtn: { padding:6, borderRadius:6, backgroundColor:'#fdd' },
});