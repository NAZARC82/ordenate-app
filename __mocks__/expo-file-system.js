// __mocks__/expo-file-system.js
module.exports = {
  documentDirectory: 'file://mock/',
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  deleteAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 0 })),
};
