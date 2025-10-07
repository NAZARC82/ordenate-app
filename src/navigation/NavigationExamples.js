// src/navigation/NavigationExamples.js
// Ejemplos de navegación entre tabs y stacks en la arquitectura estable

/**
 * ARQUITECTURA ACTUAL:
 * RootStack -> Main(Tabs id:"MainTabs", headerShown:false) -> {HomeStack, CalendarStack, HistoryStack, SettingsStack}
 */

// =======================
// 1) NAVEGACIÓN BÁSICA ENTRE TABS
// =======================

// Ir al tab Historial
navigation.navigate('Historial');

// Ir al tab Almanaque  
navigation.navigate('Almanaque');

// =======================
// 2) NAVEGACIÓN A PANTALLAS ESPECÍFICAS DENTRO DE STACKS
// =======================

// Ir a PantallaHistorial dentro del HistoryStack
navigation.navigate('Historial', { 
  screen: 'PantallaHistorial',
  params: { activateSelection: true }
});

// Ir a MovementDetail desde cualquier lugar
navigation.navigate('Historial', {
  screen: 'MovementDetail', 
  params: { mode: 'edit', id: 'movement123' }
});

// Ir a PantallaAlmanaque en CalendarStack
navigation.navigate('Almanaque', {
  screen: 'PantallaAlmanaque',
  params: { selectedDate: '2025-10-03' }
});

// =======================
// 3) NAVEGACIÓN CON INITIAL ROUTE CONTROL
// =======================

// Forzar reset y ir a pantalla específica
navigation.navigate('Historial', {
  screen: 'PantallaHistorial',
  initial: false, // Esto ignora initialRouteName
  params: { resetFilters: true }
});

// =======================
// 4) NAVEGACIÓN MODAL (desde RootStack)
// =======================

// Abrir modal de recordatorio (ya configurado)
navigation.navigate('ReminderForm', {
  mode: 'create',
  movementId: 'movement123'
});

// =======================
// 5) EVENTOS DEL TAB NAVIGATOR
// =======================

// Escuchar eventos de cambio de tab
const unsubscribe = navigation.getParent('MainTabs')?.addListener('tabPress', (e) => {
  // e.target contiene el nombre del tab presionado
  console.log('Tab presionado:', e.target);
  
  // Prevenir navegación si es necesario
  // e.preventDefault();
});

// Limpiar listener
// unsubscribe();

// =======================
// 6) CASOS ESPECIALES
// =======================

// Navegar desde HomeStack a VistaPreviaExport (en HomeStack)
navigation.navigate('VistaPreviaExport', {
  htmlContent: '<html>...</html>',
  titulo: 'Reporte PDF'
});

// Navegar desde SettingsStack a VistaPreviaExport (en SettingsStack)  
navigation.navigate('VistaPreviaExport', {
  htmlContent: '<html>...</html>',
  titulo: 'Exportación'
});

// =======================
// 7) NAVEGACIÓN CON RESET COMPLETO
// =======================

// Reset completo de navegación (si fuera necesario)
navigation.reset({
  index: 0,
  routes: [
    {
      name: 'Main',
      state: {
        routes: [
          { name: 'Historial', params: { screen: 'PantallaHistorial' } }
        ],
        index: 2, // índice del tab Historial
      },
    },
  ],
});

export default {
  // Este archivo es solo para documentación
  // No exporta funciones ejecutables
};