// darkTheme exported for use in App.vue dark mode switching
export { darkTheme } from 'naive-ui';

// Define the primary color for the entire application
export const primaryColor: string = '#389826'; // Logo green
export const primaryColorHover: string = '#4AA830'; // Slightly lighter on hover
export const primaryColorPressed: string = '#2D7A1E'; // Darker when pressed
export const primaryColorSuppl: string = '#4AA830'; // Supplementary color

// Additional accent colors for different UI elements
export const accentColor: string = '#389826'; // Same as primary color
export const accentColorLight: string = '#4AA830'; // Same as primary hover
export const accentColorDark: string = '#2D7A1E'; // Same as primary pressed

// Export themeOverrides for use with n-config-provider
export const themeOverrides = {
  common: {
    primaryColor,
    primaryColorHover,
    primaryColorPressed,
    primaryColorSuppl,
    infoColor: '#0076A8', // MATLAB-style blue
    infoColorHover: '#0088C0',
    infoColorPressed: '#005A80',
    successColor: accentColor,
    successColorHover: accentColorLight,
    successColorPressed: accentColorDark,
    warningColor: '#F39C12',
    warningColorHover: '#F5AB35',
    warningColorPressed: '#D68910',
    errorColor: '#cb3c33',
    errorColorHover: '#D84E45',
    errorColorPressed: '#B32A21',
  },
  Button: {
    colorPrimary: primaryColor,
    colorPrimaryHover: primaryColorHover,
    colorPrimaryPressed: primaryColorPressed,
    colorPrimarySuppl: primaryColorSuppl,
    colorInfo: '#0076A8',
    colorInfoHover: '#0088C0',
    colorInfoPressed: '#005A80',
    colorSuccess: accentColor,
    colorSuccessHover: accentColorLight,
    colorSuccessPressed: accentColorDark,
    colorWarning: '#F39C12',
    colorWarningHover: '#F5AB35',
    colorWarningPressed: '#D68910',
    colorError: '#cb3c33',
    colorErrorHover: '#D84E45',
    colorErrorPressed: '#B32A21',
    textColorPrimary: '#fff',
    textColorHoverPrimary: '#fff',
    textColorPressedPrimary: '#fff',
    textColorFocusPrimary: '#fff',
    textColorDisabled: '#c0c0c0',
    border: `1px solid ${primaryColor}`,
    borderHover: `1px solid ${primaryColorHover}`,
    borderPressed: `1px solid ${primaryColorPressed}`,
    borderFocus: `1px solid ${primaryColor}`,
    borderDisabled: '1px solid #d0d0d0',
    rippleColor: primaryColor,
  },
};

// Utility functions for consistent color usage
export function getPrimaryColorWithOpacity(opacity: number = 0.1): string {
  const [r, g, b] = hexToRgb(primaryColor);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function getAccentColorWithOpacity(opacity: number = 0.1): string {
  const [r, g, b] = hexToRgb(accentColor);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace('#', '');
  const r: number = parseInt(hex.substring(0, 2), 16);
  const g: number = parseInt(hex.substring(2, 4), 16);
  const b: number = parseInt(hex.substring(4, 6), 16);
  return [r, g, b];
}
