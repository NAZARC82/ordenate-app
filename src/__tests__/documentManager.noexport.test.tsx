/**
 * documentManager.noexport.test.tsx
 * 
 * Verifica que DocumentManagerScreen NO exporte documentos
 * Solo debe gestionar archivos existentes: abrir/compartir/borrar
 * @jest-environment node
 */

import { describe, it, expect, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const SCREEN_PATH = path.join(__dirname, '..', 'screens', 'DocumentManagerScreen.tsx');

describe('DocumentManagerScreen - NO Export Policy', () => {
  let screenContent: string;

  beforeAll(() => {
    screenContent = fs.readFileSync(SCREEN_PATH, 'utf-8');
  });

  describe('Guard-Rail Verification', () => {
    it('debe contener guard-rail log explicando que NO exporta', () => {
      // Buscar el guard-rail log
      const hasGuardRail = screenContent.includes('[DocumentManager] 📂 Pantalla de GESTIÓN (no export)');
      const hasActionsLog = screenContent.includes('abrir/compartir/borrar existentes');

      expect(hasGuardRail).toBe(true);
      expect(hasActionsLog).toBe(true);
    });

    it('debe tener guard-rail en useEffect al inicio del componente', () => {
      // Verificar que existe un useEffect con deps vacías que ejecuta el log
      const guardRailPattern = /useEffect\(\s*\(\)\s*=>\s*{[\s\S]*?\[DocumentManager\][\s\S]*?},\s*\[\]\s*\)/;
      expect(guardRailPattern.test(screenContent)).toBe(true);
    });
  });

  describe('Import Restrictions', () => {
    it('NO debe importar pdfExport', () => {
      const hasPdfExportImport = /import.*pdfExport.*from/.test(screenContent);
      expect(hasPdfExportImport).toBe(false);
    });

    it('NO debe importar csvExport', () => {
      const hasCsvExportImport = /import.*csvExport.*from/.test(screenContent);
      expect(hasCsvExportImport).toBe(false);
    });

    it('NO debe importar buildAndExport', () => {
      const hasBuildAndExportImport = /import.*buildAndExport.*from/.test(screenContent);
      expect(hasBuildAndExportImport).toBe(false);
    });

    it('SÍ debe importar openWith (para compartir archivos existentes)', () => {
      const hasOpenWithImport = /import.*openWith.*from/.test(screenContent);
      expect(hasOpenWithImport).toBe(true);
    });

    it('SÍ debe importar getExportMeta (para obtener mime type)', () => {
      const hasExportMetaImport = /import.*getExportMeta.*from/.test(screenContent);
      expect(hasExportMetaImport).toBe(true);
    });
  });

  describe('Function Call Restrictions', () => {
    it('NO debe llamar a pdfExport() en handleOpenWith', () => {
      // Extraer función handleOpenWith
      const handleOpenWithMatch = screenContent.match(
        /const handleOpenWith = async \(doc: RecentDoc\) => {[\s\S]*?^  };/m
      );
      
      if (handleOpenWithMatch) {
        const handleOpenWithCode = handleOpenWithMatch[0];
        const callsPdfExport = /pdfExport\s*\(/.test(handleOpenWithCode);
        expect(callsPdfExport).toBe(false);
      } else {
        // Si no encontramos la función, fallamos el test
        expect(handleOpenWithMatch).toBeTruthy();
      }
    });

    it('NO debe llamar a csvExport() en handleOpenWith', () => {
      const handleOpenWithMatch = screenContent.match(
        /const handleOpenWith = async \(doc: RecentDoc\) => {[\s\S]*?^  };/m
      );
      
      if (handleOpenWithMatch) {
        const handleOpenWithCode = handleOpenWithMatch[0];
        const callsCsvExport = /csvExport\s*\(/.test(handleOpenWithCode);
        expect(callsCsvExport).toBe(false);
      } else {
        expect(handleOpenWithMatch).toBeTruthy();
      }
    });

    it('NO debe llamar a buildAndExport() en handleOpenWith', () => {
      const handleOpenWithMatch = screenContent.match(
        /const handleOpenWith = async \(doc: RecentDoc\) => {[\s\S]*?^  };/m
      );
      
      if (handleOpenWithMatch) {
        const handleOpenWithCode = handleOpenWithMatch[0];
        const callsBuildAndExport = /buildAndExport\s*\(/.test(handleOpenWithCode);
        expect(callsBuildAndExport).toBe(false);
      } else {
        expect(handleOpenWithMatch).toBeTruthy();
      }
    });

    it('SÍ debe llamar a openWith() con doc.uri existente', () => {
      const handleOpenWithMatch = screenContent.match(
        /const handleOpenWith = async \(doc: RecentDoc\) => {[\s\S]*?^  };/m
      );
      
      if (handleOpenWithMatch) {
        const handleOpenWithCode = handleOpenWithMatch[0];
        // Debe llamar a openWith con doc.uri (archivo existente)
        const callsOpenWith = /openWith\s*\(\s*doc\.uri/.test(handleOpenWithCode);
        expect(callsOpenWith).toBe(true);
      } else {
        expect(handleOpenWithMatch).toBeTruthy();
      }
    });

    it('SÍ debe usar getExportMeta() para obtener mime type', () => {
      const handleOpenWithMatch = screenContent.match(
        /const handleOpenWith = async \(doc: RecentDoc\) => {[\s\S]*?^  };/m
      );
      
      if (handleOpenWithMatch) {
        const handleOpenWithCode = handleOpenWithMatch[0];
        const usesExportMeta = /getExportMeta\s*\(/.test(handleOpenWithCode);
        expect(usesExportMeta).toBe(true);
      } else {
        expect(handleOpenWithMatch).toBeTruthy();
      }
    });
  });

  describe('Architecture Compliance', () => {
    it('NO debe regenerar archivos en ninguna función', () => {
      // Buscar patrones que sugieran regeneración de archivos
      const hasFileGeneration = /FileSystem\.(writeAsStringAsync|downloadAsync|createFileAsync)/.test(screenContent);
      expect(hasFileGeneration).toBe(false);
    });

    it('debe comentar claramente que solo gestiona archivos existentes', () => {
      // Buscar comentario arquitectural
      const hasArchitectureComment = /Solo gestiona documentos ya existentes/.test(screenContent);
      expect(hasArchitectureComment).toBe(true);
    });
  });

  describe('Documentation & Comments', () => {
    it('debe tener comentario explicando que openWith usa archivo existente', () => {
      // Buscar comentario en handleOpenWith - en español o inglés
      const hasExistingFileComment = 
        screenContent.includes('Uses openWith() directly with existing file') ||
        screenContent.includes('usa openWith') ||
        screenContent.includes('archivo existente');
      expect(hasExistingFileComment).toBe(true);
    });

    it('debe tener logging que documenta la acción de compartir', () => {
      const hasOpenWithLog = screenContent.includes('[DocumentManager] handleOpenWith:');
      expect(hasOpenWithLog).toBe(true);
    });
  });
});
