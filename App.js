import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import TabNavigator from './src/navigation/TabNavigator';
import ReminderFormScreen from './src/screens/reminders/ReminderFormScreen';
import { MovimientosProvider } from './src/state/MovimientosContext';
import * as Notifications from 'expo-notifications';

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
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MovimientosProvider>
          <NavigationContainer>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
              <RootStack.Screen name="Main" component={TabNavigator} />
              <RootStack.Screen 
                name="ReminderForm" 
                component={ReminderFormScreen} 
                options={{ 
                  presentation: 'modal',
                  headerShown: false 
                }} 
              />
            </RootStack.Navigator>
          </NavigationContainer>
        </MovimientosProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
