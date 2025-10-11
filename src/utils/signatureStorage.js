// src/utils/signatureStorage.js
// Utilidades para manejar firmas en AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';

const SIGNATURE_STORAGE_KEY = 'ordenate:signatures:v1';

/**
 * Configuración por defecto para firmas
 */
const DEFAULT_SIGNATURE_CONFIG = {
  version: 1,
  defaultMeta: {
    lugar: 'Montevideo, Uruguay',
    fecha: null, // Se establece dinámicamente
    clienteNombre: 'Cliente',
    responsableNombre: 'Responsable',
    firmaRequerida: true
  },
  clienteSignature: null,
  responsableSignature: null
};

/**
 * Cargar configuración de firmas desde AsyncStorage
 */
export async function loadSignatureConfig() {
  try {
    const stored = await AsyncStorage.getItem(SIGNATURE_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SIGNATURE_CONFIG;
    }
    
    const parsed = JSON.parse(stored);
    // Merge con defaults para asegurar todas las propiedades
    return {
      ...DEFAULT_SIGNATURE_CONFIG,
      ...parsed,
      defaultMeta: {
        ...DEFAULT_SIGNATURE_CONFIG.defaultMeta,
        ...parsed.defaultMeta
      }
    };
  } catch (error) {
    console.warn('Error cargando configuración de firmas:', error);
    return DEFAULT_SIGNATURE_CONFIG;
  }
}

/**
 * Guardar configuración de firmas en AsyncStorage
 */
export async function saveSignatureConfig(config) {
  try {
    const toSave = {
      ...config,
      version: 1
    };
    await AsyncStorage.setItem(SIGNATURE_STORAGE_KEY, JSON.stringify(toSave));
    return { success: true };
  } catch (error) {
    console.error('Error guardando configuración de firmas:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Guardar firma específica (cliente o responsable)
 */
export async function saveSignature(type, signatureData) {
  try {
    const config = await loadSignatureConfig();
    const signature = {
      dataURL: signatureData.dataURL,
      timestamp: new Date().toISOString(),
      name: signatureData.name || type
    };
    
    if (type === 'cliente') {
      config.clienteSignature = signature;
    } else if (type === 'responsable') {
      config.responsableSignature = signature;
    } else {
      throw new Error(`Tipo de firma inválido: ${type}`);
    }
    
    return await saveSignatureConfig(config);
  } catch (error) {
    console.error('Error guardando firma:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar firma específica
 */
export async function deleteSignature(type) {
  try {
    const config = await loadSignatureConfig();
    
    if (type === 'cliente') {
      config.clienteSignature = null;
    } else if (type === 'responsable') {
      config.responsableSignature = null;
    } else {
      throw new Error(`Tipo de firma inválido: ${type}`);
    }
    
    return await saveSignatureConfig(config);
  } catch (error) {
    console.error('Error eliminando firma:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar metadatos por defecto
 */
export async function updateDefaultMeta(newMeta) {
  try {
    const config = await loadSignatureConfig();
    config.defaultMeta = {
      ...config.defaultMeta,
      ...newMeta
    };
    return await saveSignatureConfig(config);
  } catch (error) {
    console.error('Error actualizando metadatos:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generar opciones de firma para exportación
 */
export async function generateSignatureOptions(mode = 'none', customMeta = {}) {
  try {
    const config = await loadSignatureConfig();
    
    const meta = {
      ...config.defaultMeta,
      ...customMeta,
      fecha: customMeta.fecha || new Date().toISOString()
    };
    
    const images = {};
    if (config.clienteSignature) {
      images.cliente = config.clienteSignature;
    }
    if (config.responsableSignature) {
      images.responsable = config.responsableSignature;
    }
    
    return {
      mode,
      meta,
      images: Object.keys(images).length > 0 ? images : undefined
    };
  } catch (error) {
    console.error('Error generando opciones de firma:', error);
    return {
      mode: 'none',
      meta: DEFAULT_SIGNATURE_CONFIG.defaultMeta,
      images: undefined
    };
  }
}