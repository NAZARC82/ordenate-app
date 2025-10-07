// src/utils/logger.js
/**
 * Controlled logging utility for error tracking and telemetry
 */

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN', 
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Configuration - can be controlled via environment or settings
const LOG_CONFIG = {
  enableConsole: __DEV__, // Only in development
  enableRemote: false,    // For future remote logging
  logLevel: __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR
};

/**
 * Format log message with timestamp and context
 */
const formatLogMessage = (level, message, context = {}) => {
  const timestamp = new Date().toISOString();
  const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : '';
  return `[${timestamp}] ${level}: ${message} ${contextStr}`;
};

/**
 * Check if log level should be printed
 */
const shouldLog = (level) => {
  const levels = Object.values(LOG_LEVELS);
  const configIndex = levels.indexOf(LOG_CONFIG.logLevel);
  const messageIndex = levels.indexOf(level);
  return messageIndex <= configIndex;
};

/**
 * Core logging function
 */
const log = (level, message, context = {}, error = null) => {
  if (!shouldLog(level)) return;

  const formattedMessage = formatLogMessage(level, message, context);
  
  if (LOG_CONFIG.enableConsole) {
    switch (level) {
      case LOG_LEVELS.ERROR:
        console.error(formattedMessage, error);
        break;
      case LOG_LEVELS.WARN:
        console.warn(formattedMessage);
        break;
      case LOG_LEVELS.INFO:
        console.info(formattedMessage);
        break;
      case LOG_LEVELS.DEBUG:
        console.log(formattedMessage);
        break;
    }
  }

  // Future: Send to remote logging service
  if (LOG_CONFIG.enableRemote && level === LOG_LEVELS.ERROR) {
    // TODO: Implement remote logging
    // sendToAnalytics({ level, message, context, error: error?.message });
  }
};

/**
 * Public logging interface
 */
export const Logger = {
  error: (message, context = {}, error = null) => log(LOG_LEVELS.ERROR, message, context, error),
  warn: (message, context = {}) => log(LOG_LEVELS.WARN, message, context),
  info: (message, context = {}) => log(LOG_LEVELS.INFO, message, context),
  debug: (message, context = {}) => log(LOG_LEVELS.DEBUG, message, context),
  
  // Specific loggers for common use cases
  shareError: (operation, error, context = {}) => {
    log(LOG_LEVELS.ERROR, `Share/Export Error: ${operation}`, {
      operation,
      errorMessage: error?.message,
      errorCode: error?.code,
      ...context
    }, error);
  },
  
  printError: (operation, error, context = {}) => {
    log(LOG_LEVELS.ERROR, `Print Error: ${operation}`, {
      operation,
      errorMessage: error?.message,
      errorCode: error?.code,
      ...context
    }, error);
  },
  
  exportSuccess: (operation, context = {}) => {
    log(LOG_LEVELS.INFO, `Export Success: ${operation}`, {
      operation,
      ...context
    });
  },
  
  // Performance tracking
  timing: (operation, startTime, context = {}) => {
    const duration = Date.now() - startTime;
    log(LOG_LEVELS.INFO, `Performance: ${operation} completed in ${duration}ms`, {
      operation,
      duration,
      ...context
    });
  }
};

/**
 * Configure logging at runtime
 */
export const configureLogging = (config) => {
  Object.assign(LOG_CONFIG, config);
};

export default Logger;