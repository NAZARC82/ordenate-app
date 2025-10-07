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
      id="MainTabs"
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
          let iconName;
          
          if (route.name === 'HomeTab') {
            iconName = 'home-outline';
          } else if (route.name === 'CalendarTab') {
            iconName = 'calendar-outline';
          } else if (route.name === 'HistoryTab') {
            iconName = 'list-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = 'settings-outline';
          } else {
            iconName = 'apps-outline';
          }
          
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Inicio' }} />
      <Tab.Screen name="CalendarTab" component={CalendarStack} options={{ title: 'Almanaque' }} />
      <Tab.Screen name="HistoryTab" component={HistoryStack} options={{ title: 'Historial' }} />
      <Tab.Screen name="SettingsTab" component={SettingsStack} options={{ title: 'Ajustes' }} />
    </Tab.Navigator>
  );
}

