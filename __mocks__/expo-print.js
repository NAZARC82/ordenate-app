// __mocks__/expo-print.js
module.exports = {
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file://mock/test.pdf' })),
};
