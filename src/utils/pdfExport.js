import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { movePDF, pdfName } from './fs';
import pdfTheme from '../pdf/theme';
import COLORS from '../theme/colors';
import { formatDate, formatCurrency } from './format';

// 🎨 IDENTIDAD CORPORATIVA ORDÉNATE - Usando theme centralizado
// Los colores corporativos están definidos en: src/theme/colors.js
// azul: #50616D, violeta: #6A5ACD, violetaClaro: #E8E5FF

/**
 * Generar nombre de archivo PDF
 */
function generatePDFFileName(config = {}) {
  const fecha = new Date();
  const timestamp = fecha.toISOString().slice(0, 10).replace(/-/g, '');
  const timeHour = fecha.toISOString().slice(11, 16).replace(':', '');
  
  const { cantidad = 0, isStyled = false } = config;
  
  let filename = 'Ordenate';
  if (isStyled) filename += '_Estilizado';
  filename += `_${timestamp}_${cantidad}mov_${timeHour}.pdf`;
  
  return filename.replace(/[<>:"/\\|?*]/g, '_');
}

/**
 * HTML BÁSICO ULTRA-COMPATIBLE
 */
function buildBasicPdfHtml(movimientos, options = {}) {
  const { titulo = 'Reporte de Movimientos', subtitulo = '' } = options;
  
  // Calcular totales
  let totalPagos = 0, totalCobros = 0;
  movimientos.forEach(mov => {
    if (mov?.tipo === 'pago') totalPagos += Number(mov.monto) || 0;
    if (mov?.tipo === 'cobro') totalCobros += Number(mov.monto) || 0;
  });
  const balance = totalCobros - totalPagos;

  // Generar filas
  const rows = movimientos.map(mov => `
    <tr>
      <td>${formatDate(mov?.fechaISO || mov?.fecha || '')}</td>
      <td>${mov?.tipo?.charAt(0).toUpperCase() + mov?.tipo?.slice(1) || ''}</td>
      <td style="text-align: right;">$${formatCurrency(mov?.monto || 0)}</td>
      <td>${mov?.estado || 'Sin estado'}</td>
      <td>${mov?.nota || ''}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body { 
      font-family: Arial, sans-serif;
      background-color: ${COLORS.violetaClaro};
      color: #333;
      line-height: 1.4;
    }
    
    .header { 
      background-color: ${COLORS.azul};
      color: ${COLORS.white};
      padding: 30px 20px;
      text-align: center;
    }
    
    .header h1 { 
      font-size: 24px; 
      margin-bottom: 8px;
      color: ${COLORS.white};
    }
    
    .header h2 { 
      font-size: 14px;
      color: ${COLORS.white};
      opacity: 0.9;
    }
    
    .content { 
      padding: 20px;
      background-color: ${COLORS.white};
      margin: 20px;
      border-radius: 8px;
    }
    
    .summary { 
      margin: 20px 0;
      padding: 15px;
      background-color: ${COLORS.violetaClaro};
      border-radius: 6px;
      border-left: 4px solid ${COLORS.violeta};
    }
    
    table { 
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    th { 
      background-color: ${COLORS.azul};
      color: ${COLORS.white};
      padding: 12px 8px;
      font-weight: bold;
      font-size: 12px;
    }
    
    td { 
      padding: 10px 8px;
      border-bottom: 1px solid #E0E0E0;
      font-size: 12px;
    }
    
    tr:nth-child(even) { 
      background-color: #F9FAFB;
    }
    
    .footer { 
      text-align: center;
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #E0E0E0;
      font-size: 11px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 ${titulo}</h1>
    ${subtitulo ? `<h2>${subtitulo}</h2>` : ''}
  </div>
  
  <div class="content">
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
      <p>📱 Generado por Ordénate App - ${new Date().toLocaleDateString('es-UY')}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * HTML ESTILIZADO ULTRA-COMPATIBLE
 */
function buildStyledPdfHtml(movimientos, options = {}) {
  const { titulo = 'Reporte de Movimientos', subtitulo = '' } = options;
  
  // Calcular totales
  let totalPagos = 0, totalCobros = 0;
  movimientos.forEach(mov => {
    if (mov?.tipo === 'pago') totalPagos += Number(mov.monto) || 0;
    if (mov?.tipo === 'cobro') totalCobros += Number(mov.monto) || 0;
  });
  const balance = totalCobros - totalPagos;

  // Generar filas con estilos
  const rows = movimientos.map(mov => {
    const tipoColor = mov?.tipo === 'pago' ? '#E74C3C' : '#27AE60';
    const tipoIcon = mov?.tipo === 'pago' ? '📤' : '📥';
    
    return `
    <tr>
      <td style="color: #666;">${formatDate(mov?.fechaISO || mov?.fecha || '')}</td>
      <td style="color: ${tipoColor}; font-weight: bold;">${tipoIcon} ${mov?.tipo?.charAt(0).toUpperCase() + mov?.tipo?.slice(1) || ''}</td>
      <td style="text-align: right; color: ${tipoColor}; font-weight: bold;">$${formatCurrency(mov?.monto || 0)}</td>
      <td style="text-align: center;">
        <span style="background: #F0F0F0; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">
          ${mov?.estado || 'Sin estado'}
        </span>
      </td>
      <td style="color: #666;">${mov?.nota || ''}</td>
    </tr>`;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      background-color: ${COLORS.violetaClaro};
      color: #333;
      line-height: 1.5;
    }
    
    .header { 
      background-color: ${COLORS.azul};
      color: ${COLORS.white};
      padding: 40px 20px;
      text-align: center;
    }
    
    .header h1 { 
      font-size: 28px; 
      margin-bottom: 10px;
      color: ${COLORS.white};
    }
    
    .header h2 { 
      font-size: 16px;
      color: ${COLORS.white};
      opacity: 0.9;
    }
    
    .content { 
      padding: 30px;
      background-color: ${COLORS.white};
      margin: 25px;
      border-radius: 12px;
    }
    
    .resumen-titulo {
      font-size: 20px;
      color: ${COLORS.azul};
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid ${COLORS.azul};
      padding-bottom: 10px;
    }
    
    .summary-cards { 
      display: flex;
      justify-content: space-around;
      margin: 20px 0;
      gap: 15px;
    }
    
    .card { 
      flex: 1;
      text-align: center;
      padding: 20px;
      background-color: ${COLORS.violetaClaro};
      border-radius: 10px;
      border-top: 4px solid;
    }
    
    .card-cobros { border-top-color: #27AE60; }
    .card-pagos { border-top-color: #E74C3C; }
    .card-balance { border-top-color: ${balance >= 0 ? '#27AE60' : '#E74C3C'}; }
    
    .card-icon { font-size: 24px; margin-bottom: 8px; }
    .card-label { font-size: 12px; color: #666; margin-bottom: 5px; font-weight: bold; }
    .card-value { font-size: 18px; font-weight: bold; }
    
    .income { color: #27AE60; }
    .expense { color: #E74C3C; }
    .balance { color: ${balance >= 0 ? '#27AE60' : '#E74C3C'}; }
    
    table { 
      width: 100%;
      border-collapse: collapse;
      margin-top: 30px;
      border-radius: 8px;
      overflow: hidden;
    }
    
    th { 
      background-color: ${COLORS.azul};
      color: ${COLORS.white};
      padding: 15px 10px;
      font-weight: bold;
      font-size: 12px;
    }
    
    td { 
      padding: 12px 10px;
      border-bottom: 1px solid #E0E0E0;
      font-size: 12px;
    }
    
    tr:nth-child(even) { 
      background-color: #F9FAFB;
    }
    
    .footer { 
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid ${COLORS.azul};
      font-size: 11px;
      color: #666;
    }
    
    .total-info {
      margin-top: 20px;
      text-align: center;
      font-size: 14px;
      color: ${COLORS.azul};
      font-weight: bold;
      padding: 10px;
      background-color: ${COLORS.violetaClaro};
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>💰 ${titulo}</h1>
    ${subtitulo ? `<h2>${subtitulo}</h2>` : ''}
  </div>
  
  <div class="content">
    <div class="resumen-titulo">📊 Resumen Ejecutivo</div>
    
    <div class="summary-cards">
      <div class="card card-cobros">
        <div class="card-icon">💚</div>
        <div class="card-label">COBROS</div>
        <div class="card-value income">$${formatCurrency(totalCobros)}</div>
      </div>
      <div class="card card-pagos">
        <div class="card-icon">🪙</div>
        <div class="card-label">PAGOS</div>
        <div class="card-value expense">$${formatCurrency(totalPagos)}</div>
      </div>
      <div class="card card-balance">
        <div class="card-icon">⚖️</div>
        <div class="card-label">BALANCE</div>
        <div class="card-value balance">$${formatCurrency(balance)}</div>
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

    <div class="total-info">
      📊 Total de movimientos: ${movimientos.length}
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
  </div>
</body>
</html>`;
}

/**
 * Exportar PDF básico
 */
export async function exportPDF(movimientos, opciones = {}) {
  try {
    if (!Array.isArray(movimientos) || movimientos.length === 0) {
      return { success: false, error: 'No hay movimientos para exportar' };
    }

    const config = {
      titulo: 'Reporte de Movimientos',
      subtitulo: `Generado el ${new Date().toLocaleDateString('es-UY')}`,
      ...opciones
    };

    const htmlContent = buildBasicPdfHtml(movimientos, config);
    const fileName = generatePDFFileName({ cantidad: movimientos.length, isStyled: false });

    // CONFIGURACIÓN ULTRA-SIMPLE PARA MÁXIMA COMPATIBILIDAD
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    const { uri: finalUri } = await movePDF(uri, fileName);

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
      message: `PDF exportado: ${movimientos.length} movimientos`
    };

  } catch (error) {
    console.error('Error en exportPDF:', error);
    return { 
      success: false, 
      error: error.message,
      message: 'Error al generar el PDF'
    };
  }
}

/**
 * Exportar PDF estilizado
 */
export async function exportPDFStyled(movimientos, opciones = {}) {
  try {
    if (!Array.isArray(movimientos) || movimientos.length === 0) {
      return { success: false, error: 'No hay movimientos para exportar' };
    }

    const config = {
      titulo: 'Reporte de Movimientos',
      subtitulo: `Generado el ${new Date().toLocaleDateString('es-UY')}`,
      ...opciones
    };

    const htmlContent = buildStyledPdfHtml(movimientos, config);
    const fileName = generatePDFFileName({ cantidad: movimientos.length, isStyled: true });

    // CONFIGURACIÓN ULTRA-SIMPLE PARA MÁXIMA COMPATIBILIDAD
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    const { uri: finalUri } = await movePDF(uri, fileName);

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
      message: `PDF estilizado exportado: ${movimientos.length} movimientos`
    };

  } catch (error) {
    console.error('Error en exportPDFStyled:', error);
    return { 
      success: false, 
      error: error.message,
      message: 'Error al generar el PDF estilizado'
    };
  }
}

// Mantener compatibilidad
export const exportarPDFSeleccion = exportPDFStyled;

// Wrapper para mes actual
export async function exportarPDFMesActual(movimientos) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');

  const delMes = movimientos.filter(mov => {
    if (!mov?.fechaISO && !mov?.fecha) return false;
    try {
      const d = new Date(mov.fechaISO || mov.fecha);
      return d.getFullYear() === y && (d.getMonth() + 1) === Number(m);
    } catch {
      return false;
    }
  });

  return exportPDFStyled(delMes, {
    subtitulo: `Movimientos de ${now.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' })}`
  });
} 