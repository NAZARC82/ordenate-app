import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './src/navigation/TabNavigator';
import { MovimientosProvider } from './src/state/MovimientosContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <MovimientosProvider>
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </MovimientosProvider>
    </SafeAreaProvider>
  );
}
