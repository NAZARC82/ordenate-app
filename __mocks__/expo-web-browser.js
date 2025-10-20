// __mocks__/expo-web-browser.js
// Mock para WebBrowser (fallback de openWith cuando Sharing no disponible)

module.exports = {
  openBrowserAsync: jest.fn((url, options) => 
    Promise.resolve({
      type: 'dismiss', // Usuario cerró el navegador
      url
    })
  ),
  
  dismissBrowser: jest.fn(() => Promise.resolve()),
  
  mayInitWithUrlAsync: jest.fn(() => Promise.resolve({})),
  
  warmUpAsync: jest.fn(() => Promise.resolve({})),
  
  coolDownAsync: jest.fn(() => Promise.resolve({})),
};
