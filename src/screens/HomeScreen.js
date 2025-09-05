// src/screens/HomeScreen.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function HomeScreen({ navigation }) {
  const [items, setItems] = useState([]);

  const resumen = useMemo(() => {
    const toNum = (v) => Number(v) || 0;
    const debes = items.filter(i => i.tipo === "pago").reduce((a, b) => a + toNum(b.monto), 0);
    const teDeben = items.filter(i => i.tipo === "cobro").reduce((a, b) => a + toNum(b.monto), 0);
    return { debes, teDeben };
  }, [items]);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Ionicons name="calendar-outline" size={24} color="#1b1b1b" />
        <Ionicons name="notifications-outline" size={24} color="#1b1b1b" />
      </View>

      {/* Buscar */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color="#555" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Buscar"
          placeholderTextColor="#555"
          style={s.search}
        />
      </View>

      {/* Resumen */}
      <View style={s.summary}>
        <SummaryLine label="Debes" value={resumen.debes} />
        <SummaryLine label="Te deben" value={resumen.teDeben} />
      </View>

      {/* Botones principales */}
      <BigBtn
        label="Agregar Pago"
        color="#DCE8FB"
        onPress={() => navigation.navigate("AgregarMovimiento", { tipo: "pago" })}
      />
      <BigBtn
        label="Agregar Cobro"
        color="#E7F7E9"
        onPress={() => navigation.navigate("AgregarMovimiento", { tipo: "cobro" })}
      />
      <BigBtn
        label="Recordatorio"
        color="#FDEDC6"
        onPress={() => Alert.alert("Recordatorios", "En breve")}
      />
    </View>
  );
}

/* ───────────── componentes ───────────── */
const BigBtn = ({ label, color, onPress }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[s.bigBtn, { backgroundColor: color }]}>
    <View style={s.plusCircle}><Text style={s.plusText}>+</Text></View>
    <Text style={s.bigBtnText}>{label}</Text>
  </TouchableOpacity>
);

const SummaryLine = ({ label, value }) => (
  <View style={s.line}>
    <Text style={s.label}>{label}</Text>
    <Text style={s.amount}>{fmt(value)}</Text>
  </View>
);

/* ───────────── helpers ───────────── */
const fmt = (n) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

/* ───────────── estilos ───────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 36 : 8,
    backgroundColor: "#FCFCF8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#D6D9DD",
    marginBottom: 14,
  },
  search: { flex: 1, color: "#111", fontSize: 16 },
  summary: { marginTop: 4, marginBottom: 14, gap: 6 },
  line: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  label: { fontSize: 18, color: "#333" },
  amount: { fontSize: 18, fontWeight: "700", color: "#111", fontVariant: ["tabular-nums"] },

  bigBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  plusCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  plusText: { fontSize: 22, fontWeight: "700", color: "#2a66b8" },
  bigBtnText: { fontSize: 22, fontWeight: "800", color: "#111" },
});
