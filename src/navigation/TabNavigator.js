import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from "@expo/vector-icons";

// Import your screens
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AgregarMovimientoScreen from '../screens/AgregarMovimientoScreen';

const Stack = createNativeStackNavigator();

const Tab = createBottomTabNavigator();

function TabNavigation() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#D6D9DD',
          borderTopWidth: 0,
          height: 70,                // altura total del tab bar
          position: 'absolute',      // se pega abajo
          left: 0,
          right: 0,
          bottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,           // baja un poco el texto
        },
        tabBarIconStyle: {
          marginTop: 5,              // sube un poco el ícono
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#555',
      }}
    >
      <Tab.Screen 
        name="Inicio" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Historial" 
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Ajustes" 
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TabNav" 
        component={TabNavigation} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AgregarMovimiento" 
        component={AgregarMovimientoScreen}
        options={({ route }) => ({
          title: route.params.tipo === 'pago' ? 'Nuevo Pago' : 'Nuevo Cobro',
          headerStyle: {
            backgroundColor: '#FAFAF7',
          },
          headerShadowVisible: false,
        })}
      />
    </Stack.Navigator>
  );
}
