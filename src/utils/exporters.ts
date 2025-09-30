// src/utils/exporters.ts
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Alert } from 'react-native';

export interface ExportableMovement {
  id: string;
  tipo: 'pago' | 'cobro';
  monto: number;
  nota?: string;
  fechaISO: string;
  estado: string;
}

// Función para sanitizar texto para CSV
const sanitizeCSV = (text: string | undefined): string => {
  if (!text) return '';
  return text.toString().replace(/,/g, ';').replace(/\n/g, ' ').replace(/\r/g, '');
};

// Función para sanitizar texto para HTML
const sanitizeHTML = (text: string | undefined): string => {
  if (!text) return '';
  return text.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// Función para formatear fecha en español uruguayo
const formatDate = (fechaISO: string): string => {
  try {
    return new Date(fechaISO).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Error formateando fecha:', fechaISO, error);
    return 'Fecha inválida';
  }
};

// Función para formatear monto
const formatMonto = (monto: number): string => {
  try {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0
    }).format(monto);
  } catch (error) {
    return `$${monto}`;
  }
};

export const exportCSV = async (movements: ExportableMovement[], filename: string): Promise<void> => {
  try {
    console.log(`[Exporters] Iniciando exportación CSV: ${filename}`);
    
    // Generar contenido CSV con formato mejorado
    const headers = ['Fecha', 'Tipo', 'Monto', 'Estado', 'Nota'];
    
    // Línea de comentario opcional (compatible con Excel/Google Sheets)
    const fechaActual = new Date().toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const comentario = `# Ordénate | ${fechaActual} | ${movements.length} movimientos`;
    
    const csvContent = [
      comentario,
      headers.join(','),
      ...movements.map(movement => {
        // Formatear monto con signo según tipo
        const signo = movement.tipo === 'cobro' ? '+' : '-';
        const montoFormateado = `${signo}${movement.monto}`;
        
        return [
          sanitizeCSV(formatDate(movement.fechaISO)),
          sanitizeCSV(movement.tipo.toUpperCase()),
          sanitizeCSV(montoFormateado),
          sanitizeCSV(movement.estado.toUpperCase()),
          sanitizeCSV(movement.nota || '')
        ].join(',');
      })
    ].join('\n');

    // Guardar archivo en cache
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8
    });

    console.log(`[Exporters] CSV guardado en: ${fileUri}`);

    // Verificar que Sharing esté disponible
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Error', 'Compartir no está disponible en este dispositivo');
      return;
    }

    // Compartir archivo
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar movimientos CSV'
    });

    console.log(`[Exporters] CSV compartido exitosamente`);
  } catch (error) {
    console.error(`[Exporters] Error exportando CSV:`, error);
    Alert.alert('Error', 'No se pudo exportar el archivo CSV');
  }
};

export const exportPDF = async (movements: ExportableMovement[], filename: string): Promise<void> => {
  try {
    console.log(`[Exporters] Iniciando exportación PDF: ${filename}`);
    
    // Generar HTML para el PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Movimientos - Ordenate</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 20px;
          color: #333;
        }
        h1 {
          color: #3E7D75;
          text-align: center;
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px 8px;
          text-align: left;
        }
        th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #4D3527;
        }
        tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        .monto {
          text-align: right;
          font-weight: 600;
        }
        .fecha {
          text-align: center;
        }
        .estado {
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .tipo {
          font-weight: 600;
        }
        .pago {
          color: #e74c3c;
        }
        .cobro {
          color: #27ae60;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <h1>Movimientos - Ordenate</h1>
      <p>Exportado el: ${formatDate(new Date().toISOString())} • Total: ${movements.length} movimiento${movements.length !== 1 ? 's' : ''}</p>
      
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Monto</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          ${movements.map(movement => `
            <tr>
              <td class="tipo ${movement.tipo}">${sanitizeHTML(movement.tipo)}</td>
              <td class="monto">${sanitizeHTML(formatMonto(movement.monto))}</td>
              <td class="fecha">${sanitizeHTML(formatDate(movement.fechaISO))}</td>
              <td class="estado">${sanitizeHTML(movement.estado)}</td>
              <td>${sanitizeHTML(movement.nota || '-')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        Generado por Ordenate
      </div>
    </body>
    </html>
    `;

    // Generar PDF
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });

    // Mover a cache con nombre amigable
    const finalUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.moveAsync({
      from: uri,
      to: finalUri
    });

    console.log(`[Exporters] PDF guardado en: ${finalUri}`);

    // Verificar que Sharing esté disponible
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Error', 'Compartir no está disponible en este dispositivo');
      return;
    }

    // Compartir archivo
    await Sharing.shareAsync(finalUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar movimientos PDF'
    });

    console.log(`[Exporters] PDF compartido exitosamente`);
  } catch (error) {
    console.error(`[Exporters] Error exportando PDF:`, error);
    Alert.alert('Error', 'No se pudo exportar el archivo PDF');
  }
};

interface ExportMeta {
  fechaTitulo?: string;
  fechaHora?: string;
  rango?: string;
}

// Función para obtener color del estado
const getEstadoBadgeStyle = (estado: string) => {
  const estadoUpper = estado.toUpperCase();
  switch (estadoUpper) {
    case 'URGENTE':
      return { bg: '#FDECEC', color: '#C0392B' };
    case 'PENDIENTE':
      return { bg: '#FFF6DE', color: '#B9770E' };
    case 'PAGADO':
      return { bg: '#EAF7EE', color: '#1E8449' };
    default:
      return { bg: '#F5F5F5', color: '#666' };
  }
};

