import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { movePDF, pdfName } from './fs';
import pdfTheme from '../pdf/theme';
import { formatDate, formatCurrency } from './format';

/**
 * Obtener estilos de badge usando el tema centralizado (ULTRA DEFENSIVO)
 * @param {string} estado - Estado del movimiento ('urgente', 'pendiente', 'pagado')
 * @returns {Object} Objeto con background y text colors
 */
function getEstadoBadgeStyle(estado) {
  return pdfTheme.getBadgeStyle(estado);
}

/**
 * Generar nombre de archivo PDF inteligente
 * @param {Object} config - Configuración del reporte
 * @returns {string} - Nombre del archivo
 */
function generatePDFFileName(config = {}) {
  const fecha = new Date();
  const timestamp = fecha.toISOString().slice(0, 10).replace(/-/g, '');
  const timeHour = fecha.toISOString().slice(11, 16).replace(':', '');
  
  const {
    contexto = 'reporte',
    cantidad = 0,
    mesAno,
    isStyled = false
  } = config;
  
  let filename = 'Ordenate';
  
  if (isStyled) {
    filename += '_Estilizado';
  }
  
  if (contexto === 'mensual' && mesAno) {
    const [ano, mes] = mesAno.split('-');
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const mesTexto = meses[parseInt(mes) - 1];
    filename = `${filename}_${mesTexto}_${ano}`;
  } else if (contexto === 'seleccion') {
    filename += '_Seleccion';
  } else {
    filename += `_${timestamp}`;
  }
  
  filename += `_${cantidad}mov_${timeHour}.pdf`;
  
  // Sanear nombre
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
}

/**
 * Construir HTML básico del PDF (sin estilos avanzados)
 * @param {Array} movimientos - Lista de movimientos
 * @param {Object} options - Opciones de exportación
 * @returns {string} HTML del reporte básico
 */
