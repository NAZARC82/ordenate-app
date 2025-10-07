// src/navigation/HistoryStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HistoryScreen from '../screens/HistoryScreen';
import PantallaHistorial from '../screens/PantallaHistorial';
import MovementDetail from '../screens/MovementDetail';
import { ReminderFormScreen } from '../screens/reminders';

const Stack = createNativeStackNavigator();

export default function HistoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PantallaHistorial"
        component={PantallaHistorial}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MovementDetail"
        component={MovementDetail}
        options={{ headerShown: true, title: 'Detalle' }}
      />
    </Stack.Navigator>
  );
}