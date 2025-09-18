// src/screens/HistoryChips.js
import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from '@react-navigation/native';
import { useMovimientos } from "../state/MovimientosContext";
import { fmtCurrency, fmtDateTime } from "../utils/fmt";

export default function HistoryChips() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { items, clearAll, removeById } = useMovimientos();

  // ===== Filtros globales (por fecha) =====
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  // ===== Date Picker (calendario) =====
  const [picker, setPicker] = useState({ open: false, type: null });
  const openPicker = (type) => setPicker({ open: true, type }); // 'from' | 'to'
  const closePicker = () => setPicker({ open: false, type: null });
  const onPick = (_, date) => {
    if (!date) return;
    if (picker.type === "from") setFrom(date);
    if (picker.type === "to") setTo(date);
    closePicker();
  };

  // ===== Data filtrada por fechas =====
  const data = useMemo(() => {
    return items.filter((i) => {
      const d = new Date(i.fecha);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [items, from, to]);

  const total = useMemo(
    () => data.reduce((acc, i) => acc + (i.tipo === "cobro" ? i.monto : -i.monto), 0),
    [data]
  );

  // ===== Acciones =====
  const quitarFiltros = () => {
    setFrom(null);
    setTo(null);
  };

  // ===== Render =====
  return (
    <View style={[s.container, { paddingTop: Math.max(12, insets.top + 6) }]}>
      <Text style={s.title}>Historial</Text>

      {/* TOTAL */}
      <View style={s.totalBox}>
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={[s.totalValue, { color: total >= 0 ? "#0a7f42" : "#a00" }]}>
            {fmtCurrency(Math.abs(total))}
            {total < 0 ? " (neto a pagar)" : ""}
          </Text>
        </View>

        {/* CHIPS de filtros/acciones */}
        <View style={s.totalChipsRow}>
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

        <View style={s.totalChipsRow}>
          {/* DESDE fecha */}
          <TouchableOpacity style={s.chipBtn} activeOpacity={0.75} onPress={() => openPicker("from")}>
            <Ionicons name="calendar-outline" size={14} color="#222" />
            <Text style={s.chipBtnTxt}>Desde</Text>
          </TouchableOpacity>

          {/* HASTA fecha */}
          <TouchableOpacity style={s.chipBtn} activeOpacity={0.75} onPress={() => openPicker("to")}>
            <Ionicons name="calendar-outline" size={14} color="#222" />
            <Text style={s.chipBtnTxt}>Hasta</Text>
          </TouchableOpacity>

          {/* Limpiar */}
          <TouchableOpacity
            style={[s.chipBtn, { backgroundColor: "#ffe9e9" }]}
            activeOpacity={0.75}
            onPress={quitarFiltros}
          >
            <Ionicons name="trash-outline" size={14} color="#c00" />
            <Text style={[s.chipBtnTxt, { color: "#c00" }]}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista */}
      {data.length === 0 ? (
        <Text style={{ color: "#666" }}>Sin movimientos para este período.</Text>
      ) : (
        <FlatList
          data={data.slice().reverse()}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.item}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('MovementDetail', { id: item.id })}
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

      {/* Date Picker inline (iOS grid) */}
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

  totalBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e7e7e2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 16, color: "#333" },
  totalValue: { fontSize: 16, fontWeight: "800" },

  totalChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  chipSm: {
    backgroundColor: "#e9eef5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginTop: 6,
  },
  chipSmTxt: { color: "#222", fontWeight: "600" },

  chipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#e9eef5",
  },
  chipBtnTxt: { color: "#222", fontWeight: "600" },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e7e7e2",
    padding: 12,
    marginBottom: 10,
  },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, marginRight: 4 },
  badgePago: { backgroundColor: "#e2ecff" },
  badgeCobro: { backgroundColor: "#e5ffe9" },
  badgeTxt: { fontSize: 12, color: "#222", fontWeight: "600" },
  itemConcepto: { fontSize: 16, color: "#111", fontWeight: "600" },
  itemFecha: { fontSize: 12, color: "#777" },
  itemMonto: { fontSize: 16, fontWeight: "700", color: "#111" },
});
