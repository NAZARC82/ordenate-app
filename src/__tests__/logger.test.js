// src/__tests__/logger.test.js
/**
 * Unit tests for logging utilities
 */

import { Logger, configureLogging } from '../utils/logger';

// Mock console methods
const mockConsole = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  log: jest.fn()
};

beforeEach(() => {
  // Replace console methods with mocks
  Object.assign(console, mockConsole);
  
  // Clear all mocks
  Object.values(mockConsole).forEach(mock => mock.mockClear());
  
  // Reset logging configuration
  configureLogging({
    enableConsole: true,
    enableRemote: false,
    logLevel: 'DEBUG'
  });
});

describe('Logger utilities', () => {
  
  describe('basic logging', () => {
    test('should log error messages', () => {
      Logger.error('Test error message', { userId: 123 });
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Test error message'),
        null
      );
    });

    test('should log warning messages', () => {
      Logger.warn('Test warning', { component: 'TestComponent' });
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Test warning')
      );
    });

    test('should log info messages', () => {
      Logger.info('Test info', { action: 'test' });
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Test info')
      );
    });

    test('should log debug messages', () => {
      Logger.debug('Test debug', { debug: true });
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG: Test debug')
      );
    });
  });

  describe('specialized loggers', () => {
    test('should log share errors with context', () => {
      const error = new Error('Share failed');
      error.code = 'SHARE_ERROR';
      
      Logger.shareError('PDF export', error, { filename: 'test.pdf' });
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Share/Export Error: PDF export'),
        error
      );
    });

    test('should log print errors with context', () => {
      const error = new Error('Print failed');
      
      Logger.printError('Print document', error, { pages: 5 });
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Print Error: Print document'),
        error
      );
    });

    test('should log export success', () => {
      Logger.exportSuccess('CSV export', { 
        filename: 'movements.csv',
        count: 10 
      });
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Export Success: CSV export')
      );
    });

    test('should log timing information', () => {
      const startTime = Date.now() - 1000; // 1 second ago
      
      Logger.timing('Database query', startTime, { query: 'SELECT * FROM users' });
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/Performance: Database query completed in \d+ms/)
      );
    });
  });

  describe('log levels', () => {
    test('should respect log level configuration', () => {
      configureLogging({ logLevel: 'ERROR' });
      
      Logger.debug('Debug message');
      Logger.info('Info message');
      Logger.warn('Warning message');
      Logger.error('Error message');
      
      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    test('should log WARN and above when configured for WARN', () => {
      configureLogging({ logLevel: 'WARN' });
      
      Logger.debug('Debug message');
      Logger.info('Info message');
      Logger.warn('Warning message');
      Logger.error('Error message');
      
      expect(mockConsole.log).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('console configuration', () => {
    test('should not log to console when disabled', () => {
      configureLogging({ enableConsole: false });
      
      Logger.error('Error message');
      Logger.warn('Warning message');
      Logger.info('Info message');
      Logger.debug('Debug message');
      
      expect(mockConsole.error).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.log).not.toHaveBeenCalled();
    });
  });

  describe('message formatting', () => {
    test('should include timestamp in log messages', () => {
      Logger.info('Test message');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: Test message/)
      );
    });

    test('should include context in log messages', () => {
      Logger.info('Test message', { userId: 123, action: 'login' });
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('{"userId":123,"action":"login"}')
      );
    });

    test('should handle empty context', () => {
      Logger.info('Test message', {});
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Test message ')
      );
    });
  });
});