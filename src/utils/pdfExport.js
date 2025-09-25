// src/utils/pdfExport.js
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getDateString, getMonthString } from './date';

/**
 * Generar HTML estilizado para el reporte de movimientos
 * @param {Array} movimientos - Lista de movimientos
 * @param {string} mesAno - Mes y año en formato "YYYY-MM"
 * @returns {string} HTML completo del reporte
 */
function generarHTMLReporte(movimientos, mesAno) {
  // Formatear mes para mostrar
  const [ano, mes] = mesAno.split('-');
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const mesTexto = meses[parseInt(mes) - 1];

  // Filtrar movimientos del mes
  const movimientosMes = movimientos.filter(mov => 
    getMonthString(mov.fechaISO) === mesAno
  );

  // Calcular totales
  let totalPagos = 0;
  let totalCobros = 0;
  
  movimientosMes.forEach(mov => {
    if (mov.tipo === 'pago') {
      totalPagos += mov.monto || 0;
    } else if (mov.tipo === 'cobro') {
      totalCobros += mov.monto || 0;
    }
  });

  const balance = totalCobros - totalPagos;

  // Generar filas de la tabla
  const filasMovimientos = movimientosMes
    .sort((a, b) => new Date(b.fechaISO) - new Date(a.fechaISO))
    .map(mov => {
      const fecha = new Date(mov.fechaISO).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      const tipoTexto = mov.tipo === 'pago' ? 'Pago' : 'Cobro';
      const montoTexto = mov.tipo === 'pago' ? `-$${mov.monto}` : `+$${mov.monto}`;
      const estadoTexto = mov.estado || 'pendiente';
      const notaTexto = mov.nota || '-';

      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${fecha}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: ${mov.tipo === 'pago' ? '#c62828' : '#2e7d32'};">${tipoTexto}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold; color: ${mov.tipo === 'pago' ? '#c62828' : '#2e7d32'};">${montoTexto}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">
            <span style="background-color: ${getEstadoColorPDF(estadoTexto)}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase;">
              ${estadoTexto}
            </span>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; max-width: 150px; word-wrap: break-word;">${notaTexto}</td>
        </tr>
      `;
    }).join('');

  // Fila de mensaje si no hay movimientos
  const filaVacia = movimientosMes.length === 0 ? `
    <tr>
      <td colspan="5" style="padding: 20px; text-align: center; color: #666; font-style: italic;">
        No hay movimientos registrados para este mes
      </td>
    </tr>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reporte de Movimientos - ${mesTexto} ${ano}</title>
      <style>
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          margin: 20px;
          background-color: #f8f9fa;
          color: #333;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          background-color: #3E7D75;
          color: white;
          padding: 20px;
          border-radius: 8px;
        }
        
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        
        .header p {
          margin: 5px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        
        .resumen {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .resumen h2 {
          margin: 0 0 15px 0;
          color: #4D3527;
          font-size: 18px;
        }
        
        .resumen-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
          text-align: center;
        }
        
        .resumen-item {
          padding: 10px;
          border-radius: 6px;
        }
        
        .resumen-item.pagos {
          background-color: #ffebee;
          border-left: 4px solid #c62828;
        }
        
        .resumen-item.cobros {
          background-color: #e8f5e8;
          border-left: 4px solid #2e7d32;
        }
        
        .resumen-item.balance {
          background-color: #f3f4f6;
          border-left: 4px solid ${balance >= 0 ? '#2e7d32' : '#c62828'};
        }
        
        .resumen-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
          text-transform: uppercase;
          font-weight: 600;
        }
        
        .resumen-valor {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
        
        .tabla-container {
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        
        th {
          background-color: #f8f9fa;
          color: #4D3527;
          font-weight: 600;
          padding: 12px 8px;
          text-align: left;
          border-bottom: 2px solid #e0e0e0;
        }
        
        td {
          vertical-align: top;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        
        .generado {
          border-top: 1px solid #e0e0e0;
          padding-top: 15px;
          margin-top: 15px;
        }
        
        @media print {
          body { margin: 15px; }
          .header, .resumen, .tabla-container { 
            box-shadow: none; 
            border: 1px solid #ddd;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Reporte de Movimientos</h1>
        <p>${mesTexto} ${ano} - Ordénate App</p>
      </div>
      
      <div class="resumen">
        <h2>📈 Resumen del Mes</h2>
        <div class="resumen-grid">
          <div class="resumen-item pagos">
            <div class="resumen-label">Total Pagos</div>
            <div class="resumen-valor">-$${totalPagos.toFixed(2)}</div>
          </div>
          <div class="resumen-item cobros">
            <div class="resumen-label">Total Cobros</div>
            <div class="resumen-valor">+$${totalCobros.toFixed(2)}</div>
          </div>
          <div class="resumen-item balance">
            <div class="resumen-label">Balance</div>
            <div class="resumen-valor" style="color: ${balance >= 0 ? '#2e7d32' : '#c62828'};">
              ${balance >= 0 ? '+' : ''}$${balance.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
      
      <div class="tabla-container">
        <table>
          <thead>
            <tr>
              <th>📅 Fecha</th>
              <th>💰 Tipo</th>
              <th>💵 Monto</th>
              <th>📋 Estado</th>
              <th>📝 Nota</th>
            </tr>
          </thead>
          <tbody>
            ${filasMovimientos}
            ${filaVacia}
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <div class="generado">
          <strong>Total de movimientos:</strong> ${movimientosMes.length}
          <br>
          Generado el ${new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} por Ordénate App
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Obtener color de estado para PDF
 * @param {string} estado - Estado del movimiento
 * @returns {string} Color hex
 */
function getEstadoColorPDF(estado) {
  const colores = {
    urgente: '#FF4444',
    pronto: '#FFA500',
    pendiente: '#FFD700',
    pagado: '#4CAF50'
  };
  return colores[estado] || '#CCCCCC';
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
    
    // Generar HTML
    const htmlContent = generarHTMLReporte(movimientos, mesActual);
    
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
    
    // Generar nombre del archivo
    const [ano, mes] = mesActual.split('-');
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const mesTexto = meses[parseInt(mes) - 1];
    const nombreArchivo = `Ordenate_Movimientos_${mesTexto}_${ano}.pdf`;
    
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
    const htmlContent = generarHTMLReporte(movimientos, mesAno);
    
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });
    
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.warn('El compartir no está disponible en este dispositivo');
      return false;
    }
    
    const [ano, mes] = mesAno.split('-');
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const mesTexto = meses[parseInt(mes) - 1];
    const nombreArchivo = `Ordenate_Movimientos_${mesTexto}_${ano}.pdf`;
    
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