// __mocks__/expo-file-system.js

// Mock de la clase File (nueva API de expo-file-system v19+)
class MockFile {
  constructor(uri) {
    this.uri = uri;
  }

  async getInfo() {
    // Simular archivo existente por defecto
    // Los tests individuales pueden sobrescribir este comportamiento
    return {
      exists: true,
      size: 1024,
      modificationTime: Date.now(),
      uri: this.uri,
      isDirectory: false
    };
  }

  async text() {
    return 'mock file content';
  }

  async bytes() {
    return new Uint8Array([]);
  }
}

module.exports = {
  documentDirectory: 'file://mock/',
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  deleteAsync: jest.fn(() => Promise.resolve()),
  
  // getInfoAsync: API principal para verificar archivos
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1024, isDirectory: false })),
  
  // Nueva API File (para compatibilidad futura)
  File: MockFile,
};
