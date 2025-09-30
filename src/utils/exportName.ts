// src/utils/exportName.ts

interface ExportNameParams {
  activeTab: 'todos' | 'pagos' | 'cobros';
  dateYMD?: string;                    // Formato YYYY-MM-DD para día específico
  rangeStartYMD?: string;              // Formato YYYY-MM-DD para inicio de rango
  rangeEndYMD?: string;                // Formato YYYY-MM-DD para fin de rango
  selectedCount?: number;              // Cantidad de items seleccionados
  ext: 'pdf' | 'csv';                  // Extensión del archivo
  base?: string;                       // Nombre base (default: 'Ordenate')
}

/**
 * Genera nombres de archivo contextuales para exportaciones
 * 
 * Formatos:
 * - Día específico: Ordenate_pagos_2025-09-29_1430.pdf
 * - Rango de fechas: Ordenate_cobros_2025-09-01_a_2025-09-30_1430.csv
 * - Con selección: Ordenate_todos_2025-09-29_1430_5sel.pdf
 * - Sin fecha específica: Ordenate_pagos_1430.csv
 */
export const buildExportName = (params: ExportNameParams): string => {
  const {
    activeTab,
    dateYMD,
    rangeStartYMD,
    rangeEndYMD,
    selectedCount,
    ext,
    base = 'Ordenate'
  } = params;

  // Obtener hora actual en formato HHmm
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeStamp = `${hours}${minutes}`;

  // Construir partes del nombre
  const parts: string[] = [sanitizeFileName(base)];

  // Agregar tab activo
  parts.push(activeTab);

  // Agregar información de fecha
  if (dateYMD) {
    // Día específico
    parts.push(dateYMD);
  } else if (rangeStartYMD && rangeEndYMD) {
    // Rango de fechas
    parts.push(`${rangeStartYMD}_a_${rangeEndYMD}`);
  }

  // Agregar timestamp
  parts.push(timeStamp);

  // Agregar información de selección si existe
  if (selectedCount && selectedCount > 0) {
    parts.push(`${selectedCount}sel`);
  }

  // Unir todas las partes con guión bajo y agregar extensión
  const fileName = `${parts.join('_')}.${ext}`;
  
  console.log(`[ExportName] Generado: ${fileName}`);
  return fileName;
};

/**
 * Sanitiza el nombre de archivo eliminando caracteres no válidos
 * Permite: letras, números, guiones y guiones bajos
 */
const sanitizeFileName = (name: string): string => {
  return name
    .replace(/[^a-zA-Z0-9_-]/g, '') // Solo permitir letras, números, _ y -
    .replace(/^-+|-+$/g, '')        // Eliminar guiones al inicio y final
    .substring(0, 50);              // Limitar longitud
};

/**
 * Convierte una fecha ISO a formato YYYY-MM-DD
 */
export const formatDateForFilename = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('Error formateando fecha para filename:', isoString, error);
    return 'fecha-invalida';
  }
};

/**
 * Convierte formato YYYY-MM-DD a dd/mm/aaaa (es-UY)
 * @param ymd - Fecha en formato YYYY-MM-DD
 * @returns Fecha en formato dd/mm/aaaa
 */
export const fmtYMD = (ymd: string): string => {
  const [year, month, day] = ymd.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Obtiene el rango de fechas de una lista de movimientos
 */
export const getMovementsDateRange = (movements: Array<{ fechaISO: string }>): {
  startYMD: string | null;
  endYMD: string | null;
} => {
  if (movements.length === 0) {
    return { startYMD: null, endYMD: null };
  }

  // Ordenar por fecha
  const sortedDates = movements
    .map(m => new Date(m.fechaISO))
    .sort((a, b) => a.getTime() - b.getTime());

  const startDate = sortedDates[0];
  const endDate = sortedDates[sortedDates.length - 1];

  return {
    startYMD: formatDateForFilename(startDate.toISOString()),
    endYMD: formatDateForFilename(endDate.toISOString())
  };
};

/**
 * Detecta si todos los movimientos son del mismo día
 */
export const isSingleDay = (movements: Array<{ fechaISO: string }>): boolean => {
  if (movements.length === 0) return false;
  
  const firstDateYMD = formatDateForFilename(movements[0].fechaISO);
  return movements.every(m => formatDateForFilename(m.fechaISO) === firstDateYMD);
};

interface SubtitleParams {
  activeTab: 'todos' | 'pagos' | 'cobros';
  dateYMD?: string;                    // Formato YYYY-MM-DD para día específico
  rangeStartYMD?: string;              // Formato YYYY-MM-DD para inicio de rango
  rangeEndYMD?: string;                // Formato YYYY-MM-DD para fin de rango
  resultCount: number;                 // Cantidad de resultados mostrados
  selectedCount?: number;              // Cantidad de items seleccionados
}

/**
 * Construye el subtítulo contextual para la pantalla de Historial
 * 
 * Formatos:
 * - Básico: "Todos los movimientos • 45 resultados"
 * - Con día: "Solo pagos • Día: 29/09/2025 • 12 resultados"
 * - Con rango: "Solo cobros • Rango: 01/09/2025 a 30/09/2025 • 28 resultados"
 * - Con selección: "Todos los movimientos • 45 resultados • 3 seleccionados"
 */
export const buildSubtitle = (params: SubtitleParams): string => {
  const {
    activeTab,
    dateYMD,
    rangeStartYMD,
    rangeEndYMD,
    resultCount,
    selectedCount
  } = params;

  const parts: string[] = [];

  // Scope por tab
  switch (activeTab) {
    case 'todos':
      parts.push('Todos los movimientos');
      break;
    case 'pagos':
      parts.push('Solo pagos');
      break;
    case 'cobros':
      parts.push('Solo cobros');
      break;
    default:
      parts.push('Historial');
      break;
  }

  // Información de fecha
  if (dateYMD) {
    parts.push(`Día: ${fmtYMD(dateYMD)}`);
  } else if (rangeStartYMD && rangeEndYMD) {
    parts.push(`Rango: ${fmtYMD(rangeStartYMD)} a ${fmtYMD(rangeEndYMD)}`);
  }

  // Cantidad de resultados
  parts.push(`${resultCount} resultado${resultCount !== 1 ? 's' : ''}`);

  // Cantidad seleccionados si hay
  if (selectedCount && selectedCount > 0) {
    parts.push(`${selectedCount} seleccionado${selectedCount !== 1 ? 's' : ''}`);
  }

  return parts.join(' • ');
};