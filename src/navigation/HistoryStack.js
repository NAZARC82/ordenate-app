// src/navigation/HistoryStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HistoryScreen from '../screens/HistoryScreen';
import MovementDetail from '../screens/MovementDetail';

const Stack = createNativeStackNavigator();

export default function HistoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HistoryMain"
        component={HistoryScreen}
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
    </Stack.Navigator>
  );
}