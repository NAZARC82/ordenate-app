// jest.config.js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx|js)'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|expo-.*|@expo|@expo/.*|@unimodules|react-clone-referenced-element|@testing-library)/)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // ✅ Mapeos explícitos de mocks (evita sorpresas con automock)
  moduleNameMapper: {
    // Mocks de Expo
    '^expo-file-system$': '<rootDir>/__mocks__/expo-file-system.js',
    '^expo-sharing$': '<rootDir>/__mocks__/expo-sharing.js',
    '^expo-print$': '<rootDir>/__mocks__/expo-print.js',
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '^expo-asset$': '<rootDir>/__mocks__/expo-asset.js',
    '^expo-font$': '<rootDir>/__mocks__/expo-font.js',
    '^@expo/vector-icons$': '<rootDir>/__mocks__/@expo/vector-icons.js',
    '^@expo/vector-icons/(.*)$': '<rootDir>/__mocks__/@expo/vector-icons.js',
    
    // Mocks de React Native Community
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/@react-native-async-storage/async-storage.js',
    
    // Mocks de assets
    '\\.(png|jpg|jpeg|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  globals: {
    '__DEV__': true,
  },
  modulePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.expo/'],
};
