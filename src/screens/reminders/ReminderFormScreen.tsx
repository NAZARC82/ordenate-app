// src/screens/reminders/ReminderFormScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { 
  ReminderService, 
  ReminderDraft, 
  Reminder,
  ReminderType, 
  RepeatFrequency,
  DEFAULT_ADVANCE_OPTIONS 
} from '../../modules/reminders';

interface MovementData {
  tipo: 'pago' | 'cobro';
  monto: number;
  nota?: string;
  fechaISO?: string;
}

interface ReminderFormScreenProps {
  mode?: 'create' | 'edit'; // Modo de operación
  reminderId?: string; // Para editar recordatorio existente
  linkedMovementId?: string; // Para crear desde movimiento
  type?: ReminderType; // Tipo inicial (renombrado de initialType)
  movementData?: MovementData; // Datos del movimiento para recordatorios específicos
}

const ReminderFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as ReminderFormScreenProps) || {};
  const { mode = 'create', type = 'general', linkedMovementId: paramLinkedMovementId = null, reminderId, movementData } = params;

  // Ref para el ScrollView
  const scrollViewRef = useRef<ScrollView>(null);

  // Estados del formulario
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [formType, setFormType] = useState(type);
  const [when, setWhen] = useState(() => {
    // Asegurar valor válido: +2 horas mínimo desde ahora
    const now = new Date();
    const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return futureTime;
  });
  const [repeat, setRepeat] = useState('nunca');
  const [selectedAdvances, setSelectedAdvances] = useState([60]); // 1 hora por defecto
  const [notes, setNotes] = useState('');
  const [linkedMovementId, setLinkedMovementId] = useState(paramLinkedMovementId);

  // Estados de UI
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Opciones disponibles
  const advanceOptions = [
    { value: 10, label: '10 minutos' },
    { value: 60, label: '1 hora' },
    { value: 1440, label: '24 horas' },
    { value: 2880, label: '2 días' },
    { value: 10080, label: '1 semana' }
  ];

  const repeatOptions: { value: RepeatFrequency; label: string }[] = [
    { value: 'nunca', label: 'Solo una vez' },
    { value: 'diario', label: 'Todos los días' },
    { value: 'semanal', label: 'Cada semana' },
    { value: 'mensual', label: 'Cada mes' }
  ];

  const typeOptions: { value: ReminderType; label: string; icon: string; color: string }[] = [
    { value: 'pago', label: 'Pago', icon: 'card', color: '#e74c3c' },
    { value: 'cobro', label: 'Cobro', icon: 'cash', color: '#27ae60' },
    { value: 'general', label: 'General', icon: 'notifications', color: '#3498db' }
  ];

  // Cargar datos si es edición
  useEffect(() => {
    if (params.reminderId) {
      loadReminderForEdit();
    } else {
      // Auto-generar título según el tipo
      generateAutoTitle();
    }
  }, [params.reminderId, formType]);

  const loadReminderForEdit = async () => {
    try {
      if (!params.reminderId) return;
      
      const reminder = await ReminderService.getReminder(params.reminderId);
      if (!reminder) {
        Alert.alert('Error', 'Recordatorio no encontrado');
        navigation.goBack();
        return;
      }

      // Llenar el formulario con los datos del recordatorio
      setTitle(reminder.title);
      setFormType(reminder.type);
      
      // Intentar cargar desde timestamp local si existe en las notas
      let loadedDate = new Date(reminder.datetimeISO);
      let cleanNotes = reminder.notes || '';
      
      // Buscar timestamp local en las notas
      const localTimestampMatch = cleanNotes.match(/\[Local: (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) \| TS: (\d+)\]/);
      if (localTimestampMatch) {
        const [, dateYMD, timeHM, tsLocal] = localTimestampMatch;
        // Usar el timestamp local para reconstruir la fecha exacta
        loadedDate = new Date(parseInt(tsLocal));
        // Limpiar las notas removiendo la información de timestamp
        cleanNotes = cleanNotes.replace(/\n\n\[Local:.*?\]$/, '').trim();
      }
      
      setWhen(loadedDate);
      setSelectedAdvances(reminder.advance);
      setRepeat(reminder.repeat);
      setNotes(cleanNotes);
      setLinkedMovementId(reminder.linkedMovementId || null);
      
      console.log('[ReminderForm] Recordatorio cargado para editar:', reminder.id);
    } catch (error) {
      console.error('[ReminderForm] Error cargando recordatorio:', error);
      Alert.alert('Error', 'No se pudo cargar el recordatorio');
    }
  };

  const generateAutoTitle = () => {
    if (title) return; // No sobrescribir si ya hay título

    if (linkedMovementId && params.movementData) {
      // Recordatorio específico ligado a un movimiento
      const { tipo, monto, nota } = params.movementData;
      const montoFormatted = new Intl.NumberFormat('es-UY', {
        style: 'currency',
        currency: 'UYU',
        minimumFractionDigits: 0
      }).format(monto);
      
      if (tipo === 'pago') {
        setTitle(`Pago ${nota ? `a ${nota}` : ''} ${montoFormatted}`);
        setFormType('pago');
      } else if (tipo === 'cobro') {
        setTitle(`Cobro ${nota ? `de ${nota}` : ''} ${montoFormatted}`);
        setFormType('cobro');
      }
    } else {
      // Recordatorio general sin vinculación
      const now = new Date();
      const timeString = now.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
      
      switch (formType) {
        case 'pago':
          setTitle('Recordatorio de pago');
          break;
        case 'cobro':
          setTitle('Recordatorio de cobro');
          break;
        case 'general':
          setTitle('');
          break;
      }
    }
  };

  // Funciones para manejo exclusivo de pickers
  const openDatePicker = () => {
    console.log('[ReminderForm] Abriendo DatePicker. Current when:', when);
    console.log('[ReminderForm] Platform:', Platform.OS, 'Version:', Platform.Version);
    // Cerrar teclado antes de abrir picker
    Keyboard.dismiss();
    // Cerrar time picker si está abierto
    setShowTimePicker(false);
    // Abrir date picker
    setShowDatePicker(true);
    console.log('[ReminderForm] DatePicker should be visible now');
  };

  const openTimePicker = () => {
    console.log('[ReminderForm] Abriendo TimePicker. Current when:', when);
    console.log('[ReminderForm] Platform:', Platform.OS, 'Version:', Platform.Version);
    // Cerrar teclado antes de abrir picker
    Keyboard.dismiss();
    // Cerrar date picker si está abierto
    setShowDatePicker(false);
    // Abrir time picker
    setShowTimePicker(true);
    console.log('[ReminderForm] TimePicker should be visible now');
  };

  const closePickers = () => {
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    console.log('[ReminderForm] onChangeDate called. Event:', event.type, 'Date:', selectedDate);
    // Cerrar inmediatamente en Android, o si el usuario canceló
    const shouldClose = Platform.OS === 'android' || event.type === 'dismissed';
    
    if (selectedDate && event.type !== 'dismissed') {
      // Preservar la hora actual, actualizar solo la fecha
      const newWhen = new Date(when);
      newWhen.setFullYear(selectedDate.getFullYear());
      newWhen.setMonth(selectedDate.getMonth());
      newWhen.setDate(selectedDate.getDate());
      setWhen(newWhen);
      console.log('[ReminderForm] Date updated to:', newWhen);
      
      // Validar si la nueva fecha/hora está en el pasado
      validateFutureTime(newWhen);
    }
    
    // Cerrar picker después de seleccionar
    if (shouldClose) {
      console.log('[ReminderForm] Closing date picker');
      setShowDatePicker(false);
    }
  };

  const onChangeTime = (event: any, selectedTime?: Date) => {
    console.log('[ReminderForm] onChangeTime called. Event:', event.type, 'Time:', selectedTime);
    // Cerrar inmediatamente en Android, o si el usuario canceló
    const shouldClose = Platform.OS === 'android' || event.type === 'dismissed';
    
    if (selectedTime && event.type !== 'dismissed') {
      // Preservar la fecha actual, actualizar solo la hora
      const newWhen = new Date(when);
      newWhen.setHours(selectedTime.getHours());
      newWhen.setMinutes(selectedTime.getMinutes());
      newWhen.setSeconds(0);
      newWhen.setMilliseconds(0);
      setWhen(newWhen);
      console.log('[ReminderForm] Time updated to:', newWhen);
      
      // Validar si la nueva fecha/hora está en el pasado
      validateFutureTime(newWhen);
    }
    
    // Cerrar picker después de seleccionar
    if (shouldClose) {
      console.log('[ReminderForm] Closing time picker');
      setShowTimePicker(false);
    }
  };

  const validateFutureTime = (dateTime: Date) => {
    const now = new Date();
    if (dateTime <= now) {
      // Si es hoy y ya pasó la hora, sugerir próxima hora
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9:00 AM del día siguiente
      
      Alert.alert(
        'Hora en el pasado',
        'La hora seleccionada ya pasó. ¿Quieres programarlo para mañana a las 9:00?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sí, mañana 9:00',
            onPress: () => setWhen(tomorrow)
          }
        ]
      );
    }
  };

  const toggleAdvanceOption = (value: number) => {
    setSelectedAdvances((prev: number[]) => {
      if (prev.includes(value)) {
        return prev.filter((v: number) => v !== value);
      } else {
        return [...prev, value].sort((a: number, b: number) => b - a); // Ordenar descendente
      }
    });
  };

  const validateForm = (): string | null => {
    if (!title.trim()) {
      return 'El título es obligatorio';
    }

    if (when <= new Date()) {
      return 'La fecha y hora debe ser en el futuro';
    }

    if (selectedAdvances.length === 0) {
      return 'Selecciona al menos un tiempo de aviso';
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Error de validación', validationError);
      return;
    }

    setLoading(true);
    try {
      // Crear timestamp local para evitar problemas de UTC/ISO
      const localTimestamp = createLocalTimestamp(when);
      
      // Incluir información de timestamp local en las notas para referencia
      const notesWithTimestamp = notes.trim() 
        ? `${notes.trim()}\n\n[Local: ${localTimestamp.dateYMD} ${localTimestamp.timeHM} | TS: ${localTimestamp.tsLocal}]`
        : `[Local: ${localTimestamp.dateYMD} ${localTimestamp.timeHM} | TS: ${localTimestamp.tsLocal}]`;

      const reminderDraft: ReminderDraft = {
        title: title.trim(),
        linkedMovementId: linkedMovementId || undefined,
        type: formType,
        datetimeISO: when.toISOString(), // Mantenemos ISO para compatibilidad
        advance: selectedAdvances,
        repeat: repeat as RepeatFrequency,
        notes: notesWithTimestamp
      };

      if (params.reminderId) {
        // Actualizar recordatorio existente
        const existingReminder = await ReminderService.getReminder(params.reminderId);
        if (!existingReminder) {
          throw new Error('Recordatorio no encontrado');
        }

        const updatedReminder: Reminder = {
          ...existingReminder,
          title: reminderDraft.title,
          type: reminderDraft.type,
          datetimeISO: reminderDraft.datetimeISO,
          advance: reminderDraft.advance,
          repeat: reminderDraft.repeat,
          notes: reminderDraft.notes,
          updatedAt: new Date().toISOString()
        };

        await ReminderService.updateReminder(updatedReminder);
      } else {
        // Crear nuevo recordatorio
        await ReminderService.createReminder(reminderDraft);
      }

      Alert.alert(
        'Éxito',
        params.reminderId ? 'Recordatorio actualizado' : 'Recordatorio creado',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error guardando recordatorio:', error);
      Alert.alert('Error', 'No se pudo guardar el recordatorio');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-UY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-UY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Funciones auxiliares para persistencia local sin UTC
  const createLocalTimestamp = (date: Date) => {
    return {
      dateYMD: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      timeHM: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
      tsLocal: date.getTime()
    };
  };

  const parseLocalTimestamp = (dateYMD: string, timeHM: string) => {
    const [year, month, day] = dateYMD.split('-').map(Number);
    const [hour, minute] = timeHM.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, 0, 0);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      enabled={true}
    >
      <TouchableWithoutFeedback onPress={closePickers}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.title}>
              {params.reminderId ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}
            </Text>
            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            removeClippedSubviews={false}
            bounces={true}
            alwaysBounceVertical={false}
            overScrollMode="auto"
            nestedScrollEnabled={true}
            contentInsetAdjustmentBehavior="automatic"
          >
        {/* Tipo de recordatorio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de recordatorio</Text>
          
          {/* Información sobre recordatorio específico */}
          {linkedMovementId && (
            <View style={styles.linkedMovementInfo}>
              <Ionicons name="link" size={16} color="#3498DB" />
              <Text style={styles.linkedMovementText}>
                Recordatorio ligado a movimiento
              </Text>
            </View>
          )}
          
          <View style={styles.typeOptions}>
            {typeOptions.map((option) => {
              // Para recordatorios específicos, deshabilitar tipo General
              const disabled = linkedMovementId && option.value === 'general';
              
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeOption,
                    formType === option.value && styles.typeOptionSelected,
                    disabled && styles.typeOptionDisabled,
                    { borderColor: option.color }
                  ]}
                  onPress={() => {
                    if (!disabled) {
                      setFormType(option.value);
                      
                      // Navegar al tab Historial con filtro específico
                      if (option.value === 'pago') {
                        navigation.getParent()?.getParent()?.navigate('Historial', { 
                          screen: 'HistoryMain', 
                          params: { initialFilter: 'pagos' } 
                        });
                      } else if (option.value === 'cobro') {
                        navigation.getParent()?.getParent()?.navigate('Historial', { 
                          screen: 'HistoryMain', 
                          params: { initialFilter: 'cobros' } 
                        });
                      } else if (option.value === 'general') {
                        navigation.getParent()?.getParent()?.navigate('Historial', { 
                          screen: 'HistoryMain', 
                          params: { initialFilter: 'todos' } 
                        });
                      }
                    }
                  }}
                  disabled={disabled || false}
                >
                  <Ionicons 
                    name={option.icon as any} 
                    size={24} 
                    color={disabled ? '#CCC' : (formType === option.value ? 'white' : option.color)} 
                  />
                  <Text style={[
                    styles.typeOptionText,
                    type === option.value && styles.typeOptionTextSelected,
                    disabled && styles.typeOptionTextDisabled
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Título */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Título</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Describe tu recordatorio..."
            placeholderTextColor="#999"
          />
        </View>

        {/* Fecha */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fecha</Text>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={openDatePicker}
          >
            <Ionicons name="calendar" size={20} color="#3498db" />
            <Text style={styles.dateTimeText}>{formatDate(when)}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Hora */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hora</Text>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={openTimePicker}
          >
            <Ionicons name="time" size={20} color="#3498db" />
            <Text style={styles.dateTimeText}>{formatTime(when)}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Repetición */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repetir</Text>
          {repeatOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.radioOption, repeat === option.value && styles.radioSelected]}
              onPress={() => setRepeat(option.value)}
            >
              <Ionicons 
                name={repeat === option.value ? 'radio-button-on' : 'radio-button-off'} 
                size={20} 
                color="#3498db" 
              />
              <Text style={styles.radioText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Avisos anticipados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avisar con anticipación</Text>
          <Text style={styles.sectionSubtitle}>Puedes seleccionar varios</Text>
          {advanceOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.checkboxOption, selectedAdvances.includes(option.value) && styles.checkboxSelected]}
              onPress={() => toggleAdvanceOption(option.value)}
            >
              <Ionicons 
                name={selectedAdvances.includes(option.value) ? 'checkbox' : 'checkbox-outline'} 
                size={20} 
                color="#3498db" 
              />
              <Text style={styles.checkboxText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notas - Mejorado para mejor visibilidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas (opcional)</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Añade información adicional..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
            onFocus={() => {
              // Scroll al final cuando se enfoca en notas para asegurar visibilidad
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 300); // Aumentar el delay para mejor fluidez
            }}
          />
          <Text style={styles.characterCount}>
            {notes.length}/500 caracteres
          </Text>
        </View>

        {/* Espacio adicional optimizado para scroll fluido */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Date/Time Pickers */}
      {Platform.OS === 'android' ? (
        <>
          {showDatePicker && (
            <DateTimePicker
              value={when instanceof Date && !isNaN(when.getTime()) ? when : new Date()}
              mode="date"
              display="default"
              onChange={onChangeDate}
              minimumDate={new Date()}
              locale="es"
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={when instanceof Date && !isNaN(when.getTime()) ? when : new Date()}
              mode="time"
              display="default"
              onChange={onChangeTime}
              is24Hour={true}
              locale="es"
            />
          )}
        </>
      ) : (
        <>
          {/* iOS Date Picker Modal */}
          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity 
                        onPress={() => setShowDatePicker(false)}
                        style={styles.modalButton}
                      >
                        <Text style={styles.modalButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                      <Text style={styles.modalTitle}>Seleccionar Fecha</Text>
                      <TouchableOpacity 
                        onPress={() => {
                          // Guardar la fecha seleccionada antes de cerrar
                          setShowDatePicker(false);
                        }}
                        style={styles.modalButton}
                      >
                        <Text style={[styles.modalButtonText, styles.modalButtonPrimary]}>Listo</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={when instanceof Date && !isNaN(when.getTime()) ? when : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' && parseInt(Platform.Version, 10) >= 14 ? 'compact' : 'spinner'}
                      onChange={onChangeDate}
                      minimumDate={new Date()}
                      locale="es"
                      style={styles.picker}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* iOS Time Picker Modal */}
          <Modal
            visible={showTimePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity 
                        onPress={() => setShowTimePicker(false)}
                        style={styles.modalButton}
                      >
                        <Text style={styles.modalButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                      <Text style={styles.modalTitle}>Seleccionar Hora</Text>
                      <TouchableOpacity 
                        onPress={() => {
                          // Guardar la hora seleccionada antes de cerrar
                          setShowTimePicker(false);
                        }}
                        style={styles.modalButton}
                      >
                        <Text style={[styles.modalButtonText, styles.modalButtonPrimary]}>Listo</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={when instanceof Date && !isNaN(when.getTime()) ? when : new Date()}
                      mode="time"
                      display={Platform.OS === 'ios' && parseInt(Platform.Version, 10) >= 14 ? 'compact' : 'spinner'}
                      onChange={onChangeTime}
                      is24Hour={true}
                      locale="es"
                      style={styles.picker}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </>
      )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  closeButton: {
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
  saveButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContainer: {
    paddingBottom: 20,
    flexGrow: 1,
    minHeight: '100%',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  typeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'white',
  },
  typeOptionSelected: {
    backgroundColor: '#3498db',
  },
  typeOptionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  typeOptionTextSelected: {
    color: 'white',
  },
  typeOptionDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
    opacity: 0.6,
  },
  typeOptionTextDisabled: {
    color: '#6c757d',
  },
  linkedMovementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  linkedMovementText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  notesInput: {
    height: 100, // Aumentar altura para mejor visibilidad
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  dateTimeText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#2c3e50',
    textTransform: 'capitalize',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  radioSelected: {
    backgroundColor: '#e3f2fd',
  },
  radioText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#2c3e50',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  checkboxSelected: {
    backgroundColor: '#e3f2fd',
  },
  checkboxText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#2c3e50',
  },
  // Estilos para modales iOS - Posicionados más arriba para mejor visibilidad
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', // Centrar en lugar de flex-end
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20, // Bordes redondeados en todas las esquinas
    paddingBottom: 20,
    maxHeight: '60%', // Limitar altura máxima
    minWidth: '90%', // Asegurar ancho mínimo
    maxWidth: '95%', // Limitar ancho máximo
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 56, // Altura mínima garantizada
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 70, // Ancho mínimo para evitar cortes
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#3498db',
    textAlign: 'center',
  },
  modalButtonPrimary: {
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8, // Espacio entre los botones y el título
  },
  picker: {
    height: Platform.OS === 'ios' ? 200 : 180, // Reducir altura para mejor ajuste
    backgroundColor: 'white',
    width: '100%',
  },
  bottomSpacer: {
    height: 120,
    backgroundColor: 'transparent',
  },
});

export default ReminderFormScreen;