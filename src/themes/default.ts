export interface ThemeColors {
  background: string
  floor: string
  primary: string
  secondary: string
  text: string
  uiBackground: string
  uiText: string
  uiBorder: string
}

export const defaultTheme: ThemeColors = {
  background: '#050510',
  floor: '#0a0a18',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  text: '#ffffff',
  uiBackground: 'rgba(10, 10, 24, 0.85)',
  uiText: '#ffffff',
  uiBorder: 'rgba(255, 255, 255, 0.15)',
}
