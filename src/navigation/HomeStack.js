// src/navigation/HomeStack.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import MovementDetail from '../screens/MovementDetail';
import AgregarMovimientoScreen from '../screens/AgregarMovimientoScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
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
      <Stack.Screen
        name="AgregarMovimiento"
        component={AgregarMovimientoScreen}
        options={({ route }) => ({
          title: route?.params?.tipo === 'cobro' ? 'Nuevo Cobro' : 'Nuevo Pago',
          headerStyle: { backgroundColor: '#FAFAF7' },
          headerShadowVisible: false,
        })}
      />
    </Stack.Navigator>
  );
}
