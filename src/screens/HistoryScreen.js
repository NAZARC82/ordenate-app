import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HistoryScreen() {
  const [items, setItems] = useState([]);

  const limpiarTodo = () => {
    Alert.alert("Limpiar", "¿Borrar todos los movimientos?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: () => setItems([]) },
    ]);
  };

  const eliminar = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.histHeader}>
        <Text style={styles.histTitle}>Historial</Text>
        <TouchableOpacity onPress={limpiarTodo} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={18} color="#c00" />
          <Text style={styles.clearTxt}>Limpiar</Text>
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
            <View style={styles.item}>
              <View style={[styles.badge, item.tipo === "pago" ? styles.badgePago : styles.badgeCobro]}>
                <Text style={styles.badgeTxt}>{item.tipo === "pago" ? "Pago" : "Cobro"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemConcepto}>{item.concepto}</Text>
                <Text style={styles.itemFecha}>{new Date(item.fecha).toLocaleString()}</Text>
              </View>
              <Text style={styles.itemMonto}>
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
  );
}

const fmt = (n) =>
  new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(n || 0));

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 18, 
    paddingTop: Platform.OS === "android" ? 36 : 8,
    backgroundColor: "#FAFAF7"
  },
  histHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 10 
  },
  histTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#111" 
  },
  clearBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8, 
    backgroundColor: "#fff" 
  },
  clearTxt: { 
    color: "#c00", 
    fontWeight: "600" 
  },
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
  badge: { 
    paddingVertical: 4, 
    paddingHorizontal: 8, 
    borderRadius: 8, 
    marginRight: 4 
  },
  badgePago: { 
    backgroundColor: "#e2ecff" 
  },
  badgeCobro: { 
    backgroundColor: "#e5ffe9" 
  },
  badgeTxt: { 
    fontSize: 12, 
    color: "#222", 
    fontWeight: "600" 
  },
  itemConcepto: { 
    fontSize: 16, 
    color: "#111", 
    fontWeight: "600" 
  },
  itemFecha: { 
    fontSize: 12, 
    color: "#777" 
  },
  itemMonto: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#111" 
  },
});
