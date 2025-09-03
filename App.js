import { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function App() {
  // tabs: inicio | historial | ajustes (mock simple)
  const [tab, setTab] = useState("inicio");

  // movimientos: { id, tipo: 'pago' | 'cobro', concepto, monto, fechaISO }
  const [items, setItems] = useState([]);

  // modal de alta
  const [modal, setModal] = useState({ open: false, tipo: "pago" });
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");

  const resumen = useMemo(() => {
    const debes = items
      .filter((i) => i.tipo === "pago")
      .reduce((a, b) => a + b.monto, 0);
    const teDeben = items
      .filter((i) => i.tipo === "cobro")
      .reduce((a, b) => a + b.monto, 0);
    return { debes, teDeben };
  }, [items]);

  const abrirAlta = (tipo) => setModal({ open: true, tipo });

  const guardar = () => {
    const v = Number(String(monto).replace(",", "."));
    if (!concepto.trim() || !isFinite(v) || v <= 0) {
      Alert.alert("Ordénate", "Ingresá un concepto y un monto válido (> 0).");
      return;
    }
    const id = Date.now().toString();
    const fecha = new Date().toISOString();
    setItems((prev) => [...prev, { id, tipo: modal.tipo, concepto: concepto.trim(), monto: v, fecha }]);
    setConcepto("");
    setMonto("");
    setModal({ ...modal, open: false });
    if (tab !== "historial") setTab("historial");
  };

  const eliminar = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const limpiarTodo = () => {
    Alert.alert("Limpiar", "¿Borrar todos los movimientos?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: () => setItems([]) },
    ]);
  };

  return (
    <SafeAreaView style={S.safe}>
      <View style={S.container}>
        {/* Header */}
        <View style={S.header}>
          <Ionicons name="calendar-outline" size={24} color="#1b1b1b" />
          <Ionicons name="notifications-outline" size={24} color="#1b1b1b" />
        </View>

        {/* Buscar (mock UI) */}
        <View style={S.searchWrap}>
          <Ionicons name="search" size={18} color="#9aa0a6" style={{ marginRight: 8 }} />
          <TextInput placeholder="Buscar" placeholderTextColor="#9aa0a6" style={S.search} />
        </View>

        {/* Contenido por tab */}
        {tab === "inicio" && (
          <>
            <Text style={S.duoText}>
              Debes ${fmt(resumen.debes)} / Te deben ${fmt(resumen.teDeben)}
            </Text>

            <BigBtn label="Agregar Pago" color="#d9e7fb" onPress={() => abrirAlta("pago")} />
            <BigBtn label="Agregar Cobro" color="#e5f8e8" onPress={() => abrirAlta("cobro")} />
            <BigBtn label="Recordatorio" color="#fff0cc" onPress={() => Alert.alert("Recordatorios", "En breve")} />
          </>
        )}

        {tab === "historial" && (
          <View style={{ flex: 1 }}>
            <View style={S.histHeader}>
              <Text style={S.histTitle}>Historial</Text>
              <TouchableOpacity onPress={limpiarTodo} style={S.clearBtn}>
                <Ionicons name="trash-outline" size={18} color="#c00" />
                <Text style={S.clearTxt}>Limpiar</Text>
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <Text style={{ color: "#666" }}>Sin movimientos aún.</Text>
            ) : (
              <FlatList
                data={items.slice().reverse()} // último primero
                keyExtractor={(i) => i.id}
                contentContainerStyle={{ paddingBottom: 80 }}
                renderItem={({ item }) => (
                  <View style={S.item}>
                    <View style={[S.badge, item.tipo === "pago" ? S.badgePago : S.badgeCobro]}>
                      <Text style={S.badgeTxt}>{item.tipo === "pago" ? "Pago" : "Cobro"}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.itemConcepto}>{item.concepto}</Text>
                      <Text style={S.itemFecha}>{new Date(item.fecha).toLocaleString()}</Text>
                    </View>
                    <Text style={S.itemMonto}>
                      ${fmt(item.monto)}
                    </Text>
                    <TouchableOpacity onPress={() => eliminar(item.id)} style={{ marginLeft: 10 }}>
                      <Ionicons name="close-circle-outline" size={22} color="#a00" />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {tab === "ajustes" && (
          <View>
            <Text style={S.sectionTitle}>Ajustes</Text>
            <Text style={{ color: "#666", marginTop: 6 }}>Próximamente: categorías, exportar PDF/Excel, seguridad.</Text>
          </View>
        )}

        {/* Modal alta */}
        <Modal visible={modal.open} transparent animationType="fade" onRequestClose={() => setModal({ ...modal, open: false })}>
          <View style={S.modalBg}>
            <View style={S.modalCard}>
              <Text style={S.modalTitle}>{modal.tipo === "pago" ? "Nuevo Pago" : "Nuevo Cobro"}</Text>

              <Text style={S.label}>Concepto</Text>
              <TextInput
                value={concepto}
                onChangeText={setConcepto}
                placeholder="Ej: Luz, Caja del día…"
                placeholderTextColor="#9aa0a6"
                style={S.input}
              />

              <Text style={S.label}>Monto</Text>
              <TextInput
                value={monto}
                onChangeText={setMonto}
                placeholder="0.00"
                keyboardType="decimal-pad"
                style={S.input}
                placeholderTextColor="#9aa0a6"
              />

              <View style={S.actions}>
                <Pressable onPress={() => setModal({ ...modal, open: false })} style={[S.btn, S.cancel]}>
                  <Text style={S.btnTxt}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={guardar} style={[S.btn, S.save]}>
                  <Text style={[S.btnTxt, { color: "#0b2b1f" }]}>Guardar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Tab bar */}
        <View style={S.tabbar}>
          <Tab icon="home-outline" label="Inicio" active={tab === "inicio"} onPress={() => setTab("inicio")} />
          <Tab icon="time-outline" label="Historial" active={tab === "historial"} onPress={() => setTab("historial")} />
          <Tab icon="settings-outline" label="Ajustes" active={tab === "ajustes"} onPress={() => setTab("ajustes")} />
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ───────────── componentes ───────────── */
const BigBtn = ({ label, color, onPress }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[S.bigBtn, { backgroundColor: color }]}>
    <View style={S.plusCircle}><Text style={S.plusText}>+</Text></View>
    <Text style={S.bigBtnText}>{label}</Text>
  </TouchableOpacity>
);

const Tab = ({ icon, label, active, onPress }) => (
  <TouchableOpacity onPress={onPress} style={S.tabItem} activeOpacity={0.8}>
    <Ionicons name={icon} size={22} color={active ? "#111" : "#666"} />
    <Text style={[S.tabLabel, active && { color: "#111", fontWeight: "600" }]}>{label}</Text>
  </TouchableOpacity>
);

/* ───────────── helpers ───────────── */
const fmt = (n) =>
  new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(n || 0));

/* ───────────── estilos ───────────── */
const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAF7" },
  container: { flex: 1, paddingHorizontal: 18, paddingTop: Platform.OS === "android" ? 36 : 8, paddingBottom: 66 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },

  searchWrap: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 42,
    borderRadius: 12, backgroundColor: "#F1F3F4", marginBottom: 14,
  },
  search: { flex: 1, color: "#1b1b1b", fontSize: 16 },

  duoText: { fontSize: 18, color: "#1b1b1b", marginBottom: 14 },

  bigBtn: { flexDirection: "row", alignItems: "center", borderRadius: 18, paddingVertical: 18, paddingHorizontal: 16, marginBottom: 12 },
  plusCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginRight: 12 },
  plusText: { fontSize: 22, fontWeight: "700", color: "#2a66b8" },
  bigBtnText: { fontSize: 22, fontWeight: "700", color: "#111" },

  histHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  histTitle: { fontSize: 20, fontWeight: "700", color: "#111" },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#fff" },
  clearTxt: { color: "#c00", fontWeight: "600" },

  item: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff",
    borderRadius: 12, borderWidth: 1, borderColor: "#e7e7e2", padding: 12, marginBottom: 10,
  },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, marginRight: 4 },
  badgePago: { backgroundColor: "#e2ecff" },
  badgeCobro: { backgroundColor: "#e5ffe9" },
  badgeTxt: { fontSize: 12, color: "#222", fontWeight: "600" },
  itemConcepto: { fontSize: 16, color: "#111", fontWeight: "600" },
  itemFecha: { fontSize: 12, color: "#777" },
  itemMonto: { fontSize: 16, fontWeight: "700", color: "#111" },

  // modal
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center", padding: 18 },
  modalCard: { width: "100%", backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e6e6e0" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#111" },
  label: { color: "#666", marginTop: 8, marginBottom: 6 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e6e6e0", borderRadius: 10, paddingHorizontal: 12, height: 44, color: "#111" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  cancel: { backgroundColor: "#efefea" },
  save: { backgroundColor: "#5CC9A7" },
  btnTxt: { color: "#111", fontWeight: "700" },

  tabbar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    borderTopWidth: 1, borderTopColor: "#e5e5e0", backgroundColor: "#fff",
    flexDirection: "row", justifyContent: "space-around", paddingTop: 8, paddingBottom: 10,
  },
  tabItem: { alignItems: "center", gap: 2, paddingHorizontal: 10 },
  tabLabel: { fontSize: 12, color: "#666" },
});
