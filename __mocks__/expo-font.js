// Mock para expo-font
export default {
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
  processFontFamily: jest.fn((name) => name),
};

export const loadAsync = jest.fn(() => Promise.resolve());
export const isLoaded = jest.fn(() => true);
export const isLoading = jest.fn(() => false);
