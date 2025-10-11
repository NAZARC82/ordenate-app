import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { movePDF, pdfName } from './fs';
import pdfTheme from '../pdf/theme';
import COLORS from '../theme/colors';
import { formatDate, formatCurrency } from './format';

// 🎨 COLORES VÁLIDOS PARA CSS - Parche para expo-print
// Usar RGBA (no #RRGGBBAA) para que expo-print no los ignore
const PDF_COLORS = {
  azul: '#50616D',
  violeta: '#6A5ACD',
  // Aumentamos la opacidad para que sea más visible
  violetaClaro: 'rgba(106, 90, 205, 0.25)',
  // Fallback más sólido en caso de que RGBA falle
  violetaFallback: '#E8E5FF',
  white: '#FFFFFF',
  grisBorde: '#E5E7EB',
  texto: '#2D3748',
  textoSec: '#6B7280',
};

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
    * { margin: 0; padding: 0; box-sizing: border-box; 
        -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    html, body { height: 100%; }
    
    body { 
      font-family: Arial, sans-serif;
      color: #333;
      line-height: 1.4;
    }

    /* Fondo violeta que SIEMPRE se imprime */
    .page-bg {
      position: fixed;
      inset: 0;
      z-index: 0;
      background: rgba(106, 90, 205, 0.18);
    }
    
    .header { 
      background: ${COLORS.azul};
      color: ${COLORS.white};
      padding: 30px 20px;
      text-align: center;
      position: relative; 
      z-index: 2;
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
      background: ${COLORS.white};
      margin: 16px;
      border-radius: 8px;
      border: 2px solid ${COLORS.violeta};
      position: relative; 
      z-index: 1;
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
      background: ${COLORS.azul};
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
  <div class="page-bg"></div>
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

/**
 * 🖋️ BLOQUE DE FIRMAS CONDICIONAL
 * Genera HTML para firmas según el modo seleccionado
 */
function buildSignatureBlock(signatures) {
  if (!signatures || signatures.mode === 'none') {
    return '';
  }

  const { mode, meta = {}, images = {} } = signatures;
  const { lugar = '', fecha = '', clienteNombre = 'Cliente', responsableNombre = 'Responsable' } = meta;
  
  const fechaFirma = fecha ? new Date(fecha).toLocaleDateString('es-UY') : new Date().toLocaleDateString('es-UY');
  const lugarFirma = lugar || 'Montevideo, Uruguay';

  if (mode === 'lines') {
    return `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #DDE3EA;">
        <div style="text-align: center; margin-bottom: 20px; color: #6B7280; font-size: 12px;">
          ${lugarFirma}, ${fechaFirma}
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 50px;">
          <div style="text-align: center; width: 45%;">
            <div style="border-bottom: 1px solid #374151; height: 60px; margin-bottom: 8px;"></div>
            <div style="font-size: 12px; color: #374151; font-weight: 600;">
              ${clienteNombre}
            </div>
            <div style="font-size: 11px; color: #6B7280;">
              Firma del Cliente
            </div>
          </div>
          <div style="text-align: center; width: 45%;">
            <div style="border-bottom: 1px solid #374151; height: 60px; margin-bottom: 8px;"></div>
            <div style="font-size: 12px; color: #374151; font-weight: 600;">
              ${responsableNombre}
            </div>
            <div style="font-size: 11px; color: #6B7280;">
              Firma del Responsable
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (mode === 'images') {
    const clienteImg = images.cliente?.dataURL;
    const responsableImg = images.responsable?.dataURL;
    
    return `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #DDE3EA;">
        <div style="text-align: center; margin-bottom: 20px; color: #6B7280; font-size: 12px;">
          ${lugarFirma}, ${fechaFirma}
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 30px;">
          <div style="text-align: center; width: 45%;">
            ${clienteImg 
              ? `<img src="${clienteImg}" style="max-width: 200px; max-height: 80px; border: 1px solid #E5E7EB; border-radius: 4px; margin-bottom: 8px;" />`
              : `<div style="border-bottom: 1px solid #374151; height: 60px; margin-bottom: 8px;"></div>`
            }
            <div style="font-size: 12px; color: #374151; font-weight: 600;">
              ${clienteNombre}
            </div>
            <div style="font-size: 11px; color: #6B7280;">
              Firma del Cliente
            </div>
          </div>
          <div style="text-align: center; width: 45%;">
            ${responsableImg 
              ? `<img src="${responsableImg}" style="max-width: 200px; max-height: 80px; border: 1px solid #E5E7EB; border-radius: 4px; margin-bottom: 8px;" />`
              : `<div style="border-bottom: 1px solid #374151; height: 60px; margin-bottom: 8px;"></div>`
            }
            <div style="font-size: 12px; color: #374151; font-weight: 600;">
              ${responsableNombre}
            </div>
            <div style="font-size: 11px; color: #6B7280;">
              Firma del Responsable
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return '';
}

/**
 * 🎨 HTML CON COLORES CORPORATIVOS FORZADOS
 * Nueva función para generar PDF con identidad visual corporativa
 */
function buildPdfHtmlColored(movimientos, opciones = {}) {
  const {
    titulo = 'Reporte de Movimientos',
    subtitulo = '',
    columnas = ['fecha', 'tipo', 'monto', 'estado', 'nota'],
    signatures = null
  } = opciones;

  let totalPagos = 0;
  let totalCobros = 0;

  movimientos.forEach(mov => {
    if (!mov) return;
    if (mov?.tipo === 'pago') totalPagos += Number(mov.monto) || 0;
    if (mov?.tipo === 'cobro') totalCobros += Number(mov.monto) || 0;
  });

  const balance = totalCobros - totalPagos;

  const rows = movimientos.map(mov => {
    const fecha = formatDate(mov?.fechaISO || mov?.fecha || '');
    const tipo = mov?.tipo?.charAt(0).toUpperCase() + mov?.tipo?.slice(1) || '';
    const monto = formatCurrency(mov?.monto || 0);
    const estado = mov?.estado || '';
    const nota = mov?.nota || '';
    
    return `
      <tr>
        <td>${fecha}</td>
        <td style="color:${mov?.tipo === 'pago' ? '#C0392B' : '#2ca05cff'}; font-weight: bold;">
          ${mov?.tipo === 'pago' ? '📤' : '💚'} ${tipo}
        </td>
        <td style="text-align:right; font-weight:600; color:${mov?.tipo === 'pago' ? '#C0392B' : '#27AE60'}">
          $${monto}
        </td>
        <td>
          <span style="background: ${PDF_COLORS.violetaFallback}; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
            ${estado}
          </span>
        </td>
        <td style="color: ${PDF_COLORS.textoSec};">${nota}</td>
      </tr>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>
      <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; 
            -webkit-print-color-adjust: exact; print-color-adjust: exact; }

        html, body { height: 100%; }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          color: #2D3748;
          background: #FFFFFF;
        }

        /* Header azul corporativo #50616D */
        .header {
          background: #50616D;
          color: #FFFFFF;
          padding: 28px 20px;
          text-align: center;
          position: relative;
          z-index: 2;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 6px;
        }
        
        .header h2 {
          font-size: 14px;
          opacity: 0.95;
        }
        
        /* Contenedor principal en blanco para contraste */
        .content {
          background: #FFFFFF;
          margin: 22px;
          padding: 26px;
          border-radius: 12px;
          position: relative;
          z-index: 1;
        }
        
        /* Bloque Resumen: Color violeta uniforme */
        .summary-wrap {
          background: #6A5ACD;
          color: #FFFFFF;
          border-radius: 14px;
          padding: 22px;
          margin: 10px 0 22px 0;
          box-shadow: 0 8px 16px rgba(106,90,205,.20);
          border: 1px solid rgba(255,255,255,.20);
          opacity: 0.95;
        }
        
        .summary-title {
          font-weight: 800;
          font-size: 18px;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .cards {
          display: flex;
          gap: 14px;
        }
        
        .card {
          flex: 1;
          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.36);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.25);
        }
        
        .card-label {
          font-size: 12px;
          letter-spacing: .4px;
          opacity: .95;
          font-weight: 700;
        }
        
        .card-value {
          font-size: 20px;
          font-weight: 800;
          margin-top: 6px;
        }
        
        .green { color: #27AE60; }
        .red { color: #C0392B; }
        
        /* Tabla con encabezado azul corporativo */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 18px;
          border-radius: 10px;
          overflow: hidden;
        }
        
        thead th {
          background: #2F6FA8;
          color: #FFFFFF;
          padding: 12px 10px;
          font-weight: 800;
          font-size: 12px;
        }
        
        tbody td {
          padding: 12px 10px;
          border-bottom: 1px solid #E5E7EB;
          font-size: 12px;
        }
        
        tbody tr:nth-child(even) {
          background: #F8FAFD;
        }
        
        /* Footer sutil */
        .footer {
          text-align: center;
          margin-top: 22px;
          padding-top: 16px;
          border-top: 1px solid #DDE3EA;
          color: #6B7280;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 ${titulo}</h1>
        ${subtitulo ? `<h2>${subtitulo}</h2>` : ''}
      </div>
      
      <div class="content">
        <div class="summary-wrap">
          <div class="summary-title">📊 Resumen Ejecutivo</div>
          <div class="cards">
            <div class="card">
              <div class="card-label">💚 COBROS</div>
              <div class="card-value green">$${formatCurrency(totalCobros)}</div>
            </div>
            <div class="card">
              <div class="card-label">📤 PAGOS</div>
              <div class="card-value red">$${formatCurrency(totalPagos)}</div>
            </div>
            <div class="card">
              <div class="card-label">⚖️ BALANCE</div>
              <div class="card-value ${balance >= 0 ? 'green' : 'red'}">$${formatCurrency(balance)}</div>
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
              <th>📝 Nota</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="footer">
          📱 Generado por Ordénate App - ${new Date().toLocaleDateString('es-UY', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} | Total: ${movimientos.length} movimientos
        </div>
        
        ${buildSignatureBlock(signatures)}
      </div>
    </body>
    </html>
  `;
}

/**
 * 🚀 EXPORTAR PDF CON COLORES CORPORATIVOS
 * Nueva función para probar PDF con colores forzados
 */
export async function exportPDFColored(movimientos, opciones = {}) {
  try {
    if (!Array.isArray(movimientos) || movimientos.length === 0) {
      return { success: false, error: 'No hay movimientos para exportar' };
    }

    const config = {
      titulo: 'Reporte Corporativo Ordénate',
      subtitulo: `Generado el ${new Date().toLocaleDateString('es-UY')} - Colores Corporativos`,
      ...opciones
    };

    const htmlContent = buildPdfHtmlColored(movimientos, config);
    const fileName = generatePDFFileName({ cantidad: movimientos.length, isStyled: true });

    // CONFIGURACIÓN CON MÁRGENES 0 PARA FORZAR COLORES
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
      margin: { top: 0, bottom: 0, left: 0, right: 0 } // sin márgenes para evitar recorte
    });

    const { uri: finalUri } = await movePDF(uri, fileName);

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(finalUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir PDF Corporativo - Ordenate'
      });
    }

    return { 
      success: true, 
      fileUri: finalUri,
      fileName,
      message: `PDF corporativo exportado: ${movimientos.length} movimientos`,
      uri: finalUri
    };

  } catch (error) {
    console.error('Error en exportPDFColored:', error);
    return { 
      success: false, 
      error: error.message,
      message: 'Error al generar el PDF con colores corporativos'
    };
  }
}