import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: Math.max(12, insets.top + 6) }]}>
      <Text style={s.title}>Ajustes</Text>
      <Text style={s.subtitle}>
        Próximamente: categorías, exportar PDF/Excel, seguridad.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, backgroundColor: "#FAFAF7" },
  title: { fontSize: 22, fontWeight: "800", color: "#111", textAlign: "center", marginBottom: 8 },
  subtitle: { color: "#666", marginTop: 6 },
});
    