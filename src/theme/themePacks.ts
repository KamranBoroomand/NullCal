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
  },
  {
    id: 'synthwave-84',
    name: 'Synthwave 84',
    description: 'Electric magentas and neon blues with retro outrun glow.',
    preview: ['#ff7edb', '#00d9ff', '#f9f871'],
    mode: 'dark',
    family: 'synthwave'
  },
  {
    id: 'oceanic-next',
    name: 'Oceanic Next',
    description: 'Deep ocean blues with teal highlights and warm amber.',
    preview: ['#6699cc', '#5fb3b3', '#fac863'],
    mode: 'dark',
    family: 'oceanic'
  },
  {
    id: 'panda',
    name: 'Panda',
    description: 'High-contrast charcoal with minty greens and peach accents.',
    preview: ['#19f9d8', '#ff75b5', '#ffb86c'],
    mode: 'dark',
    family: 'panda'
  },
  {
    id: 'horizon',
    name: 'Horizon',
    description: 'Warm horizon hues with soft violets and coral accents.',
    preview: ['#efaf8e', '#e58d7d', '#b877db'],
    mode: 'dark',
    family: 'horizon'
  },
  {
    id: 'tokyo-night-storm',
    name: 'Tokyo Night Storm',
    description: 'Tokyo Night Storm palette with deep indigos and electric accents.',
    preview: ['#7aa2f7', '#bb9af7', '#9ece6a'],
    mode: 'dark',
    family: 'tokyo-night'
  },
  {
    id: 'tokyo-night-day',
    name: 'Tokyo Night Day',
    description: 'Tokyo Night Day palette with crisp light neutrals and cool accents.',
    preview: ['#3760bf', '#9854f1', '#587539'],
    mode: 'light',
    family: 'tokyo-night'
  },
  {
    id: 'rose-pine-moon',
    name: 'Rose Pine Moon',
    description: 'Rose Pine Moon palette with lavender glow and soft contrast.',
    preview: ['#c4a7e7', '#ea9a97', '#9ccfd8'],
    mode: 'dark',
    family: 'rose-pine'
  },
  {
    id: 'rose-pine-dawn',
    name: 'Rose Pine Dawn',
    description: 'Rose Pine Dawn palette with warm dawn neutrals and dusty accents.',
    preview: ['#907aa9', '#d7827e', '#56949f'],
    mode: 'light',
    family: 'rose-pine'
  },
  {
    id: 'gruvbox-material',
    name: 'Gruvbox Material',
    description: 'Gruvbox Material palette with textured warmth and balanced contrast.',
    preview: ['#a9b665', '#d3869b', '#e78a4e'],
    mode: 'dark',
    family: 'gruvbox-material'
  },
  {
    id: 'one-light',
    name: 'One Light',
    description: 'One Light palette with crisp neutrals and bright accents.',
    preview: ['#4078f2', '#a626a4', '#50a14f'],
    mode: 'light',
    family: 'one-dark'
  },
  {
    id: 'material-ocean',
    name: 'Material Ocean',
    description: 'Material Ocean palette with deep blues and vivid aqua highlights.',
    preview: ['#84ffff', '#82aaff', '#c3e88d'],
    mode: 'dark',
    family: 'material'
  },
  {
    id: 'github-dark-dimmed',
    name: 'GitHub Dark Dimmed',
    description: 'GitHub Dark Dimmed palette with softer contrast and clean blues.',
    preview: ['#539bf5', '#57ab5a', '#8b949e'],
    mode: 'dark',
    family: 'github'
  },
  {
    id: 'nord-light',
    name: 'Nord Light',
    description: 'Nord Light palette with icy pastels and cool neutral contrast.',
    preview: ['#5e81ac', '#88c0d0', '#a3be8c'],
    mode: 'light',
    family: 'nord'
  },
  {
    id: 'night-owl-light',
    name: 'Night Owl Light',
    description: 'Night Owl Light palette with bright whites and bold accents.',
    preview: ['#4876d6', '#e85d7a', '#2aa298'],
    mode: 'light',
    family: 'night-owl'
  },
  {
    id: 'nightfox',
    name: 'Nightfox',
    description: 'Moody midnight palette with bright cyan and lime highlights.',
    preview: ['#a1cd5e', '#63cdcf', '#82aaff'],
    mode: 'dark',
    family: 'nightfox'
  },
  {
    id: 'dayfox',
    name: 'Dayfox',
    description: 'Light fox palette with crisp neutrals and warm highlights.',
    preview: ['#d7827e', '#286983', '#56949f'],
    mode: 'light',
    family: 'nightfox'
  },
  {
    id: 'papercolor-light',
    name: 'PaperColor Light',
    description: 'PaperColor light with soft warm neutrals and gentle accents.',
    preview: ['#5f8700', '#d75f00', '#0087af'],
    mode: 'light',
    family: 'papercolor'
  },
  {
    id: 'tomorrow-night',
    name: 'Tomorrow Night',
    description: 'Tomorrow Night palette with calm blues and bright accents.',
    preview: ['#81a2be', '#b294bb', '#f0c674'],
    mode: 'dark',
    family: 'tomorrow'
  },
  {
    id: 'iceberg',
    name: 'Iceberg',
    description: 'Icy blues with crisp highlights and deep navy panels.',
    preview: ['#84a0c6', '#89b8c2', '#e2a478'],
    mode: 'dark',
    family: 'iceberg'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Bold cyberpunk contrast with hot pink and neon green.',
    preview: ['#ff2a6d', '#05d9e8', '#d1f7ff'],
    mode: 'dark',
    family: 'cyberpunk'
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
