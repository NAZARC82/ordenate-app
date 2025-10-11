// src/screens/PantallaAlmanaque.js
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { useMovimientos } from '../state/MovimientosContext';
import { getDateString, sameDay, getTodayString, toYMDLocal, parseYMDToLocal, todayLocalStart } from '../utils/date';
import { getDayStateMap, getColorForEstado } from '../utils/estadoDominante';
import { getEstadoColor } from '../utils/estadoColor';

// Configurar el calendario en español
LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero',
    'Febrero', 
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: "Hoy"
};
LocaleConfig.defaultLocale = 'es';

export default function PantallaAlmanaque() {
  const navigation = useNavigation();
  const { movimientos, resumenEstados, addMovimiento, updateMovimiento } = useMovimientos();
  const [selectedDay, setSelectedDay] = useState(getTodayString());

  const toISOFromSelected = (dayStr) => {
    // Usar parseYMDToLocal para evitar offsets de zona horaria
    const localDate = parseYMDToLocal(dayStr);
    // Convertir a ISO manteniendo la fecha local (ajustar a mediodía UTC)
    const [year, month, day] = dayStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString();
  };

  // Memoized day state map for performance
  const dayStateMap = useMemo(() => {
    return getDayStateMap(movimientos, getDateString);
  }, [movimientos]);

  // Optimized markedDates with custom text colors for day numbers (no dots)
  const markedDates = useMemo(() => {
    const marked = {};
    const today = getTodayString();
    
    // Add custom text colors for days with movements
    Object.keys(dayStateMap).forEach(dateKey => {
      const estadoDominante = dayStateMap[dateKey];
      const isSelected = selectedDay === dateKey;
      const isToday = dateKey === today;
      
      // Get base color for the state
      const estadoColor = getEstadoColor(estadoDominante);
      
      let customStyle = {};
      
      if (isSelected) {
        // Selected day: maintain selection background but preserve state color for text
        customStyle = {
          text: {
            color: '#FFFFFF', // White text for selected state for contrast
            fontWeight: '700'
          },
          container: {
            backgroundColor: '#3E7D75', // Selection background color
            borderRadius: 16
          }
        };
      } else if (estadoDominante) {
        // Day with movements: color the entire day number
        customStyle = {
          text: {
            color: estadoColor,
            fontWeight: '700', // Make it bold for visibility
            fontSize: 16 // Slightly larger for emphasis
          },
          container: {
            backgroundColor: 'rgba(255,255,255,0)', // Transparent background
            borderRadius: 16
          }
        };
      }
      
      // Apply custom style if we have one
      if (Object.keys(customStyle).length > 0) {
        marked[dateKey] = { customStyles: customStyle };
      }
    });
    
    // Mark selected day without movements (preserve selection style)
    if (selectedDay && !marked[selectedDay]) {
      const isToday = selectedDay === today;
      marked[selectedDay] = {
        customStyles: {
          text: {
            color: '#FFFFFF', // White text for contrast
            fontWeight: '700'
          },
          container: {
            backgroundColor: '#3E7D75', // Selection background
            borderRadius: 16
          }
        }
      };
    }
    
    return marked;
  }, [dayStateMap, selectedDay]);

  // Get movements for selected day
  const dayMovements = useMemo(() => {
    if (!selectedDay) return [];
    
    return movimientos
      .filter(mov => getDateString(mov.fechaISO) === selectedDay)
      .sort((a, b) => new Date(b.fechaISO) - new Date(a.fechaISO));
  }, [movimientos, selectedDay]);

  const onDayPress = useCallback((day) => {
    setSelectedDay(day.dateString);
  }, []);

  // Quick action handlers (placeholders that operate on existing state)
  const handleAgregarPago = useCallback(() => {
    navigation.navigate('MovementDetail', {
      mode: 'create',
      preset: { tipo: 'pago', fechaISO: toISOFromSelected(selectedDay) },
    });
  }, [navigation, selectedDay]);

  const handleAgregarCobro = useCallback(() => {
    navigation.navigate('MovementDetail', {
      mode: 'create',
      preset: { tipo: 'cobro', fechaISO: toISOFromSelected(selectedDay) },
    });
  }, [navigation, selectedDay]);

  const handleMarcarPagado = useCallback(() => {
    if (dayMovements.length > 0) {
      const firstPending = dayMovements.find(m => m.estado !== 'pagado');
      if (firstPending) {
        const result = updateMovimiento(firstPending.id, { estado: 'pagado' });
        if (!result.success) {
          console.warn('Error al marcar pagado:', result.error);
        }
      } else {
        console.log('No hay movimientos pendientes en este día');
      }
    }
  }, [dayMovements, updateMovimiento]);

  const handleVerPendientes = useCallback(() => {
    navigation.navigate('HistoryTab', { 
      screen: 'PantallaHistorial',
      params: {
        filter: { estado: 'no-pagado', day: selectedDay } 
      }
    });
  }, [navigation, selectedDay]);

  const renderMovementItem = ({ item }) => (
    <View style={styles.movementItem}>
      <View style={styles.movementHeader}>
        <Text style={styles.movementTipo}>
          {item.tipo === 'pago' ? 'Pago' : 'Cobro'}
        </Text>
        <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
          <Text style={styles.estadoText}>{item.estado}</Text>
        </View>
      </View>
      <Text style={styles.movementMonto}>${item.monto}</Text>
      {item.nota && <Text style={styles.movementNota}>{item.nota}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Resumen */}
        <View style={styles.resumenContainer}>
          <Text style={styles.title}>Almanaque</Text>
          <View style={styles.resumenRow}>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenLabel}>Total</Text>
              <Text style={styles.resumenValue}>${resumenEstados.total}</Text>
            </View>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenLabel}>Pagado</Text>
              <Text style={[styles.resumenValue, { color: '#4CAF50' }]}>
                ${resumenEstados.pagado}
              </Text>
            </View>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenLabel}>Falta</Text>
              <Text style={[styles.resumenValue, { color: '#FF4444' }]}>
                ${resumenEstados.falta}
              </Text>
            </View>
          </View>
        </View>

        {/* Leyenda */}
        <View style={styles.leyendaContainer}>
          <View style={styles.leyendaItem}>
            <View style={[styles.leyendaDot, { backgroundColor: '#FF4444' }]} />
            <Text style={styles.leyendaText}>Urgente</Text>
          </View>
          <View style={styles.leyendaItem}>
            <View style={[styles.leyendaDot, { backgroundColor: '#FFA500' }]} />
            <Text style={styles.leyendaText}>Pronto</Text>
          </View>
          <View style={styles.leyendaItem}>
            <View style={[styles.leyendaDot, { backgroundColor: '#FFD700' }]} />
            <Text style={styles.leyendaText}>Pendiente</Text>
          </View>
          <View style={styles.leyendaItem}>
            <View style={[styles.leyendaDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.leyendaText}>Pagado</Text>
          </View>
        </View>

        {/* Calendario */}
        <Calendar
          style={styles.calendar}
          onDayPress={onDayPress}
          markedDates={markedDates}
          markingType={'custom'}
          locale={'es'}
          theme={{
            backgroundColor: '#FFFFFF',
            calendarBackground: '#FFFFFF',
            textSectionTitleColor: '#4D3527',
            dayTextColor: '#2d4150',
            todayTextColor: '#3E7D75',
            selectedDayTextColor: '#FFFFFF',
            monthTextColor: '#4D3527',
            arrowColor: '#3E7D75',
          }}
        />

        {/* Acciones rápidas */}
        <View style={styles.accionesContainer}>
          <TouchableOpacity style={styles.accionBtn} onPress={handleAgregarPago}>
            <Text style={styles.accionText}>Agregar Pago</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accionBtn} onPress={handleAgregarCobro}>
            <Text style={styles.accionText}>Agregar Cobro</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accionBtn} onPress={handleMarcarPagado}>
            <Text style={styles.accionText}>Marcar Pagado</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accionBtn} onPress={handleVerPendientes}>
            <Text style={styles.accionText}>Ver Pendientes</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de movimientos del día seleccionado */}
        <View style={styles.dayMovementsContainer}>
          <Text style={styles.dayTitle}>
            Movimientos del {selectedDay || 'día seleccionado'}
          </Text>
          {dayMovements.length === 0 ? (
            <Text style={styles.emptyText}>No hay movimientos en este día</Text>
          ) : (
            <FlatList
              data={dayMovements}
              keyExtractor={item => String(item.id ?? item._id ?? `${item.tipo}-${item.fechaISO}`)}
              renderItem={renderMovementItem}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#FCFCF8',
    paddingHorizontal: 16,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold',
    color: '#4D3527', 
    marginBottom: 16 
  },
  resumenContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resumenItem: {
    alignItems: 'center',
  },
  resumenLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resumenValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4D3527',
  },
  leyendaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leyendaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  leyendaText: {
    fontSize: 12,
    color: '#4D3527',
  },
  calendar: {
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  accionesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  accionBtn: {
    width: '48%',
    backgroundColor: '#3E7D75',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  accionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  dayMovementsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4D3527',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  movementItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 12,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  movementTipo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4D3527',
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  estadoText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  movementMonto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 2,
  },
  movementNota: {
    fontSize: 12,
    color: '#666',
  },
});