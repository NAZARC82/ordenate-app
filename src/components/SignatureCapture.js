// src/components/SignatureCapture.js
// Componente para capturar firmas con react-native-signature-canvas

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Signature from 'react-native-signature-canvas';

export default function SignatureCapture({ 
  visible, 
  onClose, 
  onSave, 
  title = 'Capturar Firma',
  initialName = ''
}) {
  const signatureRef = useRef(null);
  const [signatureName, setSignatureName] = useState(initialName);
  const [isSigning, setIsSigning] = useState(false);

  const handleOK = (signature) => {
    if (!signature) {
      Alert.alert('Error', 'No se detectó ninguna firma. Por favor, firme en el área designada.');
      return;
    }

    if (!signatureName.trim()) {
      Alert.alert('Error', 'Por favor ingrese un nombre para la firma.');
      return;
    }

    onSave({
      dataURL: signature,
      name: signatureName.trim()
    });
    
    handleClose();
  };

  const handleEmpty = () => {
    Alert.alert('Error', 'Por favor firme en el área designada antes de guardar.');
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setIsSigning(false);
  };

  const handleClose = () => {
    setSignatureName(initialName);
    setIsSigning(false);
    onClose();
  };

  const handleBegin = () => {
    setIsSigning(true);
  };

  const style = `
    .m-signature-pad {
      position: relative;
      font-size: 10px;
      width: 100%;
      height: 100%;
      border: 1px solid #e8e8e8;
      background-color: #ffffff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.27), 0 0 40px rgba(0, 0, 0, 0.08) inset;
      border-radius: 4px;
    }
    
    .m-signature-pad--body {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 20px;
    }
    
    .m-signature-pad--body canvas {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      border-radius: 4px;
    }
    
    .m-signature-pad--footer {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 20px;
    }
    
    .m-signature-pad--footer .description {
      color: #C3C3C3;
      text-align: center;
      font-size: 12px;
      margin-top: 4px;
    }
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Nombre de la firma */}
          <View style={styles.nameSection}>
            <Text style={styles.sectionTitle}>Nombre del firmante</Text>
            <TextInput
              style={styles.nameInput}
              value={signatureName}
              onChangeText={setSignatureName}
              placeholder="Ingrese el nombre completo"
              autoCapitalize="words"
            />
          </View>

          {/* Área de firma */}
          <View style={styles.signatureSection}>
            <Text style={styles.sectionTitle}>Área de firma</Text>
            <View style={styles.signatureContainer}>
              <Signature
                ref={signatureRef}
                onOK={handleOK}
                onEmpty={handleEmpty}
                onBegin={handleBegin}
                descriptionText="Firme aquí"
                clearText="Limpiar"
                confirmText="Guardar"
                webStyle={style}
                autoClear={false}
                imageType="image/png"
              />
            </View>
          </View>

          {/* Instrucciones */}
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>📝 Instrucciones</Text>
            <Text style={styles.instructionsText}>
              • Ingrese el nombre del firmante en el campo superior{'\n'}
              • Use su dedo o stylus para firmar en el área blanca{'\n'}
              • La firma se guardará automáticamente al tocar "Guardar"{'\n'}
              • Use "Limpiar" para borrar y volver a firmar
            </Text>
          </View>
        </ScrollView>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.clearButton]} 
            onPress={handleClear}
          >
            <Ionicons name="refresh" size={20} color="#E74C3C" />
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.saveButton, !isSigning && styles.saveButtonDisabled]} 
            onPress={() => signatureRef.current?.readSignature()}
            disabled={!isSigning}
          >
            <Ionicons name="checkmark" size={20} color={isSigning ? "#FFFFFF" : "#999"} />
            <Text style={[styles.saveButtonText, !isSigning && styles.saveButtonTextDisabled]}>
              Guardar Firma
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  nameSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  signatureSection: {
    marginBottom: 24,
  },
  signatureContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  instructionsSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  clearButton: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  clearButtonText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3E7D75',
  },
  saveButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
});