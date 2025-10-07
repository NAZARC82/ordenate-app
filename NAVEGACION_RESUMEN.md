# 🧭 Arquitectura de Navegación - Ordénate

## Estructura Implementada

```
RootStack (App.js)
├── Tabs (TabNavigator) - id="MainTabs", headerShown: false
│   ├── HomeTab (HomeStack)
│   │   ├── Home (HomeScreen) 
│   │   ├── AddMovement (AgregarMovimientoScreen)
│   │   └── MovementDetail (MovementDetail)
│   ├── CalendarTab (CalendarStack)
│   │   └── Calendar (CalendarScreen)
│   ├── HistoryTab (HistoryStack)
│   │   └── History (HistoryScreen)
│   └── SettingsTab (SettingsStack)
│       └── Settings (SettingsScreen)
├── ReminderForm (Modal)
└── RemindersListScreen
```

## Navegación Cross-Tab (Desde HomeScreen)

### ✅ Navegación al Historial
```javascript
navigation.navigate('HistoryTab', { screen: 'History', initial: false })
```

### ✅ Navegación a Agregar Movimiento (Dentro del mismo stack)
```javascript
navigation.navigate("AddMovement", { tipo: "pago" })
navigation.navigate("AddMovement", { tipo: "cobro" })
```

### ✅ Navegación a Lista de Recordatorios (Modal del RootStack)
```javascript
navigation.navigate('RemindersListScreen')
```

### ✅ Navegación a Formulario de Recordatorios
```javascript
const parent = navigation.getParent();
parent.navigate('ReminderForm', { mode: 'create', type: 'general' });
```

## TabPress Listener

```javascript
useEffect(() => {
  const parent = navigation.getParent('MainTabs');
  if (!parent) return;
  
  const unsubscribe = parent.addListener('tabPress', (e) => {
    // Acciones cuando se presiona la tab de inicio
    console.log('🏠 Tab Inicio presionada');
  });
  
  return unsubscribe;
}, [navigation]);
```

## Sistema de Headers

- **RootStack**: headerShown: false
- **MainTabs**: headerShown: false
- **Individual Stacks**: headerShown: true (default)
- **RemindersListScreen**: headerTitle: 'Recordatorios', headerShown: true
- **ReminderForm**: headerShown: false (modal)

## File System Helper

### ✅ Centralizado en src/utils/fs.ts
```javascript
import { saveCSV, movePDF, csvName, pdfName } from '../utils/fs';

// Uso en csvExport.js y pdfExport.js
await saveCSV(csvContent, fileName);
await movePDF(pdfUri, fileName);
```

## Estado Actual
- ✅ Arquitectura implementada según recomendaciones
- ✅ Cross-navigation funcionando
- ✅ File system migrado y centralizado
- ✅ Headers configurados correctamente
- ✅ Navegaciones actualizadas en HomeScreen