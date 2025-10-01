// src/utils/pdfExport.js
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

/**
 * Sanear nombre de archivo removiendo caracteres problemáticos
 * @param {string} filename - Nombre original del archivo
 * @returns {string} - Nombre saneado
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'archivo_exportado';
  
  return filename
    // Remover o reemplazar caracteres problemáticos
    .replace(/[<>:"/\\|?*]/g, '_') // Caracteres no válidos en nombres de archivo
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos/diacríticos
    .replace(/[áàäâãå]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõø]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/\s+/g, '_') // Reemplazar espacios por guiones bajos
    .replace(/_+/g, '_') // Múltiples guiones bajos por uno solo
    .replace(/^_+|_+$/g, '') // Remover guiones bajos al inicio y final
    .substring(0, 100) // Limitar longitud
    || 'archivo_exportado'; // Fallback si queda vacío
}

/**
 * Formatear moneda con formato LATAM (separadores de miles y decimales)
 * @param {number} amount - Cantidad a formatear
 * @returns {string} - Monto formateado (ej: "1.234,56")
 */
function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '0,00';
  return new Intl.NumberFormat('es-UY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formatear fecha en formato local dd/MM/yyyy
 * @param {string} isoString - Fecha ISO
 * @returns {string} - Fecha formateada
 */
function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
}

/**
 * Generar nombre de archivo según contexto, opciones y extensión
 * @param {string} contexto - Tipo de reporte ('mensual', 'seleccion', 'periodo', 'filtrado')
 * @param {Object} data - Datos adicionales para el nombre
 * @param {string} extension - Extensión del archivo ('pdf' o 'csv')
 * @returns {string} - Nombre del archivo
 */
