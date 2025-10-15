// src/navigation/SettingsStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import VistaPreviaExport from '../screens/VistaPreviaExport';
import DocumentManagerScreen from '../screens/DocumentManagerScreen';

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
      <Stack.Screen
        name="DocumentManager"
        component={DocumentManagerScreen}
        options={{ 
          headerShown: true, 
          title: 'Gestor de Documentos',
          headerStyle: { backgroundColor: '#FCFCF8' },
          headerTintColor: '#4D3527',
          headerTitleStyle: { fontWeight: '700' }
        }}
      />
    </Stack.Navigator>
  );
}