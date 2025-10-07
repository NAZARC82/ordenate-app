import COLORS from '../theme/colors.js';

export const pdfTheme = {
  colors: {
    // Base
    background: COLORS.appBg,
    backgroundSecondary: COLORS.infoBg,
    cardBg: COLORS.cardBg,
    text: COLORS.textPrimary,
    textSecondary: COLORS.textMuted,
    white: COLORS.white,
    black: COLORS.black,
    divider: '#E0E0E0',
    rowAlt: '#FAFAFA',

    // Acento (para títulos/bordes en PDF)
    accent: COLORS.brandPrimary,

    // Gradientes para reportes estilizados
    gradientViolet: `linear-gradient(135deg, ${COLORS.violetStart}, ${COLORS.violetEnd})`,
    gradientBlue: `linear-gradient(135deg, ${COLORS.blueStart}, ${COLORS.blueEnd})`,

    // Montos (colores claramente visibles)
    amount: {
      positive: '#27AE60', // Verde claro para cobros
      negative: '#E74C3C', // Rojo claro para pagos
    },

    // Badges de estado (colores contrastantes y visibles)
    badge: {
      urgent: { 
        background: '#E74C3C', // Rojo urgente
        text: '#FFFFFF' 
      },
      pending: { 
        background: '#F39C12', // Naranja visible (no amarillo)
        text: '#FFFFFF' 
      },
      completed: { 
        background: '#27AE60', // Verde claro
        text: '#FFFFFF' 
      },
    },
  },

  // Estilos PDF específicos
  styles: {
    radius: { sm: 4, md: 8, lg: 12 },
    shadow: { soft: '0 2px 6px rgba(0,0,0,0.10)' },
    font: { base: 12, small: 11, h1: 22, cardValue: 18 },
    spacing: { xs: 6, sm: 8, md: 12, lg: 16, xl: 24 },
  },
  
  // Helper para obtener color de monto según valor
  getAmountColor: (value) => {
    if (typeof value !== 'number') return '#666666';
    return value >= 0 ? '#27AE60' : '#E74C3C';
  },
    
  // Helper para obtener estilo de badge con fallbacks seguros
  getBadgeStyle: (status) => {
    const statusLower = (status || '').toLowerCase();
    
    switch(statusLower) {
      case 'urgente':
      case 'urgent':
        return { background: '#E74C3C', text: '#FFFFFF' };
      case 'pendiente':
      case 'pending':
        return { background: '#F39C12', text: '#FFFFFF' };
      case 'pagado':
      case 'completado':
      case 'completed':
        return { background: '#27AE60', text: '#FFFFFF' };
      default:
        return { background: '#95A5A6', text: '#FFFFFF' }; // Gris neutral
    }
  },
};

export default pdfTheme;