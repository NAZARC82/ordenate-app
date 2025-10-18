import * as Sharing from 'expo-sharing';
import { saveCSV, csvName } from './fs';
import { saveCSVSafe } from './fs-safe'; // Nueva función segura
import { formatDate, formatCurrency } from './format';
import { getExportMeta, ensureFileName } from './exportMeta';

/**
 * Escapa un campo CSV (manejar comas, comillas y saltos de línea)
 * ÚNICA función centralizada
 */
export function escapeCSVField(field) {
  if (field === null || field === undefined) return '';
  const s = String(field);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Formatear moneda con signo según tipo (CSV específico)
 * @param {number} amount - Cantidad a formatear
 * @param {string} tipo - Tipo de movimiento ('cobro' o 'pago')
 * @returns {string} - Monto formateado con signo
 */
function formatCurrencyWithSign(amount, tipo) {
  if (typeof amount !== 'number' || isNaN(amount)) return '0,00';
  const formatted = formatCurrency(Math.abs(amount));
  const sign = tipo === 'cobro' ? '+' : '-';
  return `${sign}${formatted}`;
}

/**
 * Construir contenido CSV
 */
function buildCSVContent(movimientos, opciones = {}) {
  const {
    includeHeaders = true,
    columnas = ['fecha', 'tipo', 'monto', 'estado', 'nota'],
    titulo = 'Reporte de Movimientos - Ordénate',
    includeSignatureColumns = false,
    signatures = null
  } = opciones;

  let csv = ''; // BOM UTF-8 manejado por helper

  // Título y metadatos
  if (titulo) {
    csv += `${escapeCSVField(titulo)}\n`;
    csv += `Fecha de generación,${escapeCSVField(formatDate(new Date().toISOString()))}\n`;
    csv += `Total de movimientos,${movimientos.length}\n\n`;
  }

  // Encabezados
  if (includeHeaders) {
    const headers = [];
    if (columnas.includes('fecha')) headers.push('Fecha');
    if (columnas.includes('tipo')) headers.push('Tipo');
    if (columnas.includes('monto')) headers.push('Monto');
    if (columnas.includes('estado')) headers.push('Estado');
    if (columnas.includes('nota')) headers.push('Descripción');
    
    // Agregar columnas de firma si está habilitado
    if (includeSignatureColumns && signatures && signatures.mode !== 'none') {
      headers.push('Firma Requerida');
      headers.push('Cliente Nombre');
      headers.push('Responsable Nombre');
      headers.push('Firma Fecha');
      headers.push('Firma Lugar');
    }
    
    csv += headers.map(escapeCSVField).join(',') + '\n';
  }

  // Filas
  movimientos.forEach(mov => {
    const row = [];
    if (columnas.includes('fecha')) row.push(formatDate(mov.fecha));
    if (columnas.includes('tipo')) row.push(mov.tipo ? mov.tipo[0].toUpperCase() + mov.tipo.slice(1) : '');
    if (columnas.includes('monto')) row.push(formatCurrencyWithSign(mov.monto || 0, mov.tipo));
    if (columnas.includes('estado')) row.push(mov.estado ? mov.estado[0].toUpperCase() + mov.estado.slice(1) : '');
    if (columnas.includes('nota')) row.push(mov.nota || '');
    
    // Agregar datos de firma si está habilitado
    if (includeSignatureColumns && signatures && signatures.mode !== 'none') {
      const { meta = {} } = signatures;
      row.push(meta.firmaRequerida ? 'Sí' : 'No');
      row.push(meta.clienteNombre || '');
      row.push(meta.responsableNombre || '');
      row.push(meta.fecha ? formatDate(new Date(meta.fecha).toISOString()) : '');
      row.push(meta.lugar || '');
    }
    
    csv += row.map(escapeCSVField).join(',') + '\n';
  });

  // Totales
  if (movimientos.length > 0) {
    const totalPagos = movimientos.filter(m => m.tipo === 'pago').reduce((s, m) => s + (m.monto || 0), 0);
    const totalCobros = movimientos.filter(m => m.tipo === 'cobro').reduce((s, m) => s + (m.monto || 0), 0);
    const balance = totalCobros - totalPagos;

    csv += `\nTotal Pagos,${escapeCSVField(formatCurrencyWithSign(totalPagos, 'pago'))}\n`;
    csv += `Total Cobros,${escapeCSVField(formatCurrencyWithSign(totalCobros, 'cobro'))}\n`;
    csv += `Balance,${escapeCSVField(formatCurrencyWithSign(Math.abs(balance), balance >= 0 ? 'cobro' : 'pago'))}\n`;
  }

  return csv;
}

/**
 * Generar nombre de archivo CSV
 */
function generateCSVFileName(config = {}) {
  const fecha = new Date();
  const timestamp = fecha.toISOString().slice(0, 10).replace(/-/g, '');
  const timeHour = fecha.toISOString().slice(11, 16).replace(':', '');
  const { contexto = 'reporte', cantidad = 0, mesAno, tipo } = config;

  let filename = 'Ordenate';
  if (contexto === 'mensual' && mesAno) {
    const [ano, mes] = mesAno.split('-');
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    filename += `_${meses[parseInt(mes) - 1]}_${ano}`;
  } else {
    filename += `_${timestamp}`;
  }
  if (tipo && tipo !== 'ambos') filename += `_${tipo}`;
  filename += `_${cantidad}mov_${timeHour}.csv`;

  return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_');
}

/**
 * Exportar CSV
 */
export async function exportCSV(movimientos, opciones = {}) {
  try {
    if (!Array.isArray(movimientos) || movimientos.length === 0) {
      return { success: false, error: 'No hay movimientos para exportar' };
    }

    const config = { contexto: 'reporte', includeHeaders: true, ...opciones };
    const csvContent = buildCSVContent(movimientos, config);
    
    // ✅ VALIDAR contenido CSV
    if (!csvContent || csvContent.length < 10) {
      console.error('[exportCSV] Contenido CSV inválido o vacío');
      return { success: false, error: 'Exportación vacía: no hay movimientos.' };
    }
    
    const baseFileName = generateCSVFileName({ ...config, cantidad: movimientos.length });
    
    // ✅ Asegurar extensión y mimeType correctos
    const { ext, mime } = getExportMeta('csv');
    const fileName = ensureFileName(baseFileName, ext);
    
    console.log('[exportCSV] Guardando CSV con BOM UTF-8...');
    
    // ✅ USAR saveCSVSafe con BOM y verificación
    const { uri: fileUri, exists } = await saveCSVSafe(fileName, csvContent);
    
    if (!exists) {
      throw new Error('El archivo CSV no se creó correctamente');
    }

    // Registrar en documentos recientes
    let documentId = null;
    try {
      const { addRecent } = require('../features/documents/registry');
      documentId = `csv_${Date.now()}`;
      await addRecent({
        id: documentId,
        kind: 'csv',
        name: fileName,
        uri: fileUri
      });
      console.log('[exportCSV] Registrado en recientes:', fileName);
    } catch (err) {
      console.warn('[exportCSV] No se pudo registrar en recientes:', err);
    }

    // ⚠️ YA NO SE COMPARTE AUTOMÁTICAMENTE
    // El usuario decide qué hacer con el archivo desde el ActionSheet modal
    // Se eliminaron:
    // - Sharing.shareAsync automático
    // - openWith automático (incluso con showOpenWithAfterExport)
    // El archivo se guarda y registra en Recientes, nada más.

    console.log('[exportCSV] ✅ Exportación completada exitosamente');

    return { 
      success: true, 
      fileUri, 
      fileName, 
      message: `CSV exportado: ${movimientos.length} movimientos`,
      mimeType: mime, // ✅ MIME correcto: text/csv
      documentId // ID para poder eliminar de Recientes desde ActionSheet
    };
  } catch (error) {
    console.error('Error en exportCSV:', error);
    return { success: false, error: error.message, technical: error.stack };
  }
}