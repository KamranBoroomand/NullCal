import type { ThemeMode } from './ThemeProvider';

export type ThemePack = {
  id: string;
  name: string;
  description: string;
  preview: string[];
  mode: ThemeMode;
  family: string;
};

export const THEME_PACKS: ThemePack[] = [
  {
    id: 'nullcal-neon',
    name: 'NullCal Neon',
    description: 'Signature neon palette with electric accents and deep graphite panels.',
    preview: ['#f4ff00', '#9bff00', '#00f6ff'],
    mode: 'dark',
    family: 'nullcal'
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    description: 'Velvety mocha tones with soft pastels and cool lavender highlights.',
    preview: ['#f5c2e7', '#89b4fa', '#a6e3a1'],
    mode: 'dark',
    family: 'catppuccin'
  },
  {
    id: 'catppuccin-macchiato',
    name: 'Catppuccin Macchiato',
    description: 'A rich, modern Catppuccin blend with balanced contrast.',
    preview: ['#f5bde6', '#8aadf4', '#a6da95'],
    mode: 'dark',
    family: 'catppuccin'
  },
  {
    id: 'catppuccin-frappe',
    name: 'Catppuccin Frappe',
    description: 'Smooth frappe layers with cool blues and muted berry accents.',
    preview: ['#f4b8e4', '#8caaee', '#a6d189'],
    mode: 'dark',
    family: 'catppuccin'
  },
  {
    id: 'catppuccin-latte',
    name: 'Catppuccin Latte',
    description: 'Light, creamy Catppuccin palette with warm accent highlights.',
    preview: ['#dc8a78', '#1e66f5', '#40a02b'],
    mode: 'light',
    family: 'catppuccin'
  },
  {
    id: 'nord',
    name: 'Nord',
    description: 'Cool arctic blues with balanced icy neutrals.',
    preview: ['#88c0d0', '#81a1c1', '#a3be8c'],
    mode: 'dark',
    family: 'nord'
  },
  {
    id: 'dracula',
    name: 'Dracula',
    description: 'Bold purple-led contrast with vibrant pink accents.',
    preview: ['#bd93f9', '#ff79c6', '#8be9fd'],
    mode: 'dark',
    family: 'dracula'
  },
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    description: 'Warm retro palette with golden accents and deep browns.',
    preview: ['#fabd2f', '#fe8019', '#b8bb26'],
    mode: 'dark',
    family: 'gruvbox'
  },
  {
    id: 'gruvbox-light',
    name: 'Gruvbox Light',
    description: 'Soft parchment tones with warm, earthy highlights.',
    preview: ['#d79921', '#b57614', '#98971a'],
    mode: 'light',
    family: 'gruvbox'
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    description: 'Classic Solarized contrast with balanced cyan and amber.',
    preview: ['#b58900', '#268bd2', '#2aa198'],
    mode: 'dark',
    family: 'solarized'
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    description: 'Light Solarized palette with warm neutrals and calm blues.',
    preview: ['#b58900', '#268bd2', '#2aa198'],
    mode: 'light',
    family: 'solarized'
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    description: 'Midnight indigos with electric violet accents.',
    preview: ['#7aa2f7', '#bb9af7', '#9ece6a'],
    mode: 'dark',
    family: 'tokyo-night'
  },
  {
    id: 'one-dark',
    name: 'One Dark Pro',
    description: 'VS Code-inspired One Dark Pro palette with crisp blues and violets.',
    preview: ['#61afef', '#c678dd', '#98c379'],
    mode: 'dark',
    family: 'one-dark'
  },
  {
    id: 'monokai',
    name: 'Monokai',
    description: 'Classic Monokai neon with punchy magenta accents.',
    preview: ['#a6e22e', '#f92672', '#66d9ef'],
    mode: 'dark',
    family: 'monokai'
  },
  {
    id: 'everforest',
    name: 'Everforest',
    description: 'Forest-inspired greens with calm, muted saturation.',
    preview: ['#a7c080', '#7fbbb3', '#e67e80'],
    mode: 'dark',
    family: 'everforest'
  },
  {
    id: 'rose-pine',
    name: 'Rose Pine',
    description: 'Dusty rose tones with soft lavender accents.',
    preview: ['#ebbcba', '#c4a7e7', '#9ccfd8'],
    mode: 'dark',
    family: 'rose-pine'
  },
  {
    id: 'material-palenight',
    name: 'Material Palenight',
    description: 'Material Palenight palette with bright purple and teal accents.',
    preview: ['#c792ea', '#82aaff', '#c3e88d'],
    mode: 'dark',
    family: 'material'
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    description: 'GitHub’s dark UI palette with crisp blues and moss accents.',
    preview: ['#58a6ff', '#56d364', '#8b949e'],
    mode: 'dark',
    family: 'github'
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    description: 'GitHub’s light UI palette with clean neutrals and bright accents.',
    preview: ['#0969da', '#1f883d', '#57606a'],
    mode: 'light',
    family: 'github'
  },
  {
    id: 'ayu-dark',
    name: 'Ayu Dark',
    description: 'Ayu dark palette with warm amber highlights.',
    preview: ['#ffb454', '#59c2ff', '#ff8f40'],
    mode: 'dark',
    family: 'ayu'
  },
  {
    id: 'ayu-light',
    name: 'Ayu Light',
    description: 'Ayu light palette with gentle warm accents.',
    preview: ['#ff8f40', '#399ee6', '#86b300'],
    mode: 'light',
    family: 'ayu'
  },
  {
    id: 'kanagawa-wave',
    name: 'Kanagawa Wave',
    description: 'Kanagawa Wave palette with deep ink blues. Dark-only.',
    preview: ['#7e9cd8', '#98bb6c', '#ffa066'],
    mode: 'dark',
    family: 'kanagawa'
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Night Owl palette with luminous blues. Dark-only.',
    preview: ['#82aaff', '#c792ea', '#7fdbca'],
    mode: 'dark',
    family: 'night-owl'
  },
  {
    id: 'cobalt2',
    name: 'Cobalt2',
    description: 'Cobalt2 deep blues with sunny accents. Dark-only.',
    preview: ['#ffc600', '#ff9d00', '#9dd6ff'],
    mode: 'dark',
    family: 'cobalt2'
  },
  {
    id: 'vscode-dark-plus',
    name: 'VSCode Dark+',
    description: 'VS Code Dark+ palette with balanced contrast. Dark-only.',
    preview: ['#569cd6', '#c586c0', '#4ec9b0'],
    mode: 'dark',
    family: 'vscode'
  },
  {
    id: 'arc-dark',
    name: 'Arc Dark',
    description: 'Arc-inspired dark palette with cool neon accents. Dark-only.',
    preview: ['#5cc8ff', '#8b7bff', '#36d399'],
    mode: 'dark',
    family: 'arc'
  },
  {
    id: 'zenburn',
    name: 'Zenburn',
    description: 'Zenburn earth tones with muted contrast. Dark-only.',
    preview: ['#7f9f7f', '#f0dfaf', '#cc9393'],
    mode: 'dark',
    family: 'zenburn'
  }
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
