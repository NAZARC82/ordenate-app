import { View, Text, StyleSheet, Platform } from "react-native";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Ajustes</Text>
      <Text style={{ color: "#666", marginTop: 6 }}>
        Próximamente: categorías, exportar PDF/Excel, seguridad.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 18, 
    paddingTop: Platform.OS === "android" ? 36 : 8,
    backgroundColor: "#FAFAF7"
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#111" 
  },
});
