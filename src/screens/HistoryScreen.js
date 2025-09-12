import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMovimientos } from "../state/MovimientosContext";
import { fmtCurrency, fmtDateTime } from "../utils/fmt";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { items, clearAll, removeById } = useMovimientos();

  const limpiarTodo = () => {
    Alert.alert("Limpiar", "¿Borrar todos los movimientos?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: clearAll },
    ]);
  };

  return (
    <View style={[s.container, { paddingTop: Math.max(12, insets.top + 6) }]}>
      {/* Header centrado con botón a la derecha */}
      <View style={s.header}>
        <Text style={s.title}>Historial</Text>
        <TouchableOpacity onPress={limpiarTodo} style={s.clearBtn}>
          <Ionicons name="trash-outline" size={18} color="#c00" />
          <Text style={s.clearTxt}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <Text style={{ color: "#666" }}>Sin movimientos aún.</Text>
      ) : (
        <FlatList
          data={[...items].reverse()}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={s.item}>
              <View style={[s.badge, item.tipo === "pago" ? s.badgePago : s.badgeCobro]}>
                <Text style={s.badgeTxt}>{item.tipo === "pago" ? "Pago" : "Cobro"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.itemConcepto}>{item.concepto}</Text>
                <Text style={s.itemFecha}>{fmtDateTime(item.fecha)}</Text>
              </View>
              <Text style={s.itemMonto}>{fmtCurrency(item.monto)}</Text>
              <TouchableOpacity onPress={() => removeById(item.id)} style={{ marginLeft: 10 }}>
                <Ionicons name="close-circle-outline" size={22} color="#a00" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, backgroundColor: "#FAFAF7" },

  header: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    minHeight: 32,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#111", textAlign: "center" },
  clearBtn: {
    position: "absolute",
    right: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  clearTxt: { color: "#c00", fontWeight: "600" },

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
