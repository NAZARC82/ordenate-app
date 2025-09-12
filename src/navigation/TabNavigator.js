// src/navigation/TabNavigator.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeStack from './HomeStack';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#D6D9DD', height: 70, borderTopWidth: 0 },
        tabBarLabelStyle: { fontSize: 12, marginBottom: 5 },
        tabBarIconStyle: { marginTop: 5 },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#555',
        tabBarIcon: ({ focused, color, size }) => {
          let icon = 'home-outline';
          if (route.name === 'Home') icon = focused ? 'home' : 'home-outline';
          if (route.name === 'History') icon = focused ? 'time' : 'time-outline';
          if (route.name === 'Settings') icon = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