function generateFileName(contexto, data = {}, extension = 'pdf') {
  const fecha = new Date();
  const timestamp = fecha.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const timeHour = fecha.toISOString().slice(11, 16).replace(':', ''); // HHMM
  
  switch (contexto) {
    case 'mensual': {
      if (data.mesAno) {
        const [ano, mes] = data.mesAno.split('-');
        const meses = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const mesTexto = meses[parseInt(mes) - 1];
        const fileName = `Ordenate_${mesTexto}_${ano}_${data.cantidad || 0}mov.${extension}`;
        return sanitizeFilename(fileName);
      }
      const fileName = `Ordenate_Mensual_${timestamp}.${extension}`;
      return sanitizeFilename(fileName);
    }
    
    case 'seleccion':
      const seleccionFileName = `Ordenate_Seleccion_${data.cantidad || 0}mov_${timestamp}-${timeHour}.${extension}`;
      return sanitizeFilename(seleccionFileName);
    
    case 'periodo':
      if (data.mesAno) {
        const [ano, mes] = data.mesAno.split('-');
        const periodoFileName = `Ordenate_Periodo_${mes}-${ano}_${data.cantidad || 0}mov.${extension}`;
        return sanitizeFilename(periodoFileName);
      }
      const periodoFileName = `Ordenate_Periodo_${timestamp}.${extension}`;
      return sanitizeFilename(periodoFileName);
    
    case 'filtrado': {
      // Para filtros desde modal de opciones
      let nombreParts = ['Ordenate'];
      
      // Agregar rango de fecha
      if (data.rango === 'actual') {
        const mesActual = fecha.getMonth() + 1;
        const anoActual = fecha.getFullYear();
        nombreParts.push(`${String(mesActual).padStart(2, '0')}-${anoActual}`);
      } else if (data.rango === 'anterior') {
        const mesAnterior = new Date(fecha.getFullYear(), fecha.getMonth() - 1);
        const mes = mesAnterior.getMonth() + 1;
        const ano = mesAnterior.getFullYear();
        nombreParts.push(`${String(mes).padStart(2, '0')}-${ano}`);
      } else if (data.rango === 'personalizado' && data.fechaDesde && data.fechaHasta) {
        // Convertir dd/mm/aaaa a formato compacto
        const desde = data.fechaDesde.replace(/\//g, '');
        const hasta = data.fechaHasta.replace(/\//g, '');
        nombreParts.push(`${desde}-${hasta}`);
      }
      
      // Agregar tipo si no es "ambos"
      if (data.tipo && data.tipo !== 'ambos') {
        nombreParts.push(data.tipo);
      }
      
      // Agregar estados si no son todos
      if (data.estados && data.estados.length > 0 && data.estados.length < 4) {
        nombreParts.push(data.estados.join('-'));
      }
      
      // Agregar cantidad
      nombreParts.push(`${data.cantidad || 0}mov`);
      
      const fileName = `${nombreParts.join('_')}.${extension}`;
      return sanitizeFilename(fileName);
    }
    
    default:
      const fileName = `Ordenate_Reporte_${timestamp}.${extension}`;
      return sanitizeFilename(fileName);
  }
}

/**
 * Construir HTML del PDF con diseño idéntico a la referencia colorida
 * @param {Array} movimientos - Lista de movimientos filtrados
 * @param {Object} options - Opciones de exportación
 * @returns {string} HTML completo del reporte
 */
function buildPdfHtml(movimientos, options = {}) {
  const {
    titulo = 'Reporte de Movimientos',
    subtitulo = '',
    columnas = ['fecha', 'tipo', 'monto', 'estado', 'nota'],
    isSelection = false
  } = options;
  
  // Calcular totales
  let totalPagos = 0;
  let totalCobros = 0;
  
  movimientos.forEach(mov => {
    if (mov.tipo === 'pago') {
      totalPagos += mov.monto || 0;
    } else if (mov.tipo === 'cobro') {
      totalCobros += mov.monto || 0;
    }
  });

  const balance = totalCobros - totalPagos;

  // Generar encabezados de columnas con íconos
  const headers = [];
  if (columnas.includes('fecha')) headers.push('<th>📅 Fecha</th>');
  if (columnas.includes('tipo')) headers.push('<th>💰 Tipo</th>');
  if (columnas.includes('monto')) headers.push('<th>💵 Monto</th>');
  if (columnas.includes('estado')) headers.push('<th>📋 Estado</th>');
  if (columnas.includes('nota')) headers.push('<th>📝 Nota</th>');

  // Generar filas de la tabla con estilos exactos
  const filasMovimientos = movimientos
    .sort((a, b) => new Date(b.fechaISO) - new Date(a.fechaISO))
    .map((mov, index) => {
      const isEvenRow = index % 2 === 0;
      const rowStyle = `background-color: ${isEvenRow ? '#ffffff' : '#f8f9fa'};`;
      
      const cells = [];
      
      if (columnas.includes('fecha')) {
        cells.push(`<td style="border-bottom: 1px solid #e0e0e0; padding: 12px;">${formatDate(mov.fechaISO)}</td>`);
      }
      
      if (columnas.includes('tipo')) {
        const tipoTexto = mov.tipo === 'pago' ? 'Pago' : 'Cobro';
        const tipoColor = mov.tipo === 'pago' ? '#e74c3c' : '#27ae60';
        cells.push(`<td style="border-bottom: 1px solid #e0e0e0; padding: 12px; font-weight: 600; color: ${tipoColor};">${tipoTexto}</td>`);
      }
      
      if (columnas.includes('monto')) {
        const signo = mov.tipo === 'pago' ? '-' : '+';
        const montoColor = mov.tipo === 'pago' ? '#e74c3c' : '#27ae60';
        const montoTexto = `${signo}$${formatCurrency(mov.monto)}`;
        cells.push(`<td style="border-bottom: 1px solid #e0e0e0; padding: 12px; text-align: right; font-weight: bold; color: ${montoColor};">${montoTexto}</td>`);
      }
      
      if (columnas.includes('estado')) {
        const estadoTexto = mov.estado || 'pendiente';
        const estadoColors = getEstadoColorPDF(estadoTexto);
        cells.push(`
          <td style="border-bottom: 1px solid #e0e0e0; padding: 12px;">
            <span style="
              display: inline-block;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 10px;
              line-height: 12px;
              font-weight: 700;
              text-transform: uppercase;
              background-color: ${estadoColors.backgroundColor};
              color: ${estadoColors.color};
            ">${estadoTexto}</span>
          </td>
        `);
      }
      
      if (columnas.includes('nota')) {
        const notaTexto = mov.nota || '—';
        cells.push(`<td style="border-bottom: 1px solid #e0e0e0; padding: 12px; word-wrap: break-word; color: #555;">${notaTexto}</td>`);
      }

      return `<tr style="${rowStyle} page-break-inside: avoid;">${cells.join('')}</tr>`;
    }).join('');

  // Mensaje para tablas vacías
  const filaVacia = movimientos.length === 0 ? `
    <tr>
      <td colspan="${headers.length}" style="padding: 30px; text-align: center; color: #64748b; font-style: italic; background-color: #f8fafc;">
        <div style="font-size: 16px; margin-bottom: 8px;">📋</div>
        No hay movimientos registrados para mostrar
      </td>
    </tr>
  ` : '';

  // Plantilla HTML con especificaciones exactas del usuario
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ordénate · Reporte Financiero</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
            
            @page {
                margin: 24px;
                size: A4;
            }
            
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            body {
                font-family: 'Poppins', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 12px;
                line-height: 1.5;
                color: #2c3e50;
                background: #ffffff;
                padding: 16px;
            }
            
            /* Header con íconos */
            .header {
                text-align: center;
                margin-bottom: 16px;
                padding: 20px 0;
            }
            
            .header h1 {
                color: #2c3e50;
                font-size: 22px;
                margin: 0 0 8px 0;
                font-weight: 700;
                font-family: 'Poppins', sans-serif;
            }
            
            .header .meta-info {
                color: #64748b;
                margin: 4px 0;
                font-size: 12px;
                font-weight: 400;
                display: flex;
                justify-content: center;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            /* Resumen Ejecutivo - contenedor limpio */
            .summary {
                background: transparent;
                color: #2c3e50;
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 16px;
                page-break-inside: avoid;
            }
            
            .summary h3 {
                margin: 0 0 12px 0;
                font-size: 14px;
                font-weight: 600;
                text-align: center;
                font-family: 'Poppins', sans-serif;
                color: #2c3e50;
            }
            
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
            }
            
            /* Tarjetas con fondo violeta degradado y sombra suave */
            .summary-item {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 8px;
                padding: 12px;
                text-align: center;
                color: white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            }
            
            .summary-item .icon {
                font-size: 18px;
                margin-bottom: 4px;
                display: block;
            }
            
            .summary-item .label {
                display: block;
                font-size: 11px;
                opacity: 0.9;
                margin-bottom: 4px;
                font-weight: 500;
            }
            
            .summary-item .value {
                display: block;
                font-size: 16px;
                font-weight: 700;
                font-family: 'Poppins', sans-serif;
            }
            
            /* Tabla con degradado azul en header */
            .table-container {
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 6px rgba(0,0,0,0.15);
                background: white;
                margin-bottom: 16px;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                background: white;
            }
            
            th {
                background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                color: white;
                font-weight: 700;
                text-align: left;
                font-size: 12px;
                padding: 12px;
                border: none;
                font-family: 'Poppins', sans-serif;
            }
            
            tbody tr:nth-child(odd) {
                background-color: #ffffff;
            }
            
            tbody tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            tbody tr {
                page-break-inside: avoid;
            }
            
            td {
                padding: 12px;
                border-bottom: 1px solid #e2e8f0;
                vertical-align: middle;
                font-size: 12px;
            }
            
            /* Footer con ícono */
            .footer {
                margin-top: 16px;
                text-align: center;
                font-size: 11px;
                color: #7f8c8d;
                border-top: 1px solid #e2e8f0;
                padding-top: 16px;
                page-break-inside: avoid;
            }
            
            .footer .app-info {
                font-weight: 600;
                color: #3498db;
                margin-bottom: 4px;
                font-family: 'Poppins', sans-serif;
            }
            
            /* Responsive para impresión */
            @media print {
                body { 
                    margin: 0; 
                    padding: 16px;
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                }
                .header { 
                    page-break-after: avoid;
                }
                .summary {
                    page-break-after: avoid;
                }
                tr { 
                    page-break-inside: avoid; 
                }
                thead {
                    display: table-header-group;
                }
            }
        </style>
    </head>
    <body>
        <!-- Header con íconos pequeños -->
        <div class="header">
            <h1>Ordénate · Reporte Financiero</h1>
            <div class="meta-info">
                <span>📅 ${new Date().toLocaleDateString('es-UY', {
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric'
                })}</span>
                <span>⏰ ${new Date().toLocaleTimeString('es-UY', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
            </div>
        </div>

        <!-- Resumen Ejecutivo con degradado violeta y íconos grandes -->
        <div class="summary">
            <h3>📈 Resumen Ejecutivo</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="icon">💚</span>
                    <span class="label">Cobros Totales</span>
                    <span class="value">$${formatCurrency(totalCobros)}</span>
                </div>
                <div class="summary-item">
                    <span class="icon">🪙</span>
                    <span class="label">Pagos Totales</span>
                    <span class="value">$${formatCurrency(totalPagos)}</span>
                </div>
                <div class="summary-item">
                    <span class="icon">⚖️</span>
                    <span class="label">Balance Neto</span>
                    <span class="value" style="color: ${balance >= 0 ? '#27ae60' : '#e74c3c'};">
                        ${balance >= 0 ? '+' : ''}$${formatCurrency(Math.abs(balance))}
                    </span>
                </div>
            </div>
        </div>

        <!-- Tabla con cabecera degradado azul -->
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        ${headers.join('')}
                    </tr>
                </thead>
                <tbody>
                    ${filasMovimientos}
                    ${filaVacia}
                </tbody>
            </table>
        </div>

        <!-- Footer con ícono -->
        <div class="footer">
            <div class="app-info">📱 Generado por Ordénate App</div>
            <div>Tu asistente financiero personal</div>
            <div>${movimientos.length} movimiento(s) incluido(s) en este reporte</div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Obtener color de estado para PDF según especificaciones exactas
 * @param {string} estado - Estado del movimiento
 * @returns {Object} Objeto con backgroundColor y color
 */
function getEstadoColorPDF(estado) {
  const estadoLower = (estado || '').toLowerCase();
  switch(estadoLower) {
    case 'urgente':
      return { backgroundColor: '#e74c3c', color: '#ffffff' };
    case 'pendiente':
      return { backgroundColor: '#f1c40f', color: '#000000' };
    case 'pagado':
      return { backgroundColor: '#27ae60', color: '#ffffff' };
    default:
      return { backgroundColor: '#95a5a6', color: '#ffffff' };
  }
}

/**
 * Escapar campos CSV (manejar comas, comillas y saltos de línea)
 * @param {string} field - Campo a escapar
 * @returns {string} Campo escapado para CSV
 */
function escapeCSVField(field) {
  if (field === null || field === undefined) return '';
  
  const stringField = String(field);
  
  // Si el campo contiene comas, comillas o saltos de línea, debe ir entre comillas
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
    // Escapar las comillas duplicándolas
    const escapedField = stringField.replace(/"/g, '""');
    return `"${escapedField}"`;
  }
  
  return stringField;
}

/**
 * Generar contenido CSV con columnas seleccionadas
 * @param {Array} movimientos - Lista de movimientos filtrados
 * @param {Object} opciones - Opciones de exportación
 * @returns {string} - Contenido del CSV
 */
function buildCSVContent(movimientos, opciones = {}) {
  console.log('[export] buildCSVContent iniciado', { movimientos: movimientos?.length, opciones });
  
  // Validaciones iniciales
  if (!movimientos || !Array.isArray(movimientos)) {
    console.error('[export] buildCSVContent: movimientos no válidos');
    return '';
  }

  const {
    columnas = ['fecha', 'tipo', 'monto', 'estado', 'nota']
  } = opciones;

  // Validar columnas
  if (!columnas || !Array.isArray(columnas) || columnas.length === 0) {
    console.error('[export] buildCSVContent: columnas no válidas');
    return '';
  }

  // Generar encabezados con validación
  const headers = [];
  const columnasValidas = ['fecha', 'tipo', 'monto', 'estado', 'nota'];
  
  columnas.forEach(col => {
    if (columnasValidas.includes(col)) {
      switch(col) {
        case 'fecha': headers.push('Fecha'); break;
        case 'tipo': headers.push('Tipo'); break;
        case 'monto': headers.push('Monto'); break;
        case 'estado': headers.push('Estado'); break;
        case 'nota': headers.push('Nota'); break;
      }
    }
  });

  if (headers.length === 0) {
    console.error('[export] buildCSVContent: No hay headers válidos');
    return '';
  }

  console.log('[export] buildCSVContent: Headers generados', headers);

  // Línea de encabezados
  let csvContent = headers.join(',') + '\n';

  // Verificar si hay movimientos para procesar
  if (movimientos.length === 0) {
    console.log('[export] buildCSVContent: No hay movimientos, retornando solo headers');
    return csvContent; // Solo headers
  }

  // Ordenar movimientos por fecha (más recientes primero)
  const movimientosOrdenados = [...movimientos] // copia para no mutar original
    .filter(mov => mov && typeof mov === 'object') // filtrar elementos válidos
    .sort((a, b) => {
      try {
        return new Date(b.fechaISO || 0) - new Date(a.fechaISO || 0);
      } catch (e) {
        return 0; // mantener orden original si hay error
      }
    });

  console.log('[export] buildCSVContent: Movimientos ordenados', movimientosOrdenados.length);

  // Generar filas de datos
  movimientosOrdenados.forEach((mov, index) => {
    try {
      const row = [];
      
      if (columnas.includes('fecha')) {
        const fechaStr = formatDate(mov.fechaISO);
        row.push(escapeCSVField(fechaStr));
      }
      
      if (columnas.includes('tipo')) {
        const tipoTexto = mov.tipo === 'pago' ? 'Pago' : 'Cobro';
        row.push(escapeCSVField(tipoTexto));
      }
      
      if (columnas.includes('monto')) {
        const signo = mov.tipo === 'pago' ? '-' : '+';
        const montoTexto = `${signo}${formatCurrency(mov.monto)}`;
        row.push(escapeCSVField(montoTexto));
      }
      
      if (columnas.includes('estado')) {
        const estadoTexto = mov.estado || 'pendiente';
        row.push(escapeCSVField(estadoTexto));
      }
      
      if (columnas.includes('nota')) {
        const notaTexto = mov.nota || '';
        row.push(escapeCSVField(notaTexto));
      }

      // Solo agregar fila si tiene al menos un campo
      if (row.length > 0) {
        csvContent += row.join(',') + '\n';
      }
    } catch (error) {
      console.error(`[export] Error procesando movimiento ${index}:`, error, mov);
      // Continuar con el siguiente movimiento
    }
  });

  console.log('[export] buildCSVContent completado, longitud final:', csvContent.length);
  return csvContent;
}

/**
 * Generar vista previa HTML para mostrar en WebView
 * @param {Array} movimientos - Lista de movimientos filtrados
 * @param {Object} opciones - Opciones de exportación
 * @returns {string} - HTML content para vista previa
 */
export function generarVistaPreviaHTML(movimientos, opciones = {}) {
  return buildPdfHtml(movimientos, opciones);
}

/**
 * Exportar movimientos filtrados a CSV
 * @param {Array} movimientos - Lista de movimientos filtrados
 * @param {Object} opciones - Opciones de exportación
 * @returns {Promise<boolean>} True si se exportó exitosamente
 */
export async function exportarCSV(movimientos, opciones = {}) {
  console.log('[export] Iniciando exportación CSV', { movimientos: movimientos?.length, opciones });
  
  try {
    // Validaciones iniciales
    if (!movimientos || !Array.isArray(movimientos) || movimientos.length === 0) {
      console.warn('[export] CSV: No hay movimientos para exportar');
      return { 
        success: false, 
        error: 'No hay datos para exportar',
        message: 'Selecciona al menos un movimiento para exportar.' 
      };
    }

    const {
      columnas = ['fecha', 'tipo', 'monto', 'estado', 'nota'],
      contexto = 'filtrado',
      ...dataParaNombre
    } = opciones;

    // Validar columnas
    if (!columnas || !Array.isArray(columnas) || columnas.length === 0) {
      console.warn('[export] CSV: No hay columnas válidas');
      return { 
        success: false, 
        error: 'Columnas no válidas',
        message: 'Selecciona al menos una columna para exportar.' 
      };
    }

    console.log('[export] CSV: Generando contenido con', { columnas, movimientos: movimientos.length });

    // Generar contenido CSV
    const csvContent = buildCSVContent(movimientos, { columnas });
    
    // Validar que csvContent es string y no está vacío
    if (!csvContent || typeof csvContent !== 'string' || csvContent.trim().length === 0) {
      console.error('[export] CSV: Error generando contenido CSV');
      return { 
        success: false, 
        error: 'Error generando CSV',
        message: 'No se pudo generar el contenido del archivo CSV.' 
      };
    }

    console.log('[export] CSV: Contenido generado, longitud:', csvContent.length);

    // Generar nombre del archivo
    let nombreArchivo = generateFileName(contexto, {
      cantidad: movimientos.length,
      ...dataParaNombre
    }, 'csv');
    
    // Asegurar que el nombre está sanitizado
    nombreArchivo = sanitizeFilename(nombreArchivo);
    if (!nombreArchivo.endsWith('.csv')) {
      nombreArchivo += '.csv';
    }

    console.log('[export] CSV: Nombre archivo:', nombreArchivo);

    // Usar cacheDirectory o documentDirectory como fallback
    const baseDirectory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    const fileUri = `${baseDirectory}${nombreArchivo}`;
    
    console.log('[export] CSV: Escribiendo archivo en:', fileUri);
    
    // Escribir contenido CSV al archivo
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: 'utf8',
    });

    console.log('[export] CSV: Archivo escrito exitosamente');

    // Verificar si el dispositivo puede compartir
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      console.warn('[export] CSV: Sharing no disponible, guardando localmente');
      return { 
        success: true,
        fileUri: fileUri,
        fileName: nombreArchivo,
        mimeType: 'text/csv',
        isLocalOnly: true,
        message: `Archivo guardado localmente en: ${fileUri}`
      };
    }

    console.log('[export] CSV: Sharing disponible, retornando info para ActionSheet');

    // Retornar información del archivo para el ActionSheet
    return {
      success: true,
      fileUri: fileUri,
      fileName: nombreArchivo,
      mimeType: 'text/csv'
    };
  } catch (error) {
    console.error('[export] Error al exportar CSV:', error);
    console.error('[export] Error stack:', error.stack);
    
    // Mensaje específico según el tipo de error
    let userMessage = 'No se pudo exportar el archivo CSV.';
    if (error.message.includes('write') || error.message.includes('ENOENT')) {
      userMessage = 'Error escribiendo el archivo. Verifica permisos de almacenamiento.';
    } else if (error.message.includes('network')) {
      userMessage = 'Error de conectividad. Verifica tu conexión.';
    }
    
    return { 
      success: false, 
      error: error.message,
      message: userMessage,
      technical: error.stack 
    };
  }
}

/**
 * Exportar movimientos del mes actual a PDF
 * @param {Array} movimientos - Lista de movimientos del contexto
 * @returns {Promise<boolean>} True si se exportó exitosamente
 */
export async function exportarPDFMesActual(movimientos) {
  try {
    // Obtener mes actual
    const hoy = new Date();
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    
    // Filtrar movimientos del mes actual
    const movimientosMes = movimientos.filter(mov => {
      if (!mov.fechaISO) return false;
      const fechaMov = mov.fechaISO.slice(0, 7); // "YYYY-MM"
      return fechaMov === mesActual;
    });
    
    // Generar HTML usando la nueva función
    const htmlContent = buildPdfHtml(movimientosMes, {
      titulo: 'Reporte Mensual',
      subtitulo: `Movimientos del mes actual`
    });
    
    // Generar PDF
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });
    
    // Verificar si el dispositivo puede compartir
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.warn('El compartir no está disponible en este dispositivo');
      return false;
    }
    
    // Generar nombre del archivo usando la función helper
    const nombreArchivo = generateFileName('mensual', { mesAno: mesActual, cantidad: movimientosMes.length }, 'pdf');
    
    // Compartir archivo
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar Reporte de Movimientos',
      UTI: 'com.adobe.pdf',
    });
    
    return true;
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    throw error;
  }
}

