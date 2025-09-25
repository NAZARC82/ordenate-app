import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MovimientosContext } from "../state/MovimientosContext";
import { exportarPDFMesActual } from "../utils/pdfExport";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { movimientos } = useContext(MovimientosContext);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportarPDF = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);

      // Verificar si hay movimientos
      if (movimientos.length === 0) {
        Alert.alert(
          'Sin movimientos',
          'No hay movimientos registrados para exportar.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Exportar PDF
      await exportarPDFMesActual(movimientos);
      
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      Alert.alert(
        'Error',
        'Hubo un problema al generar el PDF. Por favor, inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Obtener información del mes actual
  const hoy = new Date();
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const mesActual = meses[hoy.getMonth()];
  const anoActual = hoy.getFullYear();

  return (
    <View style={[styles.container, { paddingTop: Math.max(12, insets.top + 6) }]}>
      <Text style={styles.title}>Ajustes</Text>
      
      {/* Sección de Exportar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Reportes</Text>
        
        <TouchableOpacity 
          style={[styles.optionButton, isExporting && styles.optionButtonDisabled]} 
          onPress={handleExportarPDF}
          disabled={isExporting}
          activeOpacity={0.7}
        >
          <View style={styles.optionContent}>
            <View style={styles.optionLeft}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="document-text" 
                  size={24} 
                  color="#3E7D75" 
                />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Exportar PDF</Text>
                <Text style={styles.optionDescription}>
                  Movimientos de {mesActual} {anoActual}
                </Text>
              </View>
            </View>
            
            <View style={styles.optionRight}>
              {isExporting ? (
                <ActivityIndicator size="small" color="#3E7D75" />
              ) : (
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color="#666" 
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Sección de información */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ Información</Text>
        <Text style={styles.infoText}>
          El reporte incluye todos los movimientos del mes actual con fecha, tipo, monto, estado y notas.
        </Text>
        <Text style={styles.subtitle}>
          Próximamente: categorías, filtros personalizados, exportar Excel, seguridad.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 18, 
    backgroundColor: "#FCFCF8" 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: "#4D3527", 
    textAlign: "center", 
    marginBottom: 24 
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4D3527",
    marginBottom: 12,
  },
  optionButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  optionButtonDisabled: {
    opacity: 0.6,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0F7F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4D3527",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: "#666",
  },
  optionRight: {
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    borderLeft: 4,
    borderLeftColor: "#3E7D75",
  },
  subtitle: { 
    color: "#999", 
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
});
