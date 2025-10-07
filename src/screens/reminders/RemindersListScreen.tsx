// src/screens/reminders/RemindersListScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { 
  Reminder, 
  ReminderService, 
  getReminders,
  REMINDER_TYPE_COLORS,
  REMINDER_TYPES
} from '../../modules/reminders';

type TabType = 'proximos' | 'pasados' | 'todos';

const RemindersListScreen = () => {
  const navigation = useNavigation();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('proximos');

  // Cargar recordatorios cuando la pantalla esté en foco
  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [])
  );

  const loadReminders = async () => {
    try {
      setLoading(true);
      const allReminders = await getReminders();
      setReminders(allReminders);
    } catch (error) {
      console.error('Error cargando recordatorios:', error);
      Alert.alert('Error', 'No se pudieron cargar los recordatorios');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  const getFilteredReminders = (): Reminder[] => {
    const now = new Date();
    
    switch (activeTab) {
      case 'proximos':
        return reminders.filter((r: any) => {
          if (r.status !== 'programado') return false;
          const reminderDate = new Date(r.datetimeISO);
          return reminderDate > now;
        }).sort((a: any, b: any) => new Date(a.datetimeISO).getTime() - new Date(b.datetimeISO).getTime());
      
      case 'pasados':
        return reminders.filter((r: any) => {
          const reminderDate = new Date(r.datetimeISO);
          return reminderDate <= now || r.status === 'completado';
        }).sort((a: any, b: any) => new Date(b.datetimeISO).getTime() - new Date(a.datetimeISO).getTime());
      
      case 'todos':
        return reminders.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      default:
        return reminders;
    }
  };

  const handleEditReminder = (reminder: any) => {
    const parent = (navigation as any).getParent();
    if (parent) {
      parent.navigate('ReminderForm', { 
        mode: 'edit',
        reminderId: reminder.id 
      });
    } else {
      (navigation as any).navigate('ReminderForm', { 
        mode: 'edit',
        reminderId: reminder.id 
      });
    }
  };

  const handleDeleteReminder = (reminder: Reminder) => {
    Alert.alert(
      'Eliminar recordatorio',
      `¿Estás seguro de que quieres eliminar "${reminder.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await ReminderService.deleteReminder(reminder.id);
              await loadReminders();
            } catch (error) {
              console.error('Error eliminando recordatorio:', error);
              Alert.alert('Error', 'No se pudo eliminar el recordatorio');
            }
          }
        }
      ]
    );
  };

  const handleSnoozeReminder = (reminder: Reminder) => {
    Alert.alert(
      'Posponer recordatorio',
      'Selecciona cuánto tiempo posponer',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: '15 minutos',
          onPress: async () => {
            try {
              await ReminderService.snoozeReminder(reminder.id, 15);
              await loadReminders();
            } catch (error) {
              Alert.alert('Error', 'No se pudo posponer el recordatorio');
            }
          }
        },
        {
          text: '1 hora',
          onPress: async () => {
            try {
              await ReminderService.snoozeReminder(reminder.id, 60);
              await loadReminders();
            } catch (error) {
              Alert.alert('Error', 'No se pudo posponer el recordatorio');
            }
          }
        },
        {
          text: 'Mañana 9 AM',
          onPress: async () => {
            try {
              await ReminderService.snoozeTomorrowMorning(reminder.id);
              await loadReminders();
            } catch (error) {
              Alert.alert('Error', 'No se pudo posponer el recordatorio');
            }
          }
        }
      ]
    );
  };

  const handleCompleteReminder = async (reminder: Reminder) => {
    try {
      // Actualizar estado del recordatorio a completado
      const updatedReminder: Reminder = {
        ...reminder,
        status: 'completado',
        updatedAt: new Date().toISOString()
      };

      await ReminderService.updateReminder(updatedReminder);
      
      // Recargar la lista para reflejar los cambios
      await loadReminders();
      
      // Feedback al usuario
      Alert.alert('Éxito', 'Recordatorio marcado como completado');
    } catch (error) {
      console.error('[RemindersListScreen] Error completando recordatorio:', error);
      Alert.alert('Error', 'No se pudo marcar como completado');
    }
  };

  const getTypeIcon = (type: Reminder['type']) => {
    const iconMap: Record<string, any> = {
      'pago': 'card-outline',
      'cobro': 'cash-outline', 
      'general': 'notifications-outline'
    };
    
    return {
      name: iconMap[type] || 'notifications-outline',
      color: REMINDER_TYPE_COLORS[type] || REMINDER_TYPE_COLORS.general
    };
  };

  const getStatusColor = (status: Reminder['status']) => {
    switch (status) {
      case 'programado':
        return '#3498db';
      case 'enviado':
        return '#f39c12';
      case 'completado':
        return '#27ae60';
      case 'omitido':
        return '#95a5a6';
      default:
        return '#3498db';
    }
  };

  const getStatusText = (status: Reminder['status']) => {
    switch (status) {
      case 'programado':
        return 'Programado';
      case 'enviado':
        return 'Enviado';
      case 'completado':
        return 'Completado';
      case 'omitido':
        return 'Omitido';
      default:
        return 'Desconocido';
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    const timeString = date.toLocaleTimeString('es-UY', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    if (diffDays === 0) {
      return `Hoy ${timeString}`;
    } else if (diffDays === 1) {
      return `Mañana ${timeString}`;
    } else if (diffDays === -1) {
      return `Ayer ${timeString}`;
    } else if (diffDays > 0 && diffDays <= 7) {
      const dayName = date.toLocaleDateString('es-UY', { weekday: 'long' });
      return `${dayName} ${timeString}`;
    } else {
      return date.toLocaleDateString('es-UY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderReminderItem = ({ item }: { item: Reminder }) => {
    const typeIcon = getTypeIcon(item.type);
    const statusColor = getStatusColor(item.status);
    const canEdit = item.status === 'programado';
    const canSnooze = item.status === 'programado' && new Date(item.datetimeISO) > new Date();

    return (
      <View style={styles.reminderItem}>
        <View style={styles.reminderHeader}>
          <View style={styles.reminderInfo}>
            <View style={[styles.typeIcon, { backgroundColor: `${typeIcon.color}15` }]}>
              <Ionicons name={typeIcon.name as any} size={20} color={typeIcon.color} />
            </View>
            <View style={styles.reminderDetails}>
              <View style={styles.titleRow}>
                <Text style={styles.reminderTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={[styles.typeChip, { backgroundColor: typeIcon.color }]}>
                  <Text style={styles.typeChipText}>
                    {REMINDER_TYPES[item.type]}
                  </Text>
                </View>
              </View>
              <Text style={styles.reminderDateTime}>
                {formatDateTime(item.datetimeISO)}
              </Text>
              <View style={styles.reminderMeta}>
                {item.repeat !== 'nunca' && (
                  <Text style={styles.reminderRepeat}>
                    🔄 {item.repeat}
                  </Text>
                )}
                {item.linkedMovementId && (
                  <Text style={styles.reminderLinked}>
                    🔗 Específico
                  </Text>
                )}
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {item.notes && (
          <Text style={styles.reminderNotes} numberOfLines={2}>
            📝 {item.notes}
          </Text>
        )}

        <View style={styles.reminderActions}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEditReminder(item)}
            >
              <Ionicons name="pencil" size={16} color="#3498db" />
              <Text style={[styles.actionButtonText, { color: '#3498db' }]}>
                Editar
              </Text>
            </TouchableOpacity>
          )}

          {canSnooze && (
            <TouchableOpacity
              style={[styles.actionButton, styles.snoozeButton]}
              onPress={() => handleSnoozeReminder(item)}
            >
              <Ionicons name="time" size={16} color="#f39c12" />
              <Text style={[styles.actionButtonText, { color: '#f39c12' }]}>
                Posponer
              </Text>
            </TouchableOpacity>
          )}

          {item.status === 'programado' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleCompleteReminder(item)}
            >
              <Ionicons name="checkmark" size={16} color="#27ae60" />
              <Text style={[styles.actionButtonText, { color: '#27ae60' }]}>
                Completar
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteReminder(item)}
          >
            <Ionicons name="trash" size={16} color="#e74c3c" />
            <Text style={[styles.actionButtonText, { color: '#e74c3c' }]}>
              Eliminar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filteredReminders = getFilteredReminders();

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando recordatorios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>Recordatorios</Text>
        <TouchableOpacity
          onPress={() => {
            const parent = (navigation as any).getParent();
            if (parent) {
              parent.navigate('ReminderForm', {
                mode: 'create',
                type: 'general',
                linkedMovementId: null
              });
            } else {
              (navigation as any).navigate('ReminderForm', {
                mode: 'create',
                type: 'general',
                linkedMovementId: null
              });
            }
          }}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'proximos', label: 'Próximos' },
          { key: 'pasados', label: 'Pasados' },
          { key: 'todos', label: 'Todos' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as TabType)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de recordatorios */}
      <FlatList
        data={filteredReminders}
        keyExtractor={(item: any) => item.id}
        renderItem={renderReminderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color="#bdc3c7" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'proximos' && 'No hay recordatorios próximos'}
              {activeTab === 'pasados' && 'No hay recordatorios pasados'}
              {activeTab === 'todos' && 'No hay recordatorios'}
            </Text>
            <Text style={styles.emptySubtitle}>
              Toca el botón + para crear tu primer recordatorio
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontSize: 16,
    color: '#64748b',
  },
  activeTabText: {
    color: '#3498db',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  reminderItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reminderInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  typeChipText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  reminderDateTime: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  reminderRepeat: {
    fontSize: 12,
    color: '#3498db',
    marginBottom: 2,
  },
  reminderMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  reminderLinked: {
    fontSize: 12,
    color: '#27ae60',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  reminderNotes: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  reminderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
  },
  editButton: {
    backgroundColor: '#e3f2fd',
  },
  snoozeButton: {
    backgroundColor: '#fff3e0',
  },
  completeButton: {
    backgroundColor: '#e8f5e8',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default RemindersListScreen;