import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getReminderSettings, saveReminderSettings, cleanupOldReminders } from '../modules/reminders'

export default function SettingsScreen() {
  const [reminderSettings, setReminderSettings] = useState({
    silentWindow: { enabled: true, startTime: '22:00', endTime: '08:00' },
    defaultSnoozeMinutes: 60,
    enableBadge: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  useEffect(() => {
    const loadReminderSettings = async () => {
      const settings = await getReminderSettings();
      setReminderSettings(settings);
    };
    loadReminderSettings();
  }, []);

  const handleReminderSettingChange = async (key, value) => {
    const newSettings = { ...reminderSettings, [key]: value };
    setReminderSettings(newSettings);
    await saveReminderSettings(newSettings);
  };

  const handleSilentWindowChange = async (key, value) => {
    const newSilentWindow = { ...reminderSettings.silentWindow, [key]: value };
    const newSettings = { ...reminderSettings, silentWindow: newSilentWindow };
    setReminderSettings(newSettings);
    await saveReminderSettings(newSettings);
  };

  const handleCleanupOldReminders = async () => {
    await cleanupOldReminders();
    Alert.alert('Éxito', 'Recordatorios antiguos eliminados correctamente');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FCFCF8' }}>
      <View style={styles.container}>
        <Text style={styles.title}>Ajustes</Text>
      
      {/* Sección de Recordatorios */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Recordatorios</Text>
        
        {/* Configuración de Ventana Silenciosa */}
        <View style={styles.settingItem}>
          <View style={styles.settingHeader}>
            <Text style={styles.settingTitle}>Ventana Silenciosa</Text>
            <Switch
              value={reminderSettings.silentWindow.enabled}
              onValueChange={(value) => handleSilentWindowChange('enabled', value)}
              trackColor={{ false: "#E8E8E8", true: "#3E7D75" }}
              thumbColor={reminderSettings.silentWindow.enabled ? "#fff" : "#f4f3f4"}
            />
          </View>
          {reminderSettings.silentWindow.enabled && (
            <Text style={styles.settingDescription}>
              Sin notificaciones de {reminderSettings.silentWindow.startTime} a {reminderSettings.silentWindow.endTime}
            </Text>
          )}
        </View>

        {/* Configuración de Badge */}
        <View style={styles.settingItem}>
          <View style={styles.settingHeader}>
            <Text style={styles.settingTitle}>Mostrar Badge</Text>
            <Switch
              value={reminderSettings.enableBadge}
              onValueChange={(value) => handleReminderSettingChange('enableBadge', value)}
              trackColor={{ false: "#E8E8E8", true: "#3E7D75" }}
              thumbColor={reminderSettings.enableBadge ? "#fff" : "#f4f3f4"}
            />
          </View>
          <Text style={styles.settingDescription}>
            Mostrar número de recordatorios pendientes
          </Text>
        </View>

        {/* Botón de Limpieza */}
        <TouchableOpacity 
          style={styles.cleanupButton}
          onPress={handleCleanupOldReminders}
          activeOpacity={0.7}
        >
          <View style={styles.optionContent}>
            <View style={styles.optionLeft}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="trash-outline" 
                  size={24} 
                  color="#E74C3C" 
                />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: '#E74C3C' }]}>Limpiar Recordatorios</Text>
                <Text style={styles.optionDescription}>
                  Eliminar recordatorios antiguos completados
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Sección de información */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ Información</Text>
        <Text style={styles.infoText}>
          Gestiona tus recordatorios y configuraciones de la aplicación desde esta pantalla.
        </Text>
        <Text style={styles.subtitle}>
          Próximamente: categorías, más opciones de personalización.
        </Text>
      </View>
    </View>
    </SafeAreaView>
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
  settingItem: {
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
  settingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4D3527",
  },
  settingDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  cleanupButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#FFE5E5",
  },
});
