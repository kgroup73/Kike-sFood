/**
 * Temas de color de la app. Cada tema solo cambia los tokens de src/index.css
 * (`:root[data-tema="<id>"]`); tipografía, espaciado y distribución no cambian.
 * `swatch` es solo para la vista previa del selector: [fondo, superficie, acento, texto].
 */
export const THEMES = [
  { id: 'hoja', name: 'Mantel verde', group: 'Claros', note: 'El actual', swatch: ['#F6F7F3', '#FFFFFF', '#2F6B3F', '#1E2B24'] },
  { id: 'gris', name: 'Gris perla', group: 'Claros', note: 'Neutro, acento verde', swatch: ['#EEEFF1', '#FFFFFF', '#2F6B3F', '#1C2024'] },
  { id: 'arena', name: 'Arena y oliva', group: 'Mezclas', note: 'Cálido, tonos tierra', swatch: ['#F5F1E8', '#FFFDF8', '#5C6826', '#2B261D'] },
  { id: 'oceano', name: 'Bruma y mar', group: 'Mezclas', note: 'Azul grisáceo y turquesa', swatch: ['#EFF4F6', '#FFFFFF', '#0D6E7A', '#122630'] },
  { id: 'terracota', name: 'Crema y terracota', group: 'Mezclas', note: 'Crema con acento ladrillo', swatch: ['#F8F3EE', '#FFFFFF', '#AA4E30', '#34221C'] },
  { id: 'grafito', name: 'Grafito', group: 'Oscuros', note: 'Gris oscuro', swatch: ['#202225', '#2B2E32', '#76C48A', '#ECEEF0'] },
  { id: 'noche', name: 'Noche de sala', group: 'Oscuros', note: 'Casi negro, verde', swatch: ['#0D120F', '#161D19', '#78C48C', '#E6ECE6'] },
  { id: 'cafe', name: 'Café y oro', group: 'Oscuros', note: 'Marrón profundo y dorado', swatch: ['#14120C', '#1F1C14', '#CDA828', '#ECE6D2'] }
];

export const DEFAULT_THEME = 'hoja';
export const THEME_GROUPS = ['Claros', 'Mezclas', 'Oscuros'];
export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
