// src/utils/testFs.js
// Script de prueba para las funciones del nuevo sistema de archivos

import { testFileSystem, saveCSV, csvName, movePDF, pdfName, getFileInfo } from './fs';

export async function runFileSystemTests() {
  console.log('\n🧪 === INICIO TESTS FILESYSTEM ===');
  
  try {
    // Test 1: Test básico del sistema
    console.log('\n1️⃣ Test básico del sistema...');
    const basicTestPassed = await testFileSystem();
    
    // Test 2: Test guardar CSV
    console.log('\n2️⃣ Test guardar CSV...');
    const csvContent = 'Fecha,Tipo,Monto,Descripcion\n2024-01-01,Ingreso,1000,Test CSV de Ordénate';
    const csvFileName = csvName('test_export');
    const { uri: csvUri, mime: csvMime } = await saveCSV(csvFileName, csvContent);
    console.log('   📄 CSV guardado:', csvUri);
    console.log('   📄 MIME type:', csvMime);
    
    // Verificar tamaño del CSV
    const csvInfo = await getFileInfo(csvUri);
    console.log('   📄 Info CSV:', { exists: csvInfo.exists, size: csvInfo.size || 'N/A' });
    
    // Test 3: Test nombres únicos
    console.log('\n3️⃣ Test nombres únicos...');
    const pdf1 = pdfName('reporte');
    const pdf2 = pdfName('reporte');
    console.log('   📄 PDF nombre 1:', pdf1);
    console.log('   📄 PDF nombre 2:', pdf2);
    console.log('   ✅ Únicos:', pdf1 !== pdf2 ? 'SÍ' : 'NO');
    
    console.log('\n✅ === TODOS LOS TESTS COMPLETADOS ===');
    return {
      basicTest: basicTestPassed,
      csvUri: csvUri,
      csvMime: csvMime,
      csvExists: csvInfo.exists,
      uniqueNames: pdf1 !== pdf2,
      success: true,
    };
  } catch (error) {
    console.error('\n❌ === ERROR EN TESTS ===');
    console.error(error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Para testear desde la consola del navegador
if (typeof window !== 'undefined') {
  window.runFileSystemTests = runFileSystemTests;
}