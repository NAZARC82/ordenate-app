import React, { useContext, useMemo, useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/native'

import { MovimientosContext } from '../state/MovimientosContext'
import { formatCurrencyWithSymbol } from '../utils/format'
import { ReminderService } from '../modules/reminders'

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { totalesInicio } = useContext(MovimientosContext);
  const [reminderBadgeCount, setReminderBadgeCount] = useState(0);
  
  const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const totalDebes = toNum(totalesInicio?.debes);
  const totalTeDeben = toNum(totalesInicio?.teDeben);
  const balance = toNum(totalesInicio?.balance);

  // Ejemplo: Listener para tabPress del MainTabs
  useEffect(() => {
    const parent = navigation.getParent('MainTabs');
    if (!parent) return;
    
    const unsubscribe = parent.addListener('tabPress', (e) => {
      // Ejemplo: scroll-to-top o refresh cuando se toca la tab de inicio
      console.log('🏠 Tab Inicio presionada - podríamos hacer scroll-to-top aquí');
    });
    
    return unsubscribe;
  }, [navigation]);

  // Inicializar servicio de recordatorios y obtener badge count
  useEffect(() => {
    const initializeReminders = async () => {
      try {
        await ReminderService.initialize();
        const badgeCount = await ReminderService.getBadgeCount();
        setReminderBadgeCount(badgeCount);
      } catch (error) {
        console.error('Error inicializando recordatorios:', error);
      }
    };

    initializeReminders();
  }, []);

  // Actualizar badge count cuando la pantalla esté en foco
  useFocusEffect(
    React.useCallback(() => {
      const updateBadgeCount = async () => {
        try {
          const badgeCount = await ReminderService.getBadgeCount();
          setReminderBadgeCount(badgeCount);
        } catch (error) {
          console.error('Error actualizando badge count:', error);
        }
      };

      updateBadgeCount();
    }, [])
  );

  return (
    <SafeAreaView style={s.safeContainer}>
      <View style={s.container}>
        {/* Header con título centrado */}
      <View style={s.header}>
        {/* Acceso rápido deshabilitado: ya existe tab "Almanaque" abajo */}
        {/* <Ionicons
          name="calendar-outline"
          size={24}
          color="#1b1b1b"
          onPress={() => navigation.navigate('HistoryTab', { screen: 'History', initial: false })}
        /> */}
        <Text style={s.title}>Ordénate</Text>
        <TouchableOpacity 
          style={s.notificationButton}
          onPress={() => navigation.navigate('RemindersListScreen')}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color="#1b1b1b"
          />
          {reminderBadgeCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>
                {reminderBadgeCount > 99 ? '99+' : reminderBadgeCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Buscar */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color="#555" style={{ marginRight: 8 }} />
        <TextInput placeholder="Buscar" placeholderTextColor="#555" style={s.search}/>
      </View>

      {/* Resumen */}
      <View style={s.summary}>
  <Line label="Debes" value={formatCurrencyWithSymbol(totalDebes)} />
  <Line label="Te deben" value={formatCurrencyWithSymbol(totalTeDeben)} />
<Line 
  label="Balance" 
  value={formatCurrencyWithSymbol(Number.isFinite(balance) ? balance : 0)} 
  color={balance >= 0 ? "green" : "red"} 
/>
</View>


      <BigBtn label="Agregar pago"  color="#DCE8FB" onPress={() => navigation.navigate("AddMovement", { tipo: "pago" })}/>
      <BigBtn label="Agregar cobro" color="#E7F7E9" onPress={() => navigation.navigate("AddMovement", { tipo: "cobro" })}/>
      <BigBtn label="Recordatorio" color="#FDEDC6" onPress={() => {
        // Navegar al RootStack para acceder al modal ReminderForm
        const parent = navigation.getParent();
        if (parent) {
          parent.navigate('ReminderForm', { 
            mode: 'create', 
            type: 'general', 
            linkedMovementId: null 
          });
        } else {
          console.warn('No se pudo acceder al RootStack para navegación a ReminderForm');
        }
      }}/>
      </View>
    </SafeAreaView>
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
  safeContainer: {
    flex: 1,
    backgroundColor: '#FCFCF8',
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#111" },

  notificationButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

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

  summary: { marginTop: 4, marginBottom: 16, gap: 8 },
  line: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  label: { fontSize: 18, color: "#333" },
  amount: { fontSize: 18, fontWeight: "700", color: "#111" },

  bigBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginVertical: 8,
    height: 68,
    width: '100%',
  },
  plusCircle: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center", marginRight: 12
  },
  plusText: { fontSize: 22, fontWeight: "700", color: "#2a66b8" },
  bigBtnText: { fontSize: 22, fontWeight: "800", color: "#111" },
});