export const exportPDFStyled = async (
  movements: ExportableMovement[], 
  filename: string, 
  meta?: ExportMeta
): Promise<void> => {
  try {
    console.log(`[Exporters] Iniciando exportación PDF estilizado: ${filename}`);
    
    // Calcular totales
    const totalCobros = movements
      .filter(m => m.tipo === 'cobro')
      .reduce((sum, m) => sum + m.monto, 0);
    
    const totalPagos = movements
      .filter(m => m.tipo === 'pago')
      .reduce((sum, m) => sum + m.monto, 0);
    
    const balance = totalCobros - totalPagos;
    
    // Fecha y hora actual
    const ahora = new Date();
    const fechaActual = ahora.toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const horaActual = ahora.toLocaleTimeString('es-UY', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Generar HTML estilizado
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ordénate • Reporte Financiero</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #2c3e50;
          background: #f8f9fa;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #2A7D76 0%, #1e5f5a 100%);
          border-radius: 12px;
          color: white;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 15px;
        }
        
        .chips {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .chip {
          background: rgba(255, 255, 255, 0.2);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          backdrop-filter: blur(10px);
        }
        
        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .card {
          padding: 24px;
          border-radius: 12px;
          color: white;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .card-cobros {
          background: linear-gradient(135deg, #27AE60 0%, #229954 100%);
        }
        
        .card-pagos {
          background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%);
        }
        
        .card-balance {
          background: linear-gradient(135deg, ${balance >= 0 ? '#27AE60 0%, #229954' : '#E74C3C 0%, #C0392B'} 100%);
        }
        
        .card h3 {
          font-size: 16px;
          margin-bottom: 8px;
          opacity: 0.9;
          font-weight: 500;
        }
        
        .card .amount {
          font-size: 28px;
          font-weight: 700;
        }
        
        .table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th {
          background: #f8f9fa;
          padding: 16px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
          color: #2c3e50;
          border-bottom: 2px solid #e9ecef;
        }
        
        td {
          padding: 16px 12px;
          border-bottom: 1px solid #f1f3f4;
          font-size: 14px;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        tr:hover {
          background-color: #f8f9fa;
        }
        
        .tipo-pill {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .tipo-pago {
          background: #FDEDEC;
          color: #E74C3C;
        }
        
        .tipo-cobro {
          background: #EAF7EE;
          color: #27AE60;
        }
        
        .monto-pago {
          color: #E74C3C;
          font-weight: 600;
        }
        
        .monto-cobro {
          color: #27AE60;
          font-weight: 600;
        }
        
        .estado-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .fecha-col {
          font-weight: 500;
          color: #495057;
        }
        
        .nota-col {
          color: #6c757d;
          font-style: italic;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Ordénate • Reporte Financiero</h1>
        <div class="chips">
          <div class="chip">📅 ${meta?.fechaTitulo || fechaActual}</div>
          <div class="chip">⏰ ${meta?.fechaHora || horaActual}</div>
          ${meta?.rango ? `<div class="chip">🗂 ${meta.rango}</div>` : ''}
          <div class="chip">🧾 ${movements.length} movimiento${movements.length !== 1 ? 's' : ''}</div>
        </div>
      </div>
      
      <div class="cards">
        <div class="card card-cobros">
          <h3>Cobros Totales</h3>
          <div class="amount">${formatMonto(totalCobros)}</div>
        </div>
        <div class="card card-pagos">
          <h3>Pagos Totales</h3>
          <div class="amount">${formatMonto(totalPagos)}</div>
        </div>
        <div class="card card-balance">
          <h3>Balance Neto</h3>
          <div class="amount">${balance >= 0 ? '+' : ''}${formatMonto(balance)}</div>
        </div>
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            ${movements.map(movement => {
              const estadoStyle = getEstadoBadgeStyle(movement.estado);
              const signo = movement.tipo === 'cobro' ? '+' : '-';
              return `
                <tr>
                  <td class="fecha-col">${sanitizeHTML(formatDate(movement.fechaISO))}</td>
                  <td>
                    <span class="tipo-pill tipo-${movement.tipo}">
                      ${sanitizeHTML(movement.tipo)}
                    </span>
                  </td>
                  <td class="monto-${movement.tipo}">
                    ${signo}${sanitizeHTML(formatMonto(movement.monto))}
                  </td>
                  <td>
                    <span class="estado-badge" style="background-color: ${estadoStyle.bg}; color: ${estadoStyle.color};">
                      ${sanitizeHTML(movement.estado)}
                    </span>
                  </td>
                  <td class="nota-col">${sanitizeHTML(movement.nota || '-')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        Generado por Ordénate el ${fechaActual} a las ${horaActual}
      </div>
    </body>
    </html>
    `;

    // Generar PDF
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });

    // Mover a cache con nombre amigable
    const finalUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.moveAsync({
      from: uri,
      to: finalUri
    });

    console.log(`[Exporters] PDF estilizado guardado en: ${finalUri}`);

    // Verificar que Sharing esté disponible
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Error', 'Compartir no está disponible en este dispositivo');
      return;
    }

    // Compartir archivo
    await Sharing.shareAsync(finalUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar reporte PDF'
    });

    console.log(`[Exporters] PDF estilizado compartido exitosamente`);
  } catch (error) {
    console.error(`[Exporters] Error exportando PDF estilizado:`, error);
    Alert.alert('Error', 'No se pudo exportar el archivo PDF');
  }
};