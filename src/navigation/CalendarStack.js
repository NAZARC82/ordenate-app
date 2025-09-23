// src/navigation/CalendarStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CalendarScreen from '../screens/CalendarScreen';
import MovementDetail from '../screens/MovementDetail';
import HistoryScreen from '../screens/HistoryScreen';

const Stack = createNativeStackNavigator();

export default function CalendarStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CalendarMain"
        component={CalendarScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MovementDetail"
        component={MovementDetail}
        options={{
          title: 'Detalle del Movimiento',
          headerStyle: { backgroundColor: '#FAFAF7' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Historial"
        component={HistoryScreen}
        options={{
          title: 'Historial',
          headerStyle: { backgroundColor: '#FAFAF7' },
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}