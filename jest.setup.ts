// jest.setup.ts
// Setup para Jest con React Native Testing Library

// Necesario para @testing-library/react-native >= 12.4
import '@testing-library/react-native/extend-expect';

// Mock AsyncStorage
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Expo modules comunes
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://mock/',
  makeDirectoryAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true })),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
}));

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file://mock/test.pdf' })),
}));

// Mock de notificaciones si es necesario
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
}));

// Silenciar warnings de React Native en tests
jest.spyOn(console, 'warn').mockImplementation((msg) => {
  if (
    msg.includes('Animated:') ||
    msg.includes('componentWillReceiveProps')
  ) {
    return;
  }
  console.warn(msg);
});
