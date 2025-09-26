// src/navigation/TabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeStack from './HomeStack';
import CalendarStack from './CalendarStack';
import HistoryStack from './HistoryStack';
import SettingsStack from './SettingsStack';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#3E7D75',
        tabBarInactiveTintColor: '#685344CC',
        // Mantener color y subir íconos/labels
        safeAreaInsets: { bottom: 0 },     // no agregues extra-inset abajo
        tabBarStyle: {
          backgroundColor: '#DBD2C5',
          borderTopColor: '#DBD2C5',
          height: 64,          // un poco más alto para respirar
          paddingTop: 4,
          paddingBottom: 12,   // esto los eleva visualmente
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: 6,    // leve empujón hacia arriba
        },
        tabBarLabelStyle: {
          marginTop: 0,
          fontSize: 12,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = { Inicio: 'home', Almanaque: 'calendar', Historial: 'time', Ajustes: 'settings' };
          const name = icons[route.name] || 'apps';
          return <Ionicons name={name} size={26} color={color} />; // un toque más grandes
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeStack} />
      <Tab.Screen name="Almanaque" component={CalendarStack} />
      <Tab.Screen name="Historial" component={HistoryStack} />
      <Tab.Screen name="Ajustes" component={SettingsStack} />
    </Tab.Navigator>
  );
}

