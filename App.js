import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import TabNavigator from './src/navigation/TabNavigator';
import ReminderFormScreen from './src/screens/reminders/ReminderFormScreen';
import RemindersListScreen from './src/screens/reminders/RemindersListScreen';
import { MovimientosProvider } from './src/state/MovimientosContext';
import * as Notifications from 'expo-notifications';

// Temporal: Test del nuevo sistema de archivos
import { runFileSystemTests } from './src/utils/testFs';

const RootStack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  // si usás permisos de notificaciones, dejalos acá dentro
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') await Notifications.requestPermissionsAsync();
      
      // Temporal: Testear nuevo sistema de archivos
      console.log('\n🚀 Iniciando tests del sistema de archivos...');
      try {
        const testResults = await runFileSystemTests();
        console.log('📊 Resultados del test:', testResults);
      } catch (error) {
        console.error('❌ Error en tests:', error);
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MovimientosProvider>
          <NavigationContainer>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
              <RootStack.Screen 
                name="Tabs" 
                component={TabNavigator} 
                options={{ headerShown: false }}
              />
              <RootStack.Screen 
                name="ReminderForm" 
                component={ReminderFormScreen} 
                options={{ 
                  presentation: 'modal',
                  headerShown: false 
                }} 
              />
              <RootStack.Screen 
                name="RemindersListScreen" 
                component={RemindersListScreen} 
                options={{ 
                  headerTitle: 'Recordatorios',
                  headerShown: true 
                }} 
              />
            </RootStack.Navigator>
          </NavigationContainer>
        </MovimientosProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
