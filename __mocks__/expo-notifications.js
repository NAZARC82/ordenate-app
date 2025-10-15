// __mocks__/expo-notifications.js
module.exports = {
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('mock-notification-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
};