/**
 * Exportar movimientos de un período específico (para futuras mejoras)
 * @param {Array} movimientos - Lista de movimientos
 * @param {string} mesAno - Mes en formato "YYYY-MM"
 * @returns {Promise<boolean>} True si se exportó exitosamente
 */
export async function exportarPDFPeriodo(movimientos, mesAno) {
  try {
    // Filtrar movimientos del período especificado
    const movimientosPeriodo = movimientos.filter(mov => {
      if (!mov.fechaISO) return false;
      const fechaMov = mov.fechaISO.slice(0, 7); // "YYYY-MM"
      return fechaMov === mesAno;
    });
    
    const htmlContent = buildPdfHtml(movimientosPeriodo, {
      titulo: 'Reporte de Período',
      subtitulo: `Período: ${mesAno}`
    });
    
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });
    
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.warn('El compartir no está disponible en este dispositivo');
      return false;
    }
    
    const nombreArchivo = generateFileName('periodo', { mesAno, cantidad: movimientosPeriodo.length }, 'pdf');
    
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar Reporte de Movimientos',
      UTI: 'com.adobe.pdf',
    });
    
    return true;
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    throw error;
  }
}

/**
 * Exportar movimientos seleccionados con opciones avanzadas
 * @param {Array} movimientos - Lista de movimientos seleccionados
 * @param {Object} opciones - Opciones de exportación avanzadas
 * @returns {Promise<boolean>} True si se exportó exitosamente
 */
