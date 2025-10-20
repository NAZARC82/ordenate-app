// __mocks__/expo-file-system.js

// Mock de la clase File (nueva API SDK 54+)
// La propiedad 'exists' es sincrónica, no un método
class MockFile {
  constructor(uri) {
    this.uri = uri;
    // exists es una PROPIEDAD, no método
    // Por defecto true, los tests pueden sobrescribir
    this._exists = true;
  }

  get exists() {
    return this._exists;
  }

  set exists(value) {
    this._exists = value;
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
  
  // getInfoAsync: DEPRECATED - usar File class
  // Mantenido para tests legacy que aún no migraron
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1024, isDirectory: false })),
  
  // Nueva API File SDK 54 (file.exists es propiedad)
  File: MockFile,
};
