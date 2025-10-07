// src/utils/fs.ts
// Helper estable para sistema de archivos - interfaz unificada
// Implementación: expo-file-system legacy (listo para migrar a nueva API cuando convenga)
import * as FS from 'expo-file-system/legacy';

const ROOT_DIR = `${FS.documentDirectory}ordenate`;

/**
 * Asegurar que el directorio existe (crear si no existe)
 */
async function ensureDir(dir = ROOT_DIR) {
  const info = await FS.getInfoAsync(dir);
  if (!info.exists) {
    await FS.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

/**
 * Generar timestamp único para nombres de archivo
 * Formato: YYYY-MM-DD-HH-mm-ss
 */
function stamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

/**
 * Guarda CSV como UTF-8 con BOM (agrega .csv si falta)
 * @param name - Nombre del archivo (con o sin extensión)
 * @param csv - Contenido CSV como string
 * @returns Objeto con uri y mime type
 */
export async function saveCSV(name: string, csv: string) {
  const dir = await ensureDir();
  const fileName = name.endsWith('.csv') ? name : `${name}.csv`;
  const uri = `${dir}/${fileName}`;
  
  // BOM para compatibilidad con Excel (UTF-8)
  const body = '\uFEFF' + csv;
  await FS.writeAsStringAsync(uri, body, { encoding: 'utf8' });
  
  console.log('📄 CSV guardado:', uri);
  return { uri, mime: 'text/csv' as const };
}

/**
 * Guarda PDF desde Base64 (agrega .pdf si falta)
 * @param name - Nombre del archivo (con o sin extensión)
 * @param base64 - Contenido PDF en Base64
 * @returns Objeto con uri y mime type
 */
export async function savePDF(name: string, base64: string) {
  const dir = await ensureDir();
  const fileName = name.endsWith('.pdf') ? name : `${name}.pdf`;
  const uri = `${dir}/${fileName}`;
  
  await FS.writeAsStringAsync(uri, base64, { encoding: 'base64' });
  
  console.log('📄 PDF guardado:', uri);
  return { uri, mime: 'application/pdf' as const };
}

/**
 * Mueve archivo temporal a destino final con nombre único
 * @param tempUri - URI del archivo temporal
 * @param name - Nombre del archivo final
 * @returns Objeto con uri final
 */
export async function movePDF(tempUri: string, name: string) {
  const dir = await ensureDir();
  const fileName = name.endsWith('.pdf') ? name : `${name}.pdf`;
  const finalUri = `${dir}/${fileName}`;
  
  await FS.moveAsync({
    from: tempUri,
    to: finalUri
  });
  
  console.log('📄 PDF movido:', finalUri);
  return { uri: finalUri, mime: 'application/pdf' as const };
}

/**
 * Genera nombres únicos con timestamp para CSV
 * @param prefix - Prefijo del nombre (ej: 'historial', 'movimientos')
 * @returns Nombre único con timestamp
 */
export function csvName(prefix = 'historial') {
  return `${prefix}_${stamp()}.csv`;
}

/**
 * Genera nombres únicos con timestamp para PDF
 * @param prefix - Prefijo del nombre (ej: 'resumen', 'reporte')
 * @returns Nombre único con timestamp
 */
export function pdfName(prefix = 'resumen') {
  return `${prefix}_${stamp()}.pdf`;
}

/**
 * Obtiene información de archivo (size, exists, etc.)
 * @param uri - URI del archivo
 * @returns Info del archivo
 */
export async function getFileInfo(uri: string) {
  return FS.getInfoAsync(uri);
}

/**
 * Descarga archivo a cache/ordenate-cache (sobrescribe si existe)
 * @param url - URL del archivo a descargar
 * @param name - Nombre opcional del archivo
 * @returns Objeto con uri del archivo descargado
 */
export async function downloadToCache(url: string, name?: string) {
  const dir = `${FS.cacheDirectory}ordenate-cache`;
  await ensureDir(dir);
  
  const fileName = name ?? url.split('/').pop() ?? `descarga_${stamp()}`;
  const uri = `${dir}/${fileName}`;
  
  // Eliminar archivo existente para sobreescribir
  try { 
    await FS.deleteAsync(uri, { idempotent: true }); 
  } catch {}
  
  const res = await FS.downloadAsync(url, uri);
  console.log('⬇️ Descarga completada:', res.uri);
  return { uri: res.uri };
}

/**
 * Test rápido end-to-end del sistema de archivos
 * Verifica creación de directorio, escritura, lectura y metadatos
 */
export async function testFileSystem() {
  try {
    console.log('🧪 Iniciando test del sistema de archivos...');
    
    const dir = await ensureDir();
    console.log('  ✓ Directorio creado/verificado:', dir);
    
    const testUri = `${dir}/test_${stamp()}.txt`;
    const testContent = 'Hola Ordénate! 🚀';
    
    await FS.writeAsStringAsync(testUri, testContent, { encoding: 'utf8' });
    console.log('  ✓ Archivo escrito:', testUri);
    
    const text = await FS.readAsStringAsync(testUri);
    console.log('  ✓ Archivo leído:', text);
    
    const info = await FS.getInfoAsync(testUri);
    console.log('  ✓ Info del archivo:', { 
      size: info.exists ? (info as any).size || 'N/A' : 0, 
      exists: info.exists 
    });
    
    // Limpiar archivo de prueba
    await FS.deleteAsync(testUri, { idempotent: true });
    console.log('  ✓ Archivo de prueba eliminado');
    
    const success = text === testContent && info.exists;
    console.log(`🧪 Test FileSystem: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    
    return success;
  } catch (error) {
    console.error('❌ Test FileSystem falló:', error);
    return false;
  }
}