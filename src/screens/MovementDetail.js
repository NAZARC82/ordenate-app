// src/screens/MovementDetail.js
import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Keyboard, InputAccessoryView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMovimientos } from '../state/MovimientosContext';
import { getEstadoColor } from '../utils/estadoColor';
import { ReminderService } from '../modules/reminders';
import { formatDate } from '../utils/format';
import { useFolderLinks } from '../features/folders/useFolderLinks';
import FolderPicker from '../components/FolderPicker';

export default function MovementDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { mode = 'view', id, preset } = route.params || {};
  const { movimientos, addMovimiento, updateMovimiento } = useMovimientos();

  // Estados del formulario
  const [tipo, setTipo] = useState('pago');
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  const [estado, setEstado] = useState('pendiente');
  const [fechaISO, setFechaISO] = useState(new Date().toISOString());
  const [linkedReminders, setLinkedReminders] = useState([]);
  
  // Estados para carpetas
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const { addToFolder, findLinkedFolders, linkedFolders } = useFolderLinks();

  // Buscar movimiento existente para modo edit
  const existingMovimiento = useMemo(() => {
    if (mode === 'edit' && id) {
      return movimientos.find(m => m.id === id);
    }
    return null;
  }, [mode, id, movimientos]);

  // Inicializar formulario
  useEffect(() => {
    if (mode === 'create' && preset) {
      // Modo crear con preset
      setTipo(preset.tipo || 'pago');
      setFechaISO(preset.fechaISO || new Date().toISOString());
      setMonto('');
      setNota('');
      setEstado('pendiente');
    } else if (mode === 'edit' && existingMovimiento) {
      // Modo editar
      setTipo(existingMovimiento.tipo);
      setMonto(String(existingMovimiento.monto));
      setNota(existingMovimiento.nota || '');
      setEstado(existingMovimiento.estado);
      setFechaISO(existingMovimiento.fechaISO);
    }
  }, [mode, preset, existingMovimiento]);

  // Cargar recordatorios vinculados
  useEffect(() => {
    if (existingMovimiento?.id) {
      loadLinkedReminders(existingMovimiento.id);
      // También cargar carpetas vinculadas
      findLinkedFolders(tipo, existingMovimiento.id);
    }
  }, [existingMovimiento?.id]);

  // Manejar cambios de estado (completar recordatorios si se marca como pagado)
  useEffect(() => {
    if (existingMovimiento && estado === 'pagado' && existingMovimiento.estado !== 'pagado') {
      // El movimiento se marcó como pagado, completar recordatorios
      handleMovementPaid(existingMovimiento.id);
    }
  }, [estado, existingMovimiento]);

  const loadLinkedReminders = async (movementId) => {
    try {
      const { ReminderService } = require('../modules/reminders');
      const reminders = await ReminderService.getRemindersByMovement(movementId);
      setLinkedReminders(reminders);
      console.log('[MovementDetail] Recordatorios vinculados cargados:', reminders.length);
    } catch (error) {
      console.error('[MovementDetail] Error cargando recordatorios vinculados:', error);
      setLinkedReminders([]);
    }
  };

  const handleMovementPaid = async (movementId) => {
    try {
      await ReminderService.completeLinkedMovement(movementId);
      console.log('Recordatorios completados para movimiento:', movementId);
    } catch (error) {
      console.error('Error completando recordatorios:', error);
    }
  };

  const handleCreateReminder = () => {
    const movementId = existingMovimiento?.id;
    const reminderType = tipo; // 'pago' o 'cobro'
    
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('ReminderForm', {
        mode: 'create',
        linkedMovementId: movementId,
        type: reminderType,
        movementData: {
          tipo,
          monto: Number(monto) || 0,
          nota: nota.trim() || undefined,
          fechaISO
        }
      });
    } else {
      navigation.navigate('ReminderForm', {
        mode: 'create',
        linkedMovementId: movementId,
        type: reminderType,
        movementData: {
          tipo,
          monto: Number(monto) || 0,
          nota: nota.trim() || undefined,
          fechaISO
        }
      });
    }
  };

  const handleAddToFolder = async (folderName) => {
    console.log('[MovementDetail] Añadiendo a carpeta:', folderName);
    
    if (!existingMovimiento) {
      Alert.alert('Error', 'Primero debes guardar el movimiento');
      return;
    }

    const success = await addToFolder({
      type: tipo,
      refId: existingMovimiento.id,
      folderName,
      monto: Number(monto) || 0,
      concepto: nota.trim() || `${tipo === 'pago' ? 'Pago' : 'Cobro'} de $${monto}`,
      fecha: fechaISO,
      estado
    });

    if (success) {
      setShowFolderPicker(false);
      // Recargar carpetas vinculadas
      await findLinkedFolders(tipo, existingMovimiento.id);
    }
  };

  const handleSave = () => {
    if (!monto || isNaN(Number(monto))) {
      Alert.alert('Error', 'Por favor ingresá un monto válido');
      return;
    }

    const data = {
      tipo,
      monto: Number(monto),
      nota: nota.trim() || null,
      estado,
      fechaISO
    };

    if (mode === 'create') {
      const result = addMovimiento(data);
      if (result.success) {
        navigation.goBack();
      } else {
        Alert.alert('Error', result.error || 'No se pudo crear el movimiento');
      }
    } else if (mode === 'edit' && id) {
      const result = updateMovimiento(id, data);
      if (result.success) {
        navigation.goBack();
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar el movimiento');
      }
    }
  };

  const getTitle = () => {
    if (mode === 'create') return 'Crear Movimiento';
    if (mode === 'edit') return 'Editar Movimiento';
    return 'Detalle Movimiento';
  };

  if (mode === 'edit' && !existingMovimiento) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Movimiento no encontrado</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID="notaAccessoryMovementDetail">
          <View style={styles.accessoryContainer}>
            <TouchableOpacity 
              style={styles.accessoryButton} 
              onPress={Keyboard.dismiss}
            >
              <Text style={styles.accessoryButtonText}>Hecho</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
      
      <View style={styles.container}>
        <Text style={styles.title}>{getTitle()}</Text>
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onStartShouldSetResponder={() => {
            Keyboard.dismiss();
            return false;
          }}
        >
        {/* Tipo */}
        <View style={styles.section}>
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[styles.typeButton, tipo === 'pago' && styles.typeButtonActive]}
              onPress={() => setTipo('pago')}
            >
              <Text style={[styles.typeText, tipo === 'pago' && styles.typeTextActive]}>
                Pago
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, tipo === 'cobro' && styles.typeButtonActive]}
              onPress={() => setTipo('cobro')}
            >
              <Text style={[styles.typeText, tipo === 'cobro' && styles.typeTextActive]}>
                Cobro
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Monto */}
        <View style={styles.section}>
          <Text style={styles.label}>Monto</Text>
          <TextInput
            style={styles.input}
            value={monto}
            onChangeText={setMonto}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        {/* Nota */}
        <View style={styles.section}>
          <Text style={styles.label}>Nota (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={nota}
            onChangeText={setNota}
            placeholder="Descripción del movimiento"
            multiline
            numberOfLines={3}
            returnKeyType="done"
            enablesReturnKeyAutomatically={true}
            blurOnSubmit={true}
            onSubmitEditing={Keyboard.dismiss}
            inputAccessoryViewID={Platform.OS === 'ios' ? 'notaAccessoryMovementDetail' : undefined}
          />
        </View>

        {/* Estado */}
        <View style={styles.section}>
          <Text style={styles.label}>Estado</Text>
          <View style={styles.estadoContainer}>
            {['pendiente', 'pronto', 'urgente', 'pagado'].map(est => (
              <TouchableOpacity
                key={est}
                style={[
                  styles.estadoButton,
                  estado === est && styles.estadoButtonActive,
                  { backgroundColor: getEstadoColor(est, { selected: estado === est }) }
                ]}
                onPress={() => {
                  setEstado(est);
                  Keyboard.dismiss();
                }}
              >
                <Text style={[
                  styles.estadoText,
                  estado === est && styles.estadoTextActive
                ]}>
                  {est}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fecha */}
        <View style={styles.section}>
          <Text style={styles.label}>Fecha</Text>
          <Text style={styles.dateDisplay}>{formatDate(fechaISO)}</Text>
        </View>
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>
            {(mode === 'create' || mode === 'edit') ? 'Cancelar' : 'Volver'}
          </Text>
        </TouchableOpacity>
        
        {mode === 'view' && existingMovimiento && (
          <>
            <TouchableOpacity 
              style={[styles.button, styles.folderButton]} 
              onPress={() => setShowFolderPicker(true)}
            >
              <Ionicons name="folder" size={16} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Carpeta</Text>
              {linkedFolders.length > 0 && (
                <View style={styles.folderBadge}>
                  <Text style={styles.folderBadgeText}>{linkedFolders.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.reminderButton]} 
              onPress={handleCreateReminder}
            >
              <Ionicons name="notifications" size={16} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Recordatorio</Text>
            </TouchableOpacity>
          </>
        )}
        
        {(mode === 'create' || mode === 'edit') && (
          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>
              {mode === 'create' ? 'Crear' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
    
    {/* FolderPicker Modal */}
    {showFolderPicker && (
      <FolderPicker
        visible={showFolderPicker}
        onClose={() => setShowFolderPicker(false)}
        onSelect={handleAddToFolder}
      />
    )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCF8',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4D3527',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4D3527',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#3E7D75',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  estadoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  estadoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  estadoButtonActive: {
    // El color se maneja en getEstadoColor
  },
  estadoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  estadoTextActive: {
    color: '#FFFFFF',
  },
  dateDisplay: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  button: {
    flex: 1,
    backgroundColor: '#3E7D75',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  reminderButton: {
    backgroundColor: '#f39c12',
  },
  folderButton: {
    backgroundColor: '#3E7D75',
    position: 'relative',
  },
  folderBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  folderBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  accessoryContainer: {
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  accessoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3E7D75',
    borderRadius: 8,
  },
  accessoryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
