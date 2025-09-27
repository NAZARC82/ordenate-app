// src/modules/reminders/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder, ReminderSettings, DEFAULT_REMINDER_SETTINGS } from './types';

/**
 * Gestión de almacenamiento para recordatorios usando AsyncStorage
 */

const STORAGE_KEYS = {
  REMINDERS: 'reminders:v1',
  SETTINGS: 'reminder_settings:v1'
} as const;

/**
 * Obtener todos los recordatorios
 */
export async function getReminders(): Promise<Reminder[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (!stored) return [];
    
    const reminders = JSON.parse(stored) as Reminder[];
    return reminders.filter(r => r && typeof r === 'object' && r.id);
  } catch (error) {
    console.error('[Reminders] Error al cargar recordatorios:', error);
    return [];
  }
}

/**
 * Guardar recordatorio (crear o actualizar)
 */
export async function saveReminder(reminder: Reminder): Promise<void> {
  try {
    const reminders = await getReminders();
    const existingIndex = reminders.findIndex(r => r.id === reminder.id);
    
    if (existingIndex >= 0) {
      // Actualizar existente
      reminders[existingIndex] = {
        ...reminder,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Crear nuevo
      reminders.push({
        ...reminder,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    console.log('[Reminders] Recordatorio guardado:', reminder.id);
  } catch (error) {
    console.error('[Reminders] Error al guardar recordatorio:', error);
    throw error;
  }
}

/**
 * Eliminar recordatorio
 */
export async function deleteReminder(id: string): Promise<void> {
  try {
    const reminders = await getReminders();
    const filtered = reminders.filter(r => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(filtered));
    console.log('[Reminders] Recordatorio eliminado:', id);
  } catch (error) {
    console.error('[Reminders] Error al eliminar recordatorio:', error);
    throw error;
  }
}

/**
 * Obtener recordatorio por ID
 */
export async function getReminderById(id: string): Promise<Reminder | null> {
  try {
    const reminders = await getReminders();
    return reminders.find(r => r.id === id) || null;
  } catch (error) {
    console.error('[Reminders] Error al obtener recordatorio:', error);
    return null;
  }
}

/**
 * Obtener recordatorios por movimiento vinculado
 */
export async function getRemindersByMovement(movementId: string): Promise<Reminder[]> {
  try {
    const reminders = await getReminders();
    return reminders.filter(r => r.linkedMovementId === movementId);
  } catch (error) {
    console.error('[Reminders] Error al obtener recordatorios por movimiento:', error);
    return [];
  }
}

/**
 * Obtener recordatorios programados para las próximas X horas
 */
export async function getUpcomingReminders(hoursAhead: number = 24): Promise<Reminder[]> {
  try {
    const reminders = await getReminders();
    const now = new Date();
    const limitTime = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000));
    
    return reminders.filter(r => {
      if (r.status !== 'programado') return false;
      
      const reminderTime = new Date(r.datetimeISO);
      return reminderTime >= now && reminderTime <= limitTime;
    });
  } catch (error) {
    console.error('[Reminders] Error al obtener recordatorios próximos:', error);
    return [];
  }
}

/**
 * Actualizar estado de recordatorio
 */
export async function updateReminderStatus(id: string, status: Reminder['status']): Promise<void> {
  try {
    const reminder = await getReminderById(id);
    if (!reminder) throw new Error(`Recordatorio ${id} no encontrado`);
    
    reminder.status = status;
    reminder.updatedAt = new Date().toISOString();
    
    await saveReminder(reminder);
  } catch (error) {
    console.error('[Reminders] Error al actualizar estado:', error);
    throw error;
  }
}

/**
 * Actualizar IDs de notificación de un recordatorio
 */
export async function updateReminderNotificationIds(id: string, notificationIds: string[]): Promise<void> {
  try {
    const reminder = await getReminderById(id);
    if (!reminder) throw new Error(`Recordatorio ${id} no encontrado`);
    
    reminder.notificationIds = notificationIds;
    reminder.updatedAt = new Date().toISOString();
    
    await saveReminder(reminder);
  } catch (error) {
    console.error('[Reminders] Error al actualizar notification IDs:', error);
    throw error;
  }
}

/**
 * Obtener configuración de recordatorios
 */
export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) return DEFAULT_REMINDER_SETTINGS;
    
    const settings = JSON.parse(stored) as ReminderSettings;
    // Merge con defaults para asegurar que todas las propiedades estén presentes
    return { ...DEFAULT_REMINDER_SETTINGS, ...settings };
  } catch (error) {
    console.error('[Reminders] Error al cargar configuración:', error);
    return DEFAULT_REMINDER_SETTINGS;
  }
}

/**
 * Guardar configuración de recordatorios
 */
export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    console.log('[Reminders] Configuración guardada');
  } catch (error) {
    console.error('[Reminders] Error al guardar configuración:', error);
    throw error;
  }
}

/**
 * Limpiar recordatorios completados más antiguos de X días
 */
export async function cleanupOldReminders(daysOld: number = 30): Promise<number> {
  try {
    const reminders = await getReminders();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const toKeep = reminders.filter(r => {
      if (r.status !== 'completado') return true; // Mantener no completados
      
      const updatedDate = new Date(r.updatedAt);
      return updatedDate > cutoffDate; // Mantener completados recientes
    });
    
    const removedCount = reminders.length - toKeep.length;
    
    if (removedCount > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(toKeep));
      console.log(`[Reminders] Limpieza: ${removedCount} recordatorios antiguos eliminados`);
    }
    
    return removedCount;
  } catch (error) {
    console.error('[Reminders] Error en limpieza:', error);
    return 0;
  }
}