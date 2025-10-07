// src/navigation/HomeStack.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import MovementDetail from '../screens/MovementDetail';
import AgregarMovimientoScreen from '../screens/AgregarMovimientoScreen';
import VistaPreviaExport from '../screens/VistaPreviaExport';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddMovement"
        component={AgregarMovimientoScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route?.params?.tipo === 'cobro' ? 'Nuevo Cobro' : 'Nuevo Pago',
        })}
      />
      <Stack.Screen
        name="MovementDetail"
        component={MovementDetail}
        options={{ headerShown: true, title: 'Detalle' }}
      />
      <Stack.Screen
        name="VistaPreviaExport"
        component={VistaPreviaExport}
        options={{ headerShown: true, title: 'Exportar' }}
      />
    </Stack.Navigator>
  );
}
