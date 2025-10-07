// src/navigation/CalendarStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CalendarScreen from '../screens/CalendarScreen';
import PantallaAlmanaque from '../screens/PantallaAlmanaque';
import MovementDetail from '../screens/MovementDetail';
import HistoryScreen from '../screens/HistoryScreen';

const Stack = createNativeStackNavigator();

export default function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Almanaque"
        component={PantallaAlmanaque}
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