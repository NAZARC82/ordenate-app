// src/modules/reminders/types.ts

/**
 * Tipos para el sistema de recordatorios
 */

export type ReminderType = 'pago' | 'cobro' | 'general';

export type ReminderStatus = 'programado' | 'enviado' | 'completado' | 'omitido';

// Configuración de tipos de recordatorios
export const REMINDER_TYPES: Record<ReminderType, string> = {
  pago: 'Pago',
  cobro: 'Cobro',
  general: 'General'
};

export const REMINDER_TYPE_COLORS: Record<ReminderType, string> = {
  pago: '#E74C3C', // Rojo
  cobro: '#27AE60', // Verde
  general: '#3498DB' // Azul
};

export const REMINDER_TYPE_ICONS: Record<ReminderType, string> = {
  pago: 'card-outline',
  cobro: 'cash-outline', 
  general: 'notifications-outline'
};

export type RepeatFrequency = 'nunca' | 'diario' | 'semanal' | 'mensual';

export interface Reminder {
  id: string;
  title: string;
  linkedMovementId?: string; // ID del movimiento asociado (opcional)
  type: ReminderType;
  datetimeISO: string; // Fecha y hora exacta ISO 8601
  advance: number[]; // Minutos antes: [1440, 60, 10] = 24h, 1h, 10min
  repeat: RepeatFrequency;
  snoozeOptions?: number[]; // Opciones de posponer en minutos [15, 60, 1440]
  status: ReminderStatus;
  notificationIds: string[]; // IDs de expo-notifications
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderDraft {
  title: string;
  linkedMovementId?: string;
  type: ReminderType;
  datetimeISO: string;
  advance: number[];
  repeat: RepeatFrequency;
  snoozeOptions?: number[];
  notes?: string;
}

export interface ReminderSettings {
  silentWindow: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string; // "08:00"
  };
  defaultSnoozeMinutes: number;
  enableBadge: boolean;
  timezone: string; // Auto-detectado del dispositivo
}

export interface NotificationActionResponse {
  actionId: string;
  reminderId: string;
  userText?: string;
}

// Constantes para las acciones de notificación
export const NOTIFICATION_ACTIONS = {
  MARK_PAID: 'mark_paid',
  COMPLETE: 'complete',
  SNOOZE_10MIN: 'snooze_10min',
  SNOOZE_1H: 'snooze_1h',
  SNOOZE_TOMORROW: 'snooze_tomorrow',
  OPEN_APP: 'open_app'
} as const;

// Constantes para las categorías de notificación
export const NOTIFICATION_CATEGORIES = {
  PAYMENT_REMINDER: 'payment_reminder',
  COLLECTION_REMINDER: 'collection_reminder',
  GENERAL_REMINDER: 'general_reminder'
} as const;

// Opciones predeterminadas
export const DEFAULT_ADVANCE_OPTIONS = [1440, 60, 10]; // 24h, 1h, 10min
export const DEFAULT_SNOOZE_OPTIONS = [15, 60, 1440]; // 15min, 1h, 24h
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  silentWindow: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00'
  },
  defaultSnoozeMinutes: 60,
  enableBadge: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
};