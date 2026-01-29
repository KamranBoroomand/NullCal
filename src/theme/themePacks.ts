import type { ThemeMode } from './ThemeProvider';

export type ThemePack = {
  id: string;
  name: string;
  preview: string[];
  mode: ThemeMode;
  family: string;
};

export const THEME_PACKS: ThemePack[] = [
  { id: 'nullcal-neon', name: 'NullCal Neon', preview: ['#f4ff00', '#9bff00', '#00f6ff'], mode: 'dark', family: 'nullcal' },
  { id: 'catppuccin-mocha', name: 'Catppuccin Mocha', preview: ['#f5c2e7', '#89b4fa', '#a6e3a1'], mode: 'dark', family: 'catppuccin' },
  { id: 'catppuccin-macchiato', name: 'Catppuccin Macchiato', preview: ['#f5bde6', '#8aadf4', '#a6da95'], mode: 'dark', family: 'catppuccin' },
  { id: 'catppuccin-frappe', name: 'Catppuccin Frappe', preview: ['#f4b8e4', '#8caaee', '#a6d189'], mode: 'dark', family: 'catppuccin' },
  { id: 'catppuccin-latte', name: 'Catppuccin Latte', preview: ['#dc8a78', '#1e66f5', '#40a02b'], mode: 'light', family: 'catppuccin' },
  { id: 'nord', name: 'Nord', preview: ['#88c0d0', '#81a1c1', '#a3be8c'], mode: 'dark', family: 'nord' },
  { id: 'dracula', name: 'Dracula', preview: ['#bd93f9', '#ff79c6', '#8be9fd'], mode: 'dark', family: 'dracula' },
  { id: 'gruvbox-dark', name: 'Gruvbox Dark', preview: ['#fabd2f', '#fe8019', '#b8bb26'], mode: 'dark', family: 'gruvbox' },
  { id: 'gruvbox-light', name: 'Gruvbox Light', preview: ['#d79921', '#b57614', '#98971a'], mode: 'light', family: 'gruvbox' },
  { id: 'solarized-dark', name: 'Solarized Dark', preview: ['#b58900', '#268bd2', '#2aa198'], mode: 'dark', family: 'solarized' },
  { id: 'solarized-light', name: 'Solarized Light', preview: ['#b58900', '#268bd2', '#2aa198'], mode: 'light', family: 'solarized' },
  { id: 'tokyo-night', name: 'Tokyo Night', preview: ['#7aa2f7', '#bb9af7', '#9ece6a'], mode: 'dark', family: 'tokyo-night' },
  { id: 'one-dark', name: 'One Dark', preview: ['#61afef', '#c678dd', '#98c379'], mode: 'dark', family: 'one-dark' },
  { id: 'monokai', name: 'Monokai', preview: ['#a6e22e', '#f92672', '#66d9ef'], mode: 'dark', family: 'monokai' },
  { id: 'everforest', name: 'Everforest', preview: ['#a7c080', '#7fbbb3', '#e67e80'], mode: 'dark', family: 'everforest' },
  { id: 'rose-pine', name: 'Rose Pine', preview: ['#ebbcba', '#c4a7e7', '#9ccfd8'], mode: 'dark', family: 'rose-pine' },
  { id: 'material-palenight', name: 'Material Palenight', preview: ['#c792ea', '#82aaff', '#c3e88d'], mode: 'dark', family: 'material' }
];

export const DEFAULT_THEME_BY_MODE: Record<ThemeMode, string> = {
  dark: 'nullcal-neon',
  light: 'catppuccin-latte'
};

export const getThemePack = (id: string | null | undefined) =>
  THEME_PACKS.find((pack) => pack.id === id);

export const resolvePaletteForMode = (paletteId: string, mode: ThemeMode) => {
  const current = getThemePack(paletteId);
  if (current?.mode === mode) {
    return paletteId;
  }
  const sibling = current ? THEME_PACKS.find((pack) => pack.family === current.family && pack.mode === mode) : undefined;
  return sibling?.id ?? DEFAULT_THEME_BY_MODE[mode];
};

export const resolveThemeModeFromPalette = (paletteId: string, fallback: ThemeMode = 'dark') =>
  getThemePack(paletteId)?.mode ?? fallback;
