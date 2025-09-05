import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";

export default function AgregarMovimientoScreen({ route, navigation }) {
  const { tipo } = route.params;
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");

  const guardar = () => {
    const v = Number(String(monto).replace(",", "."));
    if (!concepto.trim() || !isFinite(v) || v <= 0) {
      Alert.alert("Ordénate", "Ingresá un concepto y un monto válido (> 0).");
      return;
    }
    const id = Date.now().toString();
    const fecha = new Date().toISOString();
    // Aquí deberías guardar el movimiento en tu estado global
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.modalTitle}>{tipo === "pago" ? "Nuevo Pago" : "Nuevo Cobro"}</Text>

      <Text style={styles.label}>Concepto</Text>
      <TextInput
        value={concepto}
        onChangeText={setConcepto}
        placeholder="Ej: Luz, Caja del día…"
        placeholderTextColor="#9aa0a6"
        style={styles.input}
      />

      <Text style={styles.label}>Monto</Text>
      <TextInput
        value={monto}
        onChangeText={setMonto}
        placeholder="0.00"
        keyboardType="decimal-pad"
        style={styles.input}
        placeholderTextColor="#9aa0a6"
      />

      <View style={styles.actions}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.btn, styles.cancel]}>
          <Text style={styles.btnTxt}>Cancelar</Text>
        </Pressable>
        <Pressable onPress={guardar} style={[styles.btn, styles.save]}>
          <Text style={[styles.btnTxt, { color: "#0b2b1f" }]}>Guardar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding: 16,
    backgroundColor: "#FAFAF7"
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    marginBottom: 8, 
    color: "#111" 
  },
  label: { 
    color: "#666", 
    marginTop: 8, 
    marginBottom: 6 
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6e6e0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    color: "#111"
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10
  },
  cancel: {
    backgroundColor: "#efefea"
  },
  save: {
    backgroundColor: "#5CC9A7"
  },
  btnTxt: {
    color: "#111",
    fontWeight: "700"
  },
});