export async function exportarPDFSeleccion(movimientos, opciones = {}) {
  console.log('[export] Iniciando exportación PDF', { movimientos: movimientos?.length, opciones });
  
  try {
    // Validaciones iniciales
    if (!movimientos || !Array.isArray(movimientos) || movimientos.length === 0) {
      console.warn('[export] PDF: No hay movimientos para exportar');
      return { 
        success: false, 
        error: 'No hay datos para exportar',
        message: 'Selecciona al menos un movimiento para exportar.' 
      };
    }

    const {
      titulo = 'Selección de Movimientos',
      subtitulo = '',
      columnas = ['fecha', 'tipo', 'monto', 'estado', 'nota'],
      contexto = 'seleccion'
    } = opciones;

    console.log('[export] PDF: Generando HTML con', { titulo, subtitulo, columnas, movimientos: movimientos.length });

    // Generar HTML usando la función buildPdfHtml
    const htmlContent = buildPdfHtml(movimientos, {
      titulo,
      subtitulo: subtitulo || `${movimientos.length} movimientos seleccionados`,
      columnas,
      isSelection: true
    });
    
    // Validar que htmlContent es string y no está vacío
    if (!htmlContent || typeof htmlContent !== 'string' || htmlContent.trim().length === 0) {
      console.error('[export] PDF: Error generando contenido HTML');
      return { 
        success: false, 
        error: 'Error generando HTML',
        message: 'No se pudo generar el contenido del archivo PDF.' 
      };
    }

    console.log('[export] PDF: HTML generado, longitud:', htmlContent.length);
    
    // Generar PDF
    console.log('[export] PDF: Iniciando generación con Print.printToFileAsync');
    const printResult = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
      width: 612, // Letter width in points
      height: 792, // Letter height in points
      margins: {
        left: 20,
        top: 20,
        right: 20,
        bottom: 20,
      }
    });
    
    if (!printResult || !printResult.uri) {
      console.error('[export] PDF: Print.printToFileAsync no retornó URI válida');
      return { 
        success: false, 
        error: 'Error generando PDF',
        message: 'No se pudo generar el archivo PDF.' 
      };
    }

    console.log('[export] PDF: Archivo PDF generado en:', printResult.uri);
    
    // Generar nombre del archivo
    let nombreArchivo = generateFileName(contexto, { 
      cantidad: movimientos.length,
      titulo: titulo.replace(/[^a-zA-Z0-9]/g, '_'),
      ...opciones
    }, 'pdf');
    
    // Asegurar que el nombre está sanitizado
    nombreArchivo = sanitizeFilename(nombreArchivo);
    if (!nombreArchivo.endsWith('.pdf')) {
      nombreArchivo += '.pdf';
    }

    console.log('[export] PDF: Nombre archivo:', nombreArchivo);
    
    // Verificar si el dispositivo puede compartir
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      console.warn('[export] PDF: Sharing no disponible, guardando localmente');
      return { 
        success: true,
        fileUri: printResult.uri,
        fileName: nombreArchivo,
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        isLocalOnly: true,
        message: `Archivo PDF guardado localmente: ${nombreArchivo}`
      };
    }

    console.log('[export] PDF: Sharing disponible, retornando info para ActionSheet');
    
    // Retornar información del archivo para el ActionSheet
    return {
      success: true,
      fileUri: printResult.uri,
      fileName: nombreArchivo,
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf'
    };
  } catch (error) {
    console.error('[export] Error al exportar PDF:', error);
    console.error('[export] Error stack:', error.stack);
    
    // Mensaje específico según el tipo de error
    let userMessage = 'No se pudo exportar el archivo PDF.';
    if (error.message.includes('printToFile') || error.message.includes('html')) {
      userMessage = 'Error generando el PDF. El contenido podría ser muy grande.';
    } else if (error.message.includes('permission')) {
      userMessage = 'Permisos insuficientes para crear el archivo PDF.';
    } else if (error.message.includes('storage') || error.message.includes('space')) {
      userMessage = 'Espacio de almacenamiento insuficiente.';
    }
    
    return { 
      success: false, 
      error: error.message,
      message: userMessage,
      technical: error.stack 
    };
  }
}