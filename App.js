import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import { MovimientosProvider } from './src/state/MovimientosContext';
import * as Notifications from 'expo-notifications';

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
    <SafeAreaProvider>
      <MovimientosProvider>
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </MovimientosProvider>
    </SafeAreaProvider>
  );
}