function buildBasicPdfHtml(movimientos, options = {}) {
  const {
    titulo = 'Reporte de Movimientos',
    subtitulo = '',
    columnas = ['fecha', 'tipo', 'monto', 'estado', 'nota']
  } = options;
  
  // Calcular totales
  let totalPagos = 0;
  let totalCobros = 0;
  
  movimientos.forEach(mov => {
    if (!mov || typeof mov !== 'object') return;
    if (mov.tipo === 'pago') {
      totalPagos += Number(mov.monto) || 0;
    } else if (mov.tipo === 'cobro') {
      totalCobros += Number(mov.monto) || 0;
    }
  });

  const balance = totalCobros - totalPagos;

  // Generar filas de datos
  const rows = movimientos.filter(mov => mov && typeof mov === 'object').map(mov => {
    const cells = columnas.map(col => {
      switch(col) {
        case 'fecha':
          return `<td>${formatDate(mov?.fechaISO || mov?.fecha || '')}</td>`;
        case 'tipo':
          return `<td>${mov?.tipo?.charAt(0).toUpperCase() + mov?.tipo?.slice(1) || ''}</td>`;
        case 'monto':
          return `<td style="text-align: right;">$${formatCurrency(mov?.monto || 0)}</td>`;
        case 'estado':
          return `<td>${mov?.estado || 'Sin estado'}</td>`;
        case 'nota':
          return `<td>${mov?.nota || ''}</td>`;
        default:
          return `<td>${mov[col] || ''}</td>`;
      }
    }).join('');
    
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>
      <style>
        body { 
          font-family: Arial, sans-serif;
          color: ${pdfTheme.colors.text || '#4D3527'};
          padding: 20px;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid ${pdfTheme.colors.accent || '#3E7D75'};
          padding-bottom: 20px;
        }
        .header h1 { 
          color: ${pdfTheme.colors.accent || '#3E7D75'}; 
          font-size: 24px; 
          margin-bottom: 8px;
        }
        .summary {
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px;
        }
        th { 
          background: ${pdfTheme.colors.accent || '#3E7D75'}; 
          color: white; 
          padding: 12px 10px; 
          font-weight: 600;
        }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f8f9fa; }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: ${pdfTheme.colors.textSecondary || '#666666'};
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${titulo}</h1>
        ${subtitulo ? `<h2>${subtitulo}</h2>` : ''}
      </div>
      
      <div class="summary">
        <p><strong>Total Cobros:</strong> $${formatCurrency(totalCobros)}</p>
        <p><strong>Total Pagos:</strong> $${formatCurrency(totalPagos)}</p>
        <p><strong>Balance:</strong> $${formatCurrency(balance)}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="footer">
        <p>Generado por Ordénate App - ${new Date().toLocaleDateString('es-UY')}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Construir HTML estilizado del PDF con gradientes y diseño avanzado
 * @param {Array} movimientos - Lista de movimientos
 * @param {Object} options - Opciones de exportación
 * @returns {string} HTML del reporte estilizado
 */
function buildStyledPdfHtml(movimientos, options = {}) {
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
    if (!mov || typeof mov !== 'object') return;
    if (mov.tipo === 'pago') {
      totalPagos += Number(mov.monto) || 0;
    } else if (mov.tipo === 'cobro') {
      totalCobros += Number(mov.monto) || 0;
    }
  });

  const balance = totalCobros - totalPagos;

  // Generar filas de datos con estilos avanzados
  const rows = movimientos.map(mov => {
    const cells = columnas.map(col => {
      switch(col) {
        case 'fecha':
          return `<td style="color: ${pdfTheme.colors.textSecondary || '#666666'}; font-size: 11px;">${formatDate(mov?.fechaISO || mov?.fecha || '')}</td>`;
        
        case 'tipo': {
          const tipoStyle = mov?.tipo === 'pago' 
            ? `color: ${pdfTheme.colors.amount.negative || '#E74C3C'}; font-weight: 600;`
            : `color: ${pdfTheme.colors.amount.positive || '#27AE60'}; font-weight: 600;`;
          const emoji = mov?.tipo === 'pago' ? '📤' : '📥';
          return `<td style="${tipoStyle}">${emoji} ${mov?.tipo?.charAt(0).toUpperCase() + mov?.tipo?.slice(1) || ''}</td>`;
        }
        
        case 'monto': {
          const montoStyle = mov?.tipo === 'pago' 
            ? `color: ${pdfTheme.colors.amount.negative || '#E74C3C'}; font-weight: 700;`
            : `color: ${pdfTheme.colors.amount.positive || '#27AE60'}; font-weight: 700;`;
          return `<td style="text-align: right; ${montoStyle} font-size: 13px;">$${formatCurrency(mov?.monto || 0)}</td>`;
        }
        
        case 'estado': {
          const badgeStyle = getEstadoBadgeStyle(mov?.estado);
          return `<td style="text-align: center;">
            <span style="
              background: ${badgeStyle.background}; 
              color: ${badgeStyle.text}; 
              padding: 4px 8px; 
              border-radius: 12px; 
              font-size: 10px; 
              font-weight: 600;
              text-transform: uppercase;
            ">${mov?.estado || 'Sin estado'}</span>
          </td>`;
        }
        
        case 'nota':
          return `<td style="color: ${pdfTheme.colors.textSecondary || '#666666'}; font-size: 11px; max-width: 200px;">${mov?.nota || ''}</td>`;
        
        default:
          return `<td>${mov[col] || ''}</td>`;
      }
    }).join('');
    
    return `<tr style="border-bottom: 1px solid #E0E0E0;">${cells}</tr>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.4;
          color: ${pdfTheme.colors.text || '#4D3527'};
          background: ${pdfTheme.colors.background || '#FCFCF8'};
          padding: 24px;
        }
        .header { 
          text-align: center; 
          margin-bottom: 32px; 
          background: ${pdfTheme.colors.gradientViolet || 'linear-gradient(135deg, #667EEA, #764BA2)'};
          padding: 24px;
          border-radius: 12px;
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .header h1 { 
          font-size: 28px; 
          margin-bottom: 8px;
          font-weight: 700;
        }
        .header h2 { 
          font-size: 16px;
          font-weight: 400;
          opacity: 0.9;
        }
        .ejecutivo {
          margin: 24px 0;
          text-align: center;
        }
        .ejecutivo h3 {
          font-size: 18px;
          color: ${pdfTheme.colors.text || '#4D3527'};
          margin-bottom: 16px;
          font-weight: 600;
        }
        .summary {
          display: flex;
          justify-content: space-around;
          margin: 20px 0;
          gap: 16px;
        }
        .summary-card {
          flex: 1;
          text-align: center;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-top: 4px solid;
        }
        .card-cobros { border-top-color: ${pdfTheme.colors.amount.positive || '#27AE60'}; }
        .card-pagos { border-top-color: ${pdfTheme.colors.amount.negative || '#E74C3C'}; }
        .card-balance { border-top-color: ${balance >= 0 ? pdfTheme.colors.amount.positive || '#27AE60' : pdfTheme.colors.amount.negative || '#E74C3C'}; }
        .summary-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .summary-label {
          font-size: 12px;
          color: ${pdfTheme.colors.textSecondary || '#666666'};
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .summary-value {
          font-size: 20px;
          font-weight: 700;
        }
        .income { color: ${pdfTheme.colors.amount.positive || '#27AE60'}; }
        .expense { color: ${pdfTheme.colors.amount.negative || '#E74C3C'}; }
        .balance { color: ${balance >= 0 ? pdfTheme.colors.amount.positive || '#27AE60' : pdfTheme.colors.amount.negative || '#E74C3C'}; }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 24px;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        th { 
          background: ${pdfTheme.colors.gradientBlue || 'linear-gradient(135deg, #3498DB, #2980B9)'}; 
          color: white; 
          padding: 16px 12px; 
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td { 
          padding: 12px; 
          vertical-align: middle;
        }
        tr:nth-child(even) { 
          background: #fafafa; 
        }
        tr:hover { 
          background: #f0f0f0; 
        }
        .footer {
          margin-top: 32px;
          text-align: center;
          font-size: 11px;
          color: ${pdfTheme.colors.textSecondary || '#666666'};
          border-top: 1px solid #E0E0E0;
          padding-top: 16px;
        }
        .total-count {
          font-size: 14px;
          color: ${pdfTheme.colors.textSecondary || '#666666'};
          margin-top: 12px;
          text-align: center;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>💰 ${titulo}</h1>
        ${subtitulo ? `<h2>${subtitulo}</h2>` : ''}
      </div>
      
      <div class="ejecutivo">
        <h3>📊 Resumen Ejecutivo</h3>
        <div class="summary">
          <div class="summary-card card-cobros">
            <div class="summary-icon">💚</div>
            <div class="summary-label">Cobros</div>
            <div class="summary-value income">$${formatCurrency(totalCobros)}</div>
          </div>
          <div class="summary-card card-pagos">
            <div class="summary-icon">🪙</div>
            <div class="summary-label">Pagos</div>
            <div class="summary-value expense">$${formatCurrency(totalPagos)}</div>
          </div>
          <div class="summary-card card-balance">
            <div class="summary-icon">⚖️</div>
            <div class="summary-label">Balance</div>
            <div class="summary-value balance">$${formatCurrency(balance)}</div>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>📅 Fecha</th>
            <th>💰 Tipo</th>
            <th>💵 Monto</th>
            <th>🔄 Estado</th>
            <th>📝 Descripción</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="total-count">
        📊 Total de movimientos: <strong>${movimientos.length}</strong>
        ${isSelection ? ' (seleccionados)' : ''}
      </div>

      <div class="footer">
        <p>📱 Generado por Ordénate App - ${new Date().toLocaleDateString('es-UY', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Exportar PDF básico
 * @param {Array} movimientos - Lista de movimientos
 * @param {Object} opciones - Opciones de exportación
 * @returns {Object} Resultado de la operación
 */
export async function exportPDF(movimientos, opciones = {}) {
  try {
    if (!Array.isArray(movimientos) || movimientos.length === 0) {
      return {
        success: false,
        error: 'No hay movimientos para exportar'
      };
    }

    const config = {
      titulo: 'Reporte de Movimientos',
      subtitulo: `Generado el ${new Date().toLocaleDateString('es-UY')}`,
      columnas: ['fecha', 'tipo', 'monto', 'estado', 'nota'],
      contexto: 'reporte',
      ...opciones
    };

    // Generar HTML básico
    const htmlContent = buildBasicPdfHtml(movimientos, config);
    
    // Generar nombre de archivo
    const fileName = generatePDFFileName({
      ...config,
      cantidad: movimientos.length,
      isStyled: false
    });

    // Generar PDF
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
      margin: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
      }
    });

    // Mover archivo con nombre descriptivo usando helper
    const { uri: finalUri } = await movePDF(uri, fileName);

    // Compartir archivo
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(finalUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir PDF - Ordenate'
      });
    }

    return { 
      success: true, 
      fileUri: finalUri,
      fileName,
      message: `PDF exportado: ${movimientos.length} movimientos`,
      stats: {
        total: movimientos.length,
        pagos: movimientos.filter(m => m && m.tipo === 'pago').length,
        cobros: movimientos.filter(m => m && m.tipo === 'cobro').length
      }
    };

  } catch (error) {
    console.error('Error en exportPDF:', error);
    
    let userMessage = 'Error al generar el PDF';
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

/**
 * Exportar PDF estilizado con gradientes y diseño avanzado
 * @param {Array} movimientos - Lista de movimientos
 * @param {Object} opciones - Opciones de exportación
 * @returns {Object} Resultado de la operación
 */
export async function exportPDFStyled(movimientos, opciones = {}) {
  try {
    if (!Array.isArray(movimientos) || movimientos.length === 0) {
      return {
        success: false,
        error: 'No hay movimientos para exportar'
      };
    }

    const config = {
      titulo: 'Reporte de Movimientos',
      subtitulo: `Generado el ${new Date().toLocaleDateString('es-UY')}`,
      columnas: ['fecha', 'tipo', 'monto', 'estado', 'nota'],
      contexto: 'reporte',
      isSelection: false,
      ...opciones
    };

    // Generar HTML estilizado
    const htmlContent = buildStyledPdfHtml(movimientos, config);
    
    // Generar nombre de archivo
    const fileName = generatePDFFileName({
      ...config,
      cantidad: movimientos.length,
      isStyled: true
    });

    // Generar PDF
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
      margin: {
        top: 16,
        bottom: 16,
        left: 16,
        right: 16
      }
    });

    // Mover archivo con nombre descriptivo usando helper
    const { uri: finalUri } = await movePDF(uri, fileName);

    // Compartir archivo
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(finalUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir PDF Estilizado - Ordenate'
      });
    }

    return { 
      success: true, 
      fileUri: finalUri,
      fileName,
      message: `PDF estilizado exportado: ${movimientos.length} movimientos`,
      stats: {
        total: movimientos.length,
        pagos: movimientos.filter(m => m && m.tipo === 'pago').length,
        cobros: movimientos.filter(m => m && m.tipo === 'cobro').length,
        totalPagos: movimientos.filter(m => m && m.tipo === 'pago').reduce((sum, m) => sum + (Number(m.monto) || 0), 0),
        totalCobros: movimientos.filter(m => m && m.tipo === 'cobro').reduce((sum, m) => sum + (Number(m.monto) || 0), 0)
      }
    };

  } catch (error) {
    console.error('Error en exportPDFStyled:', error);
    
    let userMessage = 'Error al generar el PDF estilizado';
    if (error.message.includes('printToFile') || error.message.includes('html')) {
      userMessage = 'Error generando el PDF estilizado. El contenido podría ser muy grande.';
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

// Mantener compatibilidad con la función legacy
export const exportarPDFSeleccion = exportPDFStyled;

// ————————————————————————————————————————————————
// Wrapper: exportarPDFMesActual (compatibilidad con SettingsScreen)
export async function exportarPDFMesActual(movimientos) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');

  // Filtrar del mes actual (por fecha 'mov.fecha' en ISO o Date)
  const delMes = movimientos.filter(mov => {
    if (!mov || typeof mov !== 'object') return false;
    try {
      const fechaStr = mov.fechaISO || mov.fecha;
      if (!fechaStr) return false;
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === y && (d.getMonth() + 1) === Number(m);
    } catch {
      return false;
    }
  });

  // Caer en styled con contexto mensual
  return exportPDFStyled(delMes, {
    contexto: 'mensual',
    mesAno: `${y}-${m}`,
    subtitulo: `Movimientos de ${now.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' })}`,
    isSelection: false,
  });
}