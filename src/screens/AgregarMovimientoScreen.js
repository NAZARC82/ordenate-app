// src/screens/AgregarMovimientoScreen.js
import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useMovimientos } from "../state/MovimientosContext";

export default function AgregarMovimientoScreen({ route, navigation }) {
  const { tipo } = route.params || {}; // viene de Home: pago o cobro
  const { addMovimiento } = useMovimientos();

  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");

  const handleSave = () => {
    const ok = addMovimiento({ tipo, concepto, monto });
    if (ok) {
      navigation.goBack();
    } else {
      alert("Completa todos los campos con valores válidos.");
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Nuevo {tipo === "pago" ? "Pago" : "Cobro"}</Text>

      <TextInput
        style={s.input}
        placeholder="Concepto"
        value={concepto}
        onChangeText={setConcepto}
      />

      <TextInput
        style={s.input}
        placeholder="Monto"
        value={monto}
        onChangeText={setMonto}
        keyboardType="numeric"
      />

      <TouchableOpacity style={s.btn} onPress={handleSave}>
        <Text style={s.btnText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
