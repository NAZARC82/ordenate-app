// jest.setup.ts
// Setup para Jest con React Native Testing Library

// @testing-library/react-native >= 12.4 ya incluye los matchers por defecto

// ✅ Configurar timezone UTC para tests deterministas
process.env.TZ = 'UTC';

// Extender el tipo global para Jest
declare global {
  var __ExpoImportMetaRegistry: any;
  namespace NodeJS {
    interface Global {
      require: any;
    }
  }
}

// Mock de structuredClone para Expo Winter Runtime
if (typeof (globalThis as any).structuredClone === 'undefined') {
  (globalThis as any).structuredClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Mock de Expo Winter Runtime (Expo SDK 54+)
(globalThis as any).__ExpoImportMetaRegistry = {
  register: () => {},
  get: () => undefined,
};

// Mock de require.context (usado por Expo Router)
const mockRequireContext = () => ({
  keys: () => [],
  resolve: () => '',
  id: '',
});

if (!(globalThis as any).require) {
  (globalThis as any).require = {};
}

if (!(globalThis as any).require.context) {
  (globalThis as any).require.context = mockRequireContext;
}

// ✅ Resetear mocks antes de cada test (para inspeccionar llamadas)
beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

// Silenciar warnings innecesarios en tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const msg = args[0];
  if (
    typeof msg === 'string' &&
    (msg.includes('Animated:') ||
     msg.includes('componentWillReceiveProps') ||
     msg.includes('Winter'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};
