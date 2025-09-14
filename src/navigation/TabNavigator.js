// src/navigation/TabNavigator.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// PANTALLAS
import HomeStack from './HomeStack';
import HistoryChips from '../screens/HistoryChips';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#D6D9DD', height: 68, borderTopWidth: 0 },
        tabBarLabelStyle: { fontSize: 12, marginBottom: 4 },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#666',
        tabBarIcon: ({ focused, color, size }) => {
          let icon = 'home-outline';
          if (route.name === 'Inicio')     icon = focused ? 'home'     : 'home-outline';
          if (route.name === 'Historial')  icon = focused ? 'time'     : 'time-outline';
          if (route.name === 'Ajustes')    icon = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeStack} />
      <Tab.Screen name="Historial" component={HistoryChips} />
      <Tab.Screen name="Ajustes" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
