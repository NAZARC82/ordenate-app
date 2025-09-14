import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMovimientos } from "../state/MovimientosContext";
import { fmtCurrency } from "../utils/fmt";

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { resumen } = useMovimientos();

  return (
    <View style={[s.container, { paddingTop: Math.max(12, insets.top + 6) }]}>
      {/* Header con título centrado */}
      <View style={s.header}>
        <Ionicons
          name="calendar-outline"
          size={24}
          color="#1b1b1b"
          onPress={() => navigation.navigate('Historial')}
        />
        <Text style={s.title}>Ordénate</Text>
        <Ionicons
          name="notifications-outline"
          size={24}
          color="#1b1b1b"
          onPress={() => alert("Próximamente: recordatorios")}
        />
      </View>

      {/* Buscar */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color="#555" style={{ marginRight: 8 }} />
        <TextInput placeholder="Buscar" placeholderTextColor="#555" style={s.search}/>
      </View>

      {/* Resumen */}
      <View style={s.summary}>
  <Line label="Debes" value={fmtCurrency(resumen.debes)} />
  <Line label="Te deben" value={fmtCurrency(resumen.teDeben)} />
<Line 
  label="Balance" 
  value={fmtCurrency(resumen.balance)} 
  color={resumen.balance >= 0 ? "green" : "red"} 
/>
</View>


      <BigBtn label="Agregar Pago"  color="#DCE8FB" onPress={() => navigation.navigate("AgregarMovimiento", { tipo: "pago" })}/>
      <BigBtn label="Agregar Cobro" color="#E7F7E9" onPress={() => navigation.navigate("AgregarMovimiento", { tipo: "cobro" })}/>
      <BigBtn label="Recordatorio" color="#FDEDC6" onPress={() => alert("En breve")}/>
    </View>
  );
}

const BigBtn = ({ label, color, onPress }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[s.bigBtn, { backgroundColor: color }]}>
    <View style={s.plusCircle}><Text style={s.plusText}>+</Text></View>
    <Text style={s.bigBtnText}>{label}</Text>
  </TouchableOpacity>
);

const Line = ({ label, value, color }) => (
  <View style={s.line}>
    <Text style={s.label}>{label}</Text>
    <Text style={[s.amount, color ? { color } : null]}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, backgroundColor: "#FCFCF8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#111" },

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
  amount: { fontSize: 18, fontWeight: "700", color: "#111" },

  bigBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  plusCircle: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center", marginRight: 12
  },
  plusText: { fontSize: 22, fontWeight: "700", color: "#2a66b8" },
  bigBtnText: { fontSize: 22, fontWeight: "800", color: "#111" },
});
