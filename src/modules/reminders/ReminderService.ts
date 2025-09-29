// src/modules/reminders/ReminderService.ts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Reminder, 
  ReminderDraft, 
  ReminderSettings,
  NOTIFICATION_ACTIONS,
  NOTIFICATION_CATEGORIES,
  DEFAULT_SNOOZE_OPTIONS 
} from './types';
import * as ReminderStorage from './storage';

/**
 * Servicio principal para manejo de recordatorios y notificaciones
 */

// Configurar el handler de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class ReminderServiceClass {
  private initialized = false;

  /**
   * Inicializar el servicio de recordatorios
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      console.log('[ReminderService] Inicializando...');
      
      // Configurar categorías de notificación con acciones
      await this.setupNotificationCategories();
      
      // Solicitar permisos
      const hasPermissions = await this.requestPermissions();
      
      if (hasPermissions) {
        // Configurar listeners de notificaciones
        this.setupNotificationListeners();
        
        // Reconciliar notificaciones al iniciar
        await this.reconcileOnAppStart();
      }
      
      this.initialized = true;
      console.log('[ReminderService] Inicializado correctamente');
      return hasPermissions;
    } catch (error) {
      console.error('[ReminderService] Error en inicialización:', error);
      return false;
    }
  }

  /**
   * Solicitar permisos de notificación
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.warn('[ReminderService] No es un dispositivo físico, notifications no disponibles');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[ReminderService] Permisos de notificación denegados');
        return false;
      }

      // Configurar canal de notificación en Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reminder-channel', {
          name: 'Recordatorios',
          description: 'Notificaciones de recordatorios de pagos y cobros',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3498DB',
          sound: 'default',
        });
      }

      console.log('[ReminderService] Permisos concedidos');
      return true;
    } catch (error) {
      console.error('[ReminderService] Error solicitando permisos:', error);
      return false;
    }
  }

  /**
   * Configurar categorías de notificación con acciones rápidas
   */
  private async setupNotificationCategories(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.PAYMENT_REMINDER, [
        {
          identifier: NOTIFICATION_ACTIONS.COMPLETE,
          buttonTitle: '✅ Completar',
          options: { opensAppToForeground: false }
        },
        {
          identifier: NOTIFICATION_ACTIONS.SNOOZE_10MIN,
          buttonTitle: '⏰ Posponer 10min',
          options: { opensAppToForeground: false }
        }
      ]);

      await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.COLLECTION_REMINDER, [
        {
          identifier: NOTIFICATION_ACTIONS.COMPLETE,
          buttonTitle: '✅ Completar',
          options: { opensAppToForeground: false }
        },
        {
          identifier: NOTIFICATION_ACTIONS.SNOOZE_10MIN,
          buttonTitle: '⏰ Posponer 10min',
          options: { opensAppToForeground: false }
        }
      ]);

      await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.GENERAL_REMINDER, [
        {
          identifier: NOTIFICATION_ACTIONS.COMPLETE,
          buttonTitle: '✅ Completar',
          options: { opensAppToForeground: false }
        },
        {
          identifier: NOTIFICATION_ACTIONS.SNOOZE_10MIN,
          buttonTitle: '⏰ Posponer 10min',
          options: { opensAppToForeground: false }
        }
      ]);

      console.log('[ReminderService] Categorías de notificación configuradas');
    } catch (error) {
      console.error('[ReminderService] Error configurando categorías:', error);
    }
  }

  /**
   * Configurar listeners de notificaciones
   */
  private setupNotificationListeners(): void {
    // Listener para acciones de notificación
    Notifications.addNotificationResponseReceivedListener(async (response) => {
      try {
        console.log('[ReminderService] Acción de notificación recibida:', response.actionIdentifier);
        
        const reminderId = response.notification.request.content.data?.reminderId as string;
        if (!reminderId) return;

        switch (response.actionIdentifier) {
          case NOTIFICATION_ACTIONS.MARK_PAID:
            await this.handleMarkPaidAction(reminderId);
            break;
          case NOTIFICATION_ACTIONS.COMPLETE:
            await this.completeReminder(reminderId);
            break;
          case NOTIFICATION_ACTIONS.SNOOZE_10MIN:
            await this.snoozeReminder(reminderId, 10);
            break;
          case NOTIFICATION_ACTIONS.SNOOZE_1H:
            await this.snoozeReminder(reminderId, 60);
            break;
          case NOTIFICATION_ACTIONS.SNOOZE_TOMORROW:
            await this.snoozeTomorrowMorning(reminderId);
            break;
          case Notifications.DEFAULT_ACTION_IDENTIFIER:
            // Abrir app (comportamiento por defecto)
            console.log('[ReminderService] Abriendo app por notificación');
            break;
        }
      } catch (error) {
        console.error('[ReminderService] Error manejando acción de notificación:', error);
      }
    });

    // Listener para notificaciones recibidas mientras la app está activa
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('[ReminderService] Notificación recibida:', notification.request.identifier);
    });
  }

  /**
   * Crear un nuevo recordatorio
   */
  async createReminder(draft: ReminderDraft): Promise<Reminder> {
    try {
      const id = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const reminder: Reminder = {
        id,
        title: draft.title,
        linkedMovementId: draft.linkedMovementId,
        type: draft.type,
        datetimeISO: draft.datetimeISO,
        advance: draft.advance,
        repeat: draft.repeat,
        snoozeOptions: draft.snoozeOptions || DEFAULT_SNOOZE_OPTIONS,
        status: 'programado',
        notificationIds: [],
        notes: draft.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Programar notificaciones
      const notificationIds = await this.scheduleNotifications(reminder);
      reminder.notificationIds = notificationIds;

      // Guardar en storage
      await ReminderStorage.saveReminder(reminder);

      console.log('[ReminderService] Recordatorio creado:', id);
      return reminder;
    } catch (error) {
      console.error('[ReminderService] Error creando recordatorio:', error);
      throw error;
    }
  }

  /**
   * Actualizar un recordatorio existente
   */
  async updateReminder(updatedReminder: Reminder): Promise<void> {
    try {
      // Cancelar notificaciones previas
      await this.cancelNotifications(updatedReminder.notificationIds);

      // Programar nuevas notificaciones
      const notificationIds = await this.scheduleNotifications(updatedReminder);
      updatedReminder.notificationIds = notificationIds;
      updatedReminder.updatedAt = new Date().toISOString();

      // Guardar cambios
      await ReminderStorage.saveReminder(updatedReminder);

      console.log('[ReminderService] Recordatorio actualizado:', updatedReminder.id);
    } catch (error) {
      console.error('[ReminderService] Error actualizando recordatorio:', error);
      throw error;
    }
  }

  /**
   * Obtener recordatorios vinculados a un movimiento específico
   */
  async getRemindersByMovement(movementId: string): Promise<Reminder[]> {
    try {
      const allReminders = await ReminderStorage.getReminders();
      return allReminders.filter(reminder => reminder.linkedMovementId === movementId);
    } catch (error) {
      console.error('[ReminderService] Error obteniendo recordatorios por movimiento:', error);
      return [];
    }
  }

  /**
   * Obtener un recordatorio por ID
   */
  async getReminder(id: string): Promise<Reminder | null> {
    try {
      return await ReminderStorage.getReminderById(id);
    } catch (error) {
      console.error('[ReminderService] Error obteniendo recordatorio:', error);
      return null;
    }
  }

  /**
   * Eliminar un recordatorio
   */
  async deleteReminder(id: string): Promise<void> {
    try {
      const reminder = await ReminderStorage.getReminderById(id);
      if (!reminder) return;

      // Cancelar todas las notificaciones
      await this.cancelNotifications(reminder.notificationIds);

      // Eliminar del storage
      await ReminderStorage.deleteReminder(id);

      console.log('[ReminderService] Recordatorio eliminado:', id);
    } catch (error) {
      console.error('[ReminderService] Error eliminando recordatorio:', error);
      throw error;
    }
  }

  /**
   * Programar notificaciones para un recordatorio
   */
  async scheduleNotifications(reminder: Reminder): Promise<string[]> {
    try {
      if (!this.initialized) {
        console.warn('[ReminderService] Servicio no inicializado, no se programarán notificaciones');
        return [];
      }

      const notificationIds: string[] = [];
      const settings = await ReminderStorage.getReminderSettings();
      const reminderDate = new Date(reminder.datetimeISO);

      // Aplicar ventana silenciosa si está habilitada
      const adjustedDate = this.applySilentWindow(reminderDate, settings);

      // Programar notificación principal (a la hora exacta)
      const mainNotificationId = await this.scheduleNotification(
        reminder,
        adjustedDate,
        'principal'
      );
      if (mainNotificationId) notificationIds.push(mainNotificationId);

      // Programar notificaciones de aviso anticipado
      for (const advanceMinutes of reminder.advance) {
        const advanceDate = new Date(adjustedDate.getTime() - (advanceMinutes * 60 * 1000));
        
        // Solo programar si es en el futuro
        if (advanceDate > new Date()) {
          const advanceNotificationId = await this.scheduleNotification(
            reminder,
            advanceDate,
            `aviso-${advanceMinutes}min`
          );
          if (advanceNotificationId) notificationIds.push(advanceNotificationId);
        }
      }

      console.log(`[ReminderService] ${notificationIds.length} notificaciones programadas para recordatorio ${reminder.id}`);
      return notificationIds;
    } catch (error) {
      console.error('[ReminderService] Error programando notificaciones:', error);
      return [];
    }
  }

  /**
   * Programar una notificación individual
   */
  private async scheduleNotification(
    reminder: Reminder,
    triggerDate: Date,
    type: string
  ): Promise<string | null> {
    try {
      const now = new Date();
      if (triggerDate <= now) {
        console.log(`[ReminderService] Fecha pasada, no se programa: ${triggerDate.toISOString()}`);
        return null;
      }

      const identifier = `${reminder.id}_${type}_${triggerDate.getTime()}`;
      const categoryId = this.getNotificationCategory(reminder.type);
      
      const title = this.getNotificationTitle(reminder.type, type);
      const body = this.getNotificationBody(reminder, triggerDate, type);

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title,
          body,
          data: {
            reminderId: reminder.id,
            type,
            linkedMovementId: reminder.linkedMovementId
          },
          categoryIdentifier: categoryId,
          sound: 'default',
        },
        trigger: {
          date: triggerDate,
        } as Notifications.DateTriggerInput,
      });

      console.log(`[ReminderService] Notificación programada: ${identifier} para ${triggerDate.toISOString()}`);
      return identifier;
    } catch (error) {
      console.error('[ReminderService] Error programando notificación individual:', error);
      return null;
    }
  }

  /**
   * Aplicar ventana silenciosa a una fecha
   */
  private applySilentWindow(date: Date, settings: ReminderSettings): Date {
    if (!settings.silentWindow.enabled) return date;

    const hour = date.getHours();
    const minute = date.getMinutes();
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const startTime = settings.silentWindow.startTime;
    const endTime = settings.silentWindow.endTime;

    // Verificar si la hora cae dentro de la ventana silenciosa
    const isInSilentWindow = (startTime <= endTime) 
      ? (timeString >= startTime && timeString <= endTime)
      : (timeString >= startTime || timeString <= endTime);

    if (isInSilentWindow) {
      // Mover al final de la ventana silenciosa
      const adjustedDate = new Date(date);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      adjustedDate.setHours(endHour, endMinute, 0, 0);
      
      // Si es del día anterior, mover al día siguiente
      if (adjustedDate < date) {
        adjustedDate.setDate(adjustedDate.getDate() + 1);
      }
      
      console.log(`[ReminderService] Fecha ajustada por ventana silenciosa: ${date.toISOString()} -> ${adjustedDate.toISOString()}`);
      return adjustedDate;
    }

    return date;
  }

  /**
   * Obtener la categoría de notificación según el tipo de recordatorio
   */
  private getNotificationCategory(type: Reminder['type']): string {
    switch (type) {
      case 'pago':
        return NOTIFICATION_CATEGORIES.PAYMENT_REMINDER;
      case 'cobro':
        return NOTIFICATION_CATEGORIES.COLLECTION_REMINDER;
      case 'general':
        return NOTIFICATION_CATEGORIES.GENERAL_REMINDER;
      default:
        return NOTIFICATION_CATEGORIES.GENERAL_REMINDER;
    }
  }

  /**
   * Generar título de notificación
   */
  private getNotificationTitle(type: Reminder['type'], notificationType: string): string {
    const isAdvanceNotice = notificationType.startsWith('aviso-');
    
    if (isAdvanceNotice) {
      const minutes = notificationType.replace('aviso-', '').replace('min', '');
      const timeText = this.formatAdvanceTime(parseInt(minutes));
      
      switch (type) {
        case 'pago':
          return `📌 Recordatorio de pago (en ${timeText})`;
        case 'cobro':
          return `📌 Recordatorio de cobro (en ${timeText})`;
        case 'general':
          return `📌 Recordatorio (en ${timeText})`;
      }
    } else {
      switch (type) {
        case 'pago':
          return '📌 Recordatorio de pago';
        case 'cobro':
          return '📌 Recordatorio de cobro';
        case 'general':
          return '📌 Recordatorio';
      }
    }
    
    return '📌 Recordatorio';
  }

  /**
   * Generar cuerpo de notificación
   */
  private getNotificationBody(reminder: Reminder, triggerDate: Date, type: string): string {
    const timeString = triggerDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const dateString = triggerDate.toLocaleDateString('es-ES');
    
    let body = '';
    
    // Personalizar mensaje según el tipo de recordatorio
    if (reminder.linkedMovementId) {
      // Recordatorio específico ligado a movimiento
      if (reminder.type === 'pago') {
        body = `💸 Pago pendiente: ${reminder.title}`;
      } else if (reminder.type === 'cobro') {
        body = `💰 Cobro pendiente: ${reminder.title}`;
      } else {
        body = reminder.title;
      }
    } else {
      // Recordatorio general
      if (reminder.type === 'pago') {
        body = `💳 Recordatorio de pago: ${reminder.title}`;
      } else if (reminder.type === 'cobro') {
        body = `💵 Recordatorio de cobro: ${reminder.title}`;
      } else {
        body = `🔔 ${reminder.title}`;
      }
    }
    
    // Agregar hora y fecha si no es un aviso anticipado
    if (!type.startsWith('aviso-')) {
      const now = new Date();
      const isToday = triggerDate.toDateString() === now.toDateString();
      
      if (isToday) {
        body += `\n🕐 Hoy a las ${timeString}`;
      } else {
        body += `\n🕐 ${timeString} - ${dateString}`;
      }
    }
    
    // Agregar notas si existen
    if (reminder.notes) {
      body += `\n📝 ${reminder.notes}`;
    }
    
    return body;
  }

  /**
   * Formatear tiempo de aviso
   */
  private formatAdvanceTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} día${days > 1 ? 's' : ''}`;
    }
  }

  /**
   * Cancelar notificaciones
   */
  async cancelNotifications(notificationIds: string[]): Promise<void> {
    try {
      if (notificationIds.length === 0) return;

      // Cancelar una por una
      for (const id of notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      console.log(`[ReminderService] ${notificationIds.length} notificaciones canceladas`);
    } catch (error) {
      console.error('[ReminderService] Error cancelando notificaciones:', error);
    }
  }

  /**
   * Posponer recordatorio por X minutos
   */
  async snoozeReminder(reminderId: string, minutes: number): Promise<void> {
    try {
      const reminder = await ReminderStorage.getReminderById(reminderId);
      if (!reminder) return;

      // Calcular nueva fecha
      const newDate = new Date(Date.now() + (minutes * 60 * 1000));
      reminder.datetimeISO = newDate.toISOString();

      // Cancelar notificaciones actuales
      await this.cancelNotifications(reminder.notificationIds);

      // Programar nuevas notificaciones
      const notificationIds = await this.scheduleNotifications(reminder);
      reminder.notificationIds = notificationIds;

      // Guardar cambios
      await ReminderStorage.saveReminder(reminder);

      console.log(`[ReminderService] Recordatorio ${reminderId} pospuesto ${minutes} minutos`);
    } catch (error) {
      console.error('[ReminderService] Error posponiendo recordatorio:', error);
    }
  }

  /**
   * Posponer hasta mañana a las 9 AM
   */
  async snoozeTomorrowMorning(reminderId: string): Promise<void> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const reminder = await ReminderStorage.getReminderById(reminderId);
      if (!reminder) return;

      reminder.datetimeISO = tomorrow.toISOString();

      // Cancelar y reprogramar
      await this.cancelNotifications(reminder.notificationIds);
      const notificationIds = await this.scheduleNotifications(reminder);
      reminder.notificationIds = notificationIds;

      await ReminderStorage.saveReminder(reminder);

      console.log(`[ReminderService] Recordatorio ${reminderId} pospuesto hasta mañana 9 AM`);
    } catch (error) {
      console.error('[ReminderService] Error posponiendo hasta mañana:', error);
    }
  }

  /**
   * Manejar acción de marcar como pagado
   */
  private async handleMarkPaidAction(reminderId: string): Promise<void> {
    try {
      const reminder = await ReminderStorage.getReminderById(reminderId);
      if (!reminder) return;

      // Marcar recordatorio como completado
      await ReminderStorage.updateReminderStatus(reminderId, 'completado');

      // Cancelar futuras notificaciones
      await this.cancelNotifications(reminder.notificationIds);

      // Si hay linkedMovementId, actualizar el movimiento a pagado
      if (reminder.linkedMovementId) {
        try {
          // Usar el contexto de movimientos para actualizar el estado
          const { MovimientosContext } = require('../../state/MovimientosContext');
          
          // Para acceder al contexto desde el servicio, necesitamos otra estrategia
          // Vamos a emitir un evento o usar AsyncStorage para comunicar el cambio
          await this.markMovementAsPaid(reminder.linkedMovementId);
          
          console.log(`[ReminderService] Movimiento ${reminder.linkedMovementId} marcado como pagado`);
        } catch (movementError) {
          console.error('[ReminderService] Error actualizando movimiento:', movementError);
          // No fallar si no se puede actualizar el movimiento
        }
      }

      console.log(`[ReminderService] Recordatorio ${reminderId} marcado como pagado`);
    } catch (error) {
      console.error('[ReminderService] Error marcando como pagado:', error);
    }
  }

  /**
   * Marcar movimiento vinculado como pagado
   */
  private async markMovementAsPaid(movementId: string): Promise<void> {
    try {
      // Guardamos el evento en AsyncStorage para que la app lo procese
      const eventData = {
        type: 'MARK_MOVEMENT_PAID',
        movementId,
        timestamp: Date.now()
      };
      
      const existingEvents = JSON.parse(
        await AsyncStorage.getItem('movement_update_events') || '[]'
      );
      
      existingEvents.push(eventData);
      
      await AsyncStorage.setItem(
        'movement_update_events', 
        JSON.stringify(existingEvents)
      );
      
      console.log(`[ReminderService] Evento de pago guardado para movimiento ${movementId}`);
    } catch (error) {
      console.error('[ReminderService] Error guardando evento de pago:', error);
    }
  }

  /**
   * Completar un recordatorio (marcar como hecho)
   */
  async completeReminder(reminderId: string): Promise<void> {
    try {
      const reminder = await ReminderStorage.getReminderById(reminderId);
      if (!reminder) return;

      // Marcar recordatorio como completado
      await ReminderStorage.updateReminderStatus(reminderId, 'completado');

      // Cancelar futuras notificaciones
      await this.cancelNotifications(reminder.notificationIds);

      console.log(`[ReminderService] Recordatorio ${reminderId} completado`);
    } catch (error) {
      console.error('[ReminderService] Error completando recordatorio:', error);
    }
  }

  /**
   * Reconciliar notificaciones al iniciar la app
   */
  async reconcileOnAppStart(): Promise<void> {
    try {
      console.log('[ReminderService] Iniciando reconciliación...');
      
      const reminders = await ReminderStorage.getReminders();
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      const scheduledIds = new Set(scheduledNotifications.map(n => n.identifier));

      for (const reminder of reminders) {
        if (reminder.status !== 'programado') continue;

        // Verificar si sus notificaciones siguen programadas
        const stillScheduled = reminder.notificationIds.filter(id => scheduledIds.has(id));
        
        if (stillScheduled.length !== reminder.notificationIds.length) {
          console.log(`[ReminderService] Reprogramando recordatorio ${reminder.id}`);
          
          // Cancelar las que quedan
          await this.cancelNotifications(reminder.notificationIds);
          
          // Reprogramar todas
          const newNotificationIds = await this.scheduleNotifications(reminder);
          await ReminderStorage.updateReminderNotificationIds(reminder.id, newNotificationIds);
        }
      }

      console.log('[ReminderService] Reconciliación completada');
    } catch (error) {
      console.error('[ReminderService] Error en reconciliación:', error);
    }
  }

  /**
   * Obtener badge count (recordatorios próximos en 24h)
   */
  async getBadgeCount(): Promise<number> {
    try {
      const upcomingReminders = await ReminderStorage.getUpcomingReminders(24);
      return upcomingReminders.length;
    } catch (error) {
      console.error('[ReminderService] Error obteniendo badge count:', error);
      return 0;
    }
  }

  /**
   * Completar recordatorio vinculado a movimiento
   */
  async completeLinkedMovement(movementId: string): Promise<void> {
    try {
      const reminders = await ReminderStorage.getRemindersByMovement(movementId);
      
      for (const reminder of reminders) {
        if (reminder.status === 'programado') {
          await this.cancelNotifications(reminder.notificationIds);
          await ReminderStorage.updateReminderStatus(reminder.id, 'completado');
        }
      }

      console.log(`[ReminderService] Recordatorios completados para movimiento ${movementId}`);
    } catch (error) {
      console.error('[ReminderService] Error completando recordatorios vinculados:', error);
    }
  }
}

// Exportar instancia singleton
export const ReminderService = new ReminderServiceClass();