// Mock de expo-file-system/legacy
// Usado por src/utils/fs.ts

module.exports = {
  documentDirectory: 'file://mock/',
  cacheDirectory: 'file://mock-cache/',
  
  // Encoding types
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
  
  // Operaciones de archivo
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  deleteAsync: jest.fn(() => Promise.resolve()),
  moveAsync: jest.fn(() => Promise.resolve()),
  downloadAsync: jest.fn((url, uri) => Promise.resolve({ uri })),
  
  // Operaciones de directorio
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  readDirectoryAsync: jest.fn(() => Promise.resolve([])),
  
  // Información de archivo
  getInfoAsync: jest.fn(() => Promise.resolve({ 
    exists: true, 
    size: 1024, 
    isDirectory: false,
    modificationTime: Date.now(),
    uri: 'file://mock/file.txt'
  })),
  
  // Para Android
  getContentUriAsync: jest.fn((uri) => Promise.resolve(uri.replace('file://', 'content://'))),
};
