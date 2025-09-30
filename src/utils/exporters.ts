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

    // Generar HTML estilizado según la segunda captura (diseño violeta/azul)
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ordénate · Reporte Financiero</title>
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
          background: #f6f7f9;
          padding: 24px;
        }
        
        /* Header con logo y título */
        .header {
          text-align: center;
          margin-bottom: 32px;
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          color: white;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }
        
        .header .logo {
          font-size: 32px;
          margin-bottom: 8px;
        }
        
        .header h1 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 16px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header-info {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 16px;
          font-weight: 500;
          opacity: 0.95;
        }
        
        .header-info span {
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 24px;
          backdrop-filter: blur(10px);
        }
        
        /* Bloque Resumen Ejecutivo con degradado violeta */
        .executive-summary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
          color: white;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }
        
        .executive-summary h2 {
          text-align: center;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 24px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        
        .summary-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(15px);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .summary-card .icon {
          font-size: 28px;
          margin-bottom: 12px;
          display: block;
        }
        
        .summary-card h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          opacity: 0.9;
        }
        
        .summary-card .amount {
          font-size: 32px;
          font-weight: 800;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .balance-positive {
          color: #00e676 !important;
        }
        
        .balance-negative {
          color: #ff5252 !important;
        }
        
        /* Tabla con cabecera azul degradado */
        .table-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          margin-bottom: 32px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          color: white;
          padding: 20px 16px;
          text-align: left;
          font-weight: 700;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: none;
        }
        
        td {
          padding: 18px 16px;
          border-bottom: 1px solid #f1f3f4;
          font-size: 15px;
          vertical-align: middle;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        tbody tr:nth-child(even) {
          background-color: #f8fafc;
        }
        
        tbody tr:hover {
          background-color: #e1f5fe;
          transition: background-color 0.2s ease;
        }
        
        /* Estilos para tipos */
        .tipo-pill {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
        }
        
        .tipo-pago {
          background: #ffebee;
          color: #c62828;
        }
        
        .tipo-cobro {
          background: #e8f5e8;
          color: #2e7d32;
        }
        
        /* Estilos para montos */
        .monto-pago {
          color: #e74c3c;
          font-weight: 700;
          font-size: 16px;
        }
        
        .monto-cobro {
          color: #27ae60;
          font-weight: 700;
          font-size: 16px;
        }
        
        /* Badges de estado con colores específicos */
        .estado-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }
        
        .estado-pendiente {
          background: #fff3cd;
          color: #856404;
        }
        
        .estado-urgente {
          background: #f8d7da;
          color: #721c24;
        }
        
        .estado-pagado {
          background: #d4edda;
          color: #155724;
        }
        
        .fecha-col {
          font-weight: 600;
          color: #495057;
        }
        
        .nota-col {
          color: #6c757d;
          font-style: italic;
          max-width: 200px;
          word-wrap: break-word;
        }
        
        /* Footer */
        .footer {
          text-align: center;
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 600;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .footer .app-name {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 4px;
        }
        
        .footer .tagline {
          opacity: 0.9;
          font-size: 14px;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          body {
            padding: 16px;
          }
          
          .header h1 {
            font-size: 28px;
          }
          
          .summary-cards {
            grid-template-columns: 1fr;
          }
          
          .summary-card .amount {
            font-size: 28px;
          }
          
          th, td {
            padding: 12px 8px;
            font-size: 14px;
          }
        }
      </style>
    </head>
    <body>
      <!-- Header con logo y título -->
      <div class="header">
        <div class="logo">🏢</div>
        <h1>Ordénate · Reporte Financiero</h1>
        <div class="header-info">
          <span>📅 ${meta?.fechaTitulo || fechaActual}</span>
          <span>⏰ ${meta?.fechaHora || horaActual}</span>
          <span>🧾 ${movements.length} movimiento${movements.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      
      <!-- Bloque Resumen Ejecutivo con degradado violeta -->
      <div class="executive-summary">
        <h2>📈 Resumen Ejecutivo</h2>
        <div class="summary-cards">
          <div class="summary-card">
            <span class="icon">💚</span>
            <h3>Cobros Totales</h3>
            <div class="amount">${formatMonto(totalCobros)}</div>
          </div>
          <div class="summary-card">
            <span class="icon">🪙</span>
            <h3>Pagos Totales</h3>
            <div class="amount">${formatMonto(totalPagos)}</div>
          </div>
          <div class="summary-card">
            <span class="icon">⚖️</span>
            <h3>Balance Neto</h3>
            <div class="amount ${balance >= 0 ? 'balance-positive' : 'balance-negative'}">
              ${balance >= 0 ? '+' : ''}${formatMonto(Math.abs(balance))}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tabla con cabecera azul degradado -->
      <div class="table-container">
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
            ${movements.map(movement => {
              const signo = movement.tipo === 'cobro' ? '+' : '-';
              const estadoClass = `estado-${movement.estado.toLowerCase()}`;
              return `
                <tr>
                  <td class="fecha-col">${sanitizeHTML(formatDate(movement.fechaISO))}</td>
                  <td>
                    <span class="tipo-pill tipo-${movement.tipo}">
                      ${movement.tipo === 'pago' ? 'Pago' : 'Cobro'}
                    </span>
                  </td>
                  <td class="monto-${movement.tipo}">
                    ${signo}${sanitizeHTML(formatMonto(movement.monto))}
                  </td>
                  <td>
                    <span class="estado-badge ${estadoClass}">
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
      
      <!-- Footer -->
      <div class="footer">
        <div class="app-name">Generado por Ordénate App</div>
        <div class="tagline">Tu asistente financiero personal</div>
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