// src/navigation/SettingsStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import VistaPreviaExport from '../screens/VistaPreviaExport';

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VistaPreviaExport"
        component={VistaPreviaExport}
        options={{ headerShown: true, title: 'Exportar' }}
      />
    </Stack.Navigator>
  );
}