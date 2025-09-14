// src/screens/HistoryChips.js
console.log('MONTÓ HistoryChips ✅');
import { useState, useMemo } from "react";
import { ScrollView, TouchableOpacity, View, Text, StyleSheet, FlatList, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMovimientos } from "../state/MovimientosContext";
import { fmtCurrency, fmtDateTime } from "../utils/fmt";

export default function HistoryChips() {
  const insets = useSafeAreaInsets();                       // 👈 agrega esto
  const { items, clearAll, removeById } = useMovimientos();

  // NUEVO estado de filtro por concepto
  const [conceptoFilter, setConceptoFilter] = useState(null);

  const [from, setFrom]   = useState(null);
  const [to, setTo]       = useState(null);
  const [picker, setPicker] = useState({ open: false, mode: null });

  const openPicker  = (mode) => setPicker({ open: true,  mode });
  const closePicker = ()     => setPicker({ open: false, mode: null });

  const onPick = (_, date) => {
    if (Platform.OS === "android") closePicker();
    if (!date) return;
    if (picker.mode === "from") setFrom(new Date(date.setHours(0, 0, 0, 0)));
    if (picker.mode === "to")   setTo(new Date(date.setHours(23, 59, 59, 999)));
  };

  const quitarFiltro = () => { setFrom(null); setTo(null); };

  // DATA filtrada (concepto + fechas)
  const data = useMemo(() => {
    return items.filter(i => {
      if (conceptoFilter && i.concepto !== conceptoFilter) return false;
      const d = new Date(i.fecha);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [items, from, to, conceptoFilter]);

  const total = useMemo(
    () => data.reduce((acc, i) => acc + (i.tipo === "cobro" ? i.monto : -i.monto), 0),
    [data]
  );

  console.log('MONTÓ HistoryChips ✅'); // 👈 verificación

  return (
    <View style={[s.container, { paddingTop: Math.max(12, insets.top + 6) }]}>
      <Text style={s.title}>Historial</Text>

      {/* TOTAL + filtros pegados al importe */}
      <View style={s.totalBar}>
        <Text style={s.totalLabel}>Total</Text>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[s.totalValue, { color: total >= 0 ? "#0a7f42" : "#a00" }]}>
            {fmtCurrency(Math.abs(total))}{total < 0 ? " (neto a pagar)" : ""}
          </Text>

          {/* Chips debajo del importe: concepto + rango */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 6 }}>
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

            {/* Botones chicos para abrir pickers */}
            <TouchableOpacity style={s.chipBtn} onPress={() => openPicker("from")}>
              <Ionicons name="calendar-outline" size={14} color="#222" />
              <Text style={s.chipBtnTxt}>Desde</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.chipBtn} onPress={() => openPicker("to")}>
              <Ionicons name="calendar-outline" size={14} color="#222" />
              <Text style={s.chipBtnTxt}>Hasta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[s.chipBtn, { backgroundColor: "#ffe9e9" }]} onPress={() => { setFrom(null); setTo(null); setConceptoFilter(null); }}>
              <Ionicons name="trash-outline" size={14} color="#c00" />
              <Text style={[s.chipBtnTxt, { color: "#c00" }]}>Limpiar</Text>
            </TouchableOpacity>
          </ScrollView>
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
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setConceptoFilter(item.concepto)}
              style={s.item}
            >
              <View style={[s.badge, item.tipo === "pago" ? s.badgePago : s.badgeCobro]}>
                <Text style={s.badgeTxt}>{item.tipo === "pago" ? "Pago" : "Cobro"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.itemConcepto}>{item.concepto}</Text>
                <Text style={s.itemFecha}>{fmtDateTime(new Date(item.fecha))}</Text>
              </View>
              <Text style={s.itemMonto}>{fmtCurrency(item.monto)}</Text>
              <TouchableOpacity onPress={() => removeById(item.id)} style={{ marginLeft: 10 }}>
                <Ionicons name="close-circle-outline" size={22} color="#a00" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {picker.open && (
        <View style={{ marginTop: 10 }}>
          <DateTimePicker
            value={new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            locale="es-ES"
            onChange={onPick}
          />
          <View style={{ alignItems: "flex-end", marginTop: 8 }}>
            <TouchableOpacity onPress={closePicker} style={{ padding: 6, borderRadius: 6, backgroundColor: "#fdd" }}>
              <Text style={{ color: "#c00", fontWeight: "600" }}>Cerrar</Text>
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

  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#e9eef5" },
  chipTxt: { color: "#222", fontWeight: "600" },

  totalBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#e7e7e2", marginBottom: 10 },
  totalLabel: { fontSize: 16, color: "#333" },
  totalValue: { fontSize: 16, fontWeight: "800" },

  item: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e7e7e2", padding: 12, marginBottom: 10 },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, marginRight: 4 },
  badgePago: { backgroundColor: "#e2ecff" },
  badgeCobro: { backgroundColor: "#e5ffe9" },
  badgeTxt: { fontSize: 12, color: "#222", fontWeight: "600" },
  itemConcepto: { fontSize: 16, color: "#111", fontWeight: "600" },
  itemFecha: { fontSize: 12, color: "#777" },
  itemMonto: { fontSize: 16, fontWeight: "700", color: "#111" },

  // chips pequeños bajo el importe
  chipSm: {
    backgroundColor: "#eef2f8",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipSmTxt: { fontSize: 12, color: "#222", fontWeight: "600" },

  chipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e9eef5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipBtnTxt: { fontSize: 12, color: "#222", fontWeight: "600" },
});