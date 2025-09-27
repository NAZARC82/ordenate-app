// src/modules/reminders/index.ts

/**
 * Módulo de recordatorios - Punto de entrada principal
 */

export * from './types';
export * from './storage';
export { ReminderService } from './ReminderService';

// Re-exportar tipos comunes
export type {
  Reminder,
  ReminderDraft,
  ReminderSettings,
  ReminderType,
  ReminderStatus,
  RepeatFrequency
} from './types';