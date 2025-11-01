// src/features/folders/types.ts
// FASE 6.4-CORE: Tipos extendidos para carpetas y auditoría

/**
 * Acciones auditables en carpetas
 */
export enum FolderAction {
  CREATE_FOLDER = 'CREATE_FOLDER',
  RENAME_FOLDER = 'RENAME_FOLDER',
  SET_FOLDER_COLOR = 'SET_FOLDER_COLOR',
  SET_FOLDER_ICON = 'SET_FOLDER_ICON',
  DELETE_FOLDER = 'DELETE_FOLDER',
  LINK_ITEM = 'LINK_ITEM',
  UNLINK_ITEM = 'UNLINK_ITEM',
  MOVE_ITEM = 'MOVE_ITEM',
  IMPORT_FILE = 'IMPORT_FILE',
  EXPORT_FOLDER = 'EXPORT_FOLDER',
}

/**
 * Tipo de entidad afectada por la acción
 */
export type TargetKind = 'folder' | 'movement' | 'reminder' | 'file';

/**
 * Metadatos extendidos de carpeta
 */
export interface FolderMetadata {
  color?: string; // Hex color (#RRGGBB)
  icon?: string; // Nombre del ícono
  updated_at: number; // Epoch timestamp
}

/**
 * Evento de auditoría de carpeta
 */
export interface FolderActivityEvent {
  id: string;
  folder_id: string;
  actor: string; // Usuario local (ej: "Usuario local")
  action: FolderAction;
  target_kind: TargetKind;
  target_id: string;
  meta: Record<string, any>; // Detalles del cambio (before/after, etc)
  created_at: number; // Epoch timestamp
}

/**
 * Paleta de colores predefinidos
 */
export const FOLDER_COLORS = [
  { hex: '#3E7D75', name: 'Verde Esmeralda' },
  { hex: '#6A5ACD', name: 'Violeta' },
  { hex: '#50616D', name: 'Gris Azulado' },
  { hex: '#C0392B', name: 'Rojo' },
  { hex: '#27AE60', name: 'Verde' },
  { hex: '#2980B9', name: 'Azul' },
  { hex: '#F39C12', name: 'Naranja' },
  { hex: '#8E44AD', name: 'Púrpura' },
  { hex: '#E74C3C', name: 'Rojo Claro' },
  { hex: '#1ABC9C', name: 'Turquesa' },
  { hex: '#34495E', name: 'Gris Oscuro' },
  { hex: '#F4B942', name: 'Amarillo' },
];

/**
 * Iconos predefinidos para carpetas
 */
export const FOLDER_ICONS = [
  { name: 'folder', label: 'Carpeta' },
  { name: 'folder-open', label: 'Carpeta Abierta' },
  { name: 'star', label: 'Estrella' },
  { name: 'document', label: 'Documento' },
  { name: 'checkmark-circle', label: 'Completado' },
  { name: 'time', label: 'Reloj' },
  { name: 'pricetag', label: 'Etiqueta' },
  { name: 'briefcase', label: 'Trabajo' },
  { name: 'home', label: 'Casa' },
  { name: 'card', label: 'Tarjeta' },
  { name: 'heart', label: 'Corazón' },
  { name: 'calculator', label: 'Calculadora' },
];

/**
 * Ícono por defecto
 */
export const DEFAULT_FOLDER_ICON = 'folder';

/**
 * Color por defecto
 */
export const DEFAULT_FOLDER_COLOR = '#50616D';

/**
 * Validador de color hex
 */
export function isValidHexColor(color: string): boolean {
  if (!color) return false;
  
  // Permitir con o sin #
  const hex = color.startsWith('#') ? color : `#${color}`;
  
  // Validar formato: #RGB o #RRGGBB
  const regex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
  return regex.test(hex);
}

/**
 * Normalizar color hex
 */
export function normalizeHexColor(color: string): string {
  if (!color) return DEFAULT_FOLDER_COLOR;
  
  let hex = color.trim().toUpperCase();
  
  // Agregar # si falta
  if (!hex.startsWith('#')) {
    hex = `#${hex}`;
  }
  
  // Expandir formato corto (#RGB → #RRGGBB)
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  
  // Validar
  if (!isValidHexColor(hex)) {
    return DEFAULT_FOLDER_COLOR;
  }
  
  return hex;
}

/**
 * Normalizar nombre de ícono
 */
export function normalizeIconName(icon: string): string {
  if (!icon) return DEFAULT_FOLDER_ICON;
  
  const normalized = icon.trim().toLowerCase();
  const exists = FOLDER_ICONS.some(i => i.name === normalized);
  
  return exists ? normalized : DEFAULT_FOLDER_ICON;
}

/**
 * Obtener color aleatorio agradable
 */
export function getRandomColor(): string {
  const randomIndex = Math.floor(Math.random() * FOLDER_COLORS.length);
  return FOLDER_COLORS[randomIndex].hex;
}
