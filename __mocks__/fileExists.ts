/**
 * __mocks__/fileExists.ts
 * 
 * Mock de fileExists para tests
 */

export async function fileExists(uri: string): Promise<boolean> {
  // Por defecto, todos los archivos existen
  // Los tests individuales pueden sobrescribir este comportamiento
  return true;
}

export async function getFileInfo(uri: string) {
  return {
    exists: true,
    size: 1024,
    modificationTime: Date.now(),
    uri,
    isDirectory: false,
  };
}
