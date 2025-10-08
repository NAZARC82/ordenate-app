// Paleta tomada de tu SettingsScreen (y normalizada)
export const COLORS = {
  // App / UI
  appBg: '#FCFCF8',
  cardBg: '#FFFFFF',
  iconBg: '#F0F7F6',
  infoBg: '#F8F9FA',
  border: '#EAECEE',

  // Texto
  textPrimary: '#4D3527',
  textMuted:   '#666666',
  textSubtle:  '#999999',
  white:       '#FFFFFF',
  black:       '#000000',

  // Marca (botones, acentos, iconos)
  brandPrimary: '#3E7D75',
  primary: '#3E7D75', // Alias para brandPrimary

  // Estructura anidada para compatibilidad con theme.ts
  background: {
    primary: '#FCFCF8',
    secondary: '#F8F9FA',
  },

  text: {
    primary: '#4D3527',
    secondary: '#666666',
  },

  // COLORES CORPORATIVOS - Identidad de marca
  azul: '#50616D',
  violeta: '#6A5ACD',
  violetaClaro: '#E8E5FF',

  // Export (PDF) – gradientes fijos que pediste para reporte
  violetStart: '#6A5ACD', // Usando violeta corporativo
  violetEnd:   '#764BA2',
  blueStart:   '#50616D',  // Usando azul corporativo
  blueEnd:     '#2980B9',

  // Export colors para PDF
  export: {
    violetStart: '#6A5ACD', // Violeta corporativo
    violetEnd:   '#764BA2',
    blueStart:   '#50616D',  // Azul corporativo
    blueEnd:     '#2980B9',
    positive: '#27AE60', // cobro (+)
    negative: '#E74C3C', // pago (−)
    urgent: '#E74C3C',   // urgente
    pending: '#F1C40F',  // pendiente
    paid: '#27AE60',     // pagado
    badgeText: '#FFFFFF', // texto de badges
  },

  // Estados / montos
  success: '#27AE60', // cobro (+)
  danger:  '#E74C3C', // pago (−)
  warning: '#F1C40F', // pendiente
};

export default COLORS;