/**
 * Theme Presets for Swan Glide Visualizer.
 *
 * Defines visual theme configurations including background gradients,
 * typography colors, 6-voice ribbon palettes, playhead glows,
 * and keyboard key styling.
 */

export type ThemePresetId = 'pastel' | 'dark' | 'sunset' | 'lofi' | 'cream';

/**
 * Visual styling configuration for a theme preset.
 */
export interface ThemePreset {
  /** Unique theme identifier. */
  id: ThemePresetId;
  /** Human-readable display name. */
  name: string;
  /** Short aesthetic description. */
  description: string;
  /** True when theme uses dark backgrounds requiring light text. */
  isDark: boolean;
  /** CSS linear-gradient string for Canvas or background-image styles. */
  backgroundGradientCss: string;
  /** Tailwind background gradient classes for the main card container. */
  backgroundClass: string;
  /** Primary typography color. */
  textColor: string;
  /** Secondary or muted typography color. */
  textMutedColor: string;
  /** Accent or accidental typography color. */
  accentColor: string;
  /** Grid line color for pitch semitones and fretboard wires. */
  gridLineColor: string;
  /** Vertical bar line color on the spline canvas. */
  barLineColor: string;
  /** 6-color voice palette ordered from Bass (lowest) to Soprano (highest). */
  voicePalette: readonly [string, string, string, string, string, string];
  /** Playhead vertical line stroke color. */
  playheadColor: string;
  /** Playhead halo glow color. */
  playheadGlowColor: string;
  /** Playhead shadow blur in pixels. */
  playheadGlowBlur: number;
  /** Natural piano key background fill. */
  keyboardWhiteKeyFill: string;
  /** Natural piano key border stroke. */
  keyboardWhiteKeyStroke: string;
  /** Sharp and flat piano key background fill. */
  keyboardBlackKeyFill: string;
  /** Sharp and flat piano key border stroke. */
  keyboardBlackKeyStroke: string;
  /** Border CSS classes for the portrait container card. */
  containerBorderClass: string;
  /** Shadow CSS classes for the portrait container card. */
  containerShadowClass: string;
}

/**
 * The 5 curated theme presets for Swan Glide.
 */
export const THEME_PRESETS: Record<ThemePresetId, ThemePreset> = {
  pastel: {
    id: 'pastel',
    name: 'Swan Pastel',
    description: 'The classic Swan Glide pink and rose gradient with rich purple and magenta voices.',
    isDark: false,
    backgroundGradientCss: 'linear-gradient(to bottom, #fad4e6, #f7cfe3, #fad6e8)',
    backgroundClass: 'bg-gradient-to-b from-[#fad4e6] via-[#f7cfe3] to-[#fad6e8] text-[#2E104D]',
    textColor: '#2E104D',
    textMutedColor: 'rgba(46, 16, 77, 0.55)',
    accentColor: '#D946EF',
    gridLineColor: 'rgba(46, 16, 77, 0.04)',
    barLineColor: 'rgba(46, 16, 77, 0.18)',
    voicePalette: [
      '#4A154B', // Bass: deep purple
      '#3B82F6', // Tenor 1: blue
      '#06B6D4', // Tenor 2: cyan
      '#D946EF', // Alto: magenta
      '#F43F5E', // Mezzo: coral
      '#A855F7', // Soprano: lavender
    ],
    playheadColor: '#2E104D',
    playheadGlowColor: '#D946EF',
    playheadGlowBlur: 8,
    keyboardWhiteKeyFill: '#FFFFFF',
    keyboardWhiteKeyStroke: 'rgba(46, 16, 77, 0.15)',
    keyboardBlackKeyFill: '#2E104D',
    keyboardBlackKeyStroke: '#1A0830',
    containerBorderClass: 'sm:border sm:border-white/50',
    containerShadowClass: 'shadow-purple-950/25',
  },

  dark: {
    id: 'dark',
    name: 'Neon Midnight',
    description: 'Deep midnight black background with neon glow palette.',
    isDark: true,
    backgroundGradientCss: 'linear-gradient(to bottom, #1c0808, #120404, #0a0202)',
    backgroundClass: 'bg-gradient-to-b from-[#1c0808] via-[#120404] to-[#0a0202] text-white',
    textColor: '#FFFFFF',
    textMutedColor: 'rgba(255, 255, 255, 0.55)',
    accentColor: '#FDE047',
    gridLineColor: 'rgba(255, 255, 255, 0.04)',
    barLineColor: 'rgba(255, 255, 255, 0.16)',
    voicePalette: [
      '#EF4444', // Bass: red
      '#F97316', // Tenor 1: orange
      '#FBBF24', // Tenor 2: amber
      '#FDE047', // Alto: gold
      '#FEF08A', // Mezzo: light yellow
      '#FFFFFF', // Soprano: bright white glow
    ],
    playheadColor: '#FFFFFF',
    playheadGlowColor: '#F97316',
    playheadGlowBlur: 16,
    keyboardWhiteKeyFill: '#27272A',
    keyboardWhiteKeyStroke: '#3F3F46',
    keyboardBlackKeyFill: '#09090B',
    keyboardBlackKeyStroke: '#000000',
    containerBorderClass: 'sm:border sm:border-zinc-800',
    containerShadowClass: 'shadow-black/80',
  },

  sunset: {
    id: 'sunset',
    name: 'Warm Sunset',
    description: 'Warm violet to amber peach gradient with golden glowing ribbons.',
    isDark: true,
    backgroundGradientCss: 'linear-gradient(to bottom, #2B1038, #5A1E4A, #99334D)',
    backgroundClass: 'bg-gradient-to-b from-[#2B1038] via-[#5A1E4A] to-[#99334D] text-[#FFF4EC]',
    textColor: '#FFF4EC',
    textMutedColor: 'rgba(255, 244, 236, 0.65)',
    accentColor: '#F4A261',
    gridLineColor: 'rgba(255, 244, 236, 0.05)',
    barLineColor: 'rgba(255, 244, 236, 0.20)',
    voicePalette: [
      '#7209B7', // Bass: violet
      '#4361EE', // Tenor 1: cobalt
      '#F72585', // Tenor 2: hot rose
      '#F77F00', // Alto: amber orange
      '#FCBF49', // Mezzo: golden yellow
      '#FFF3B0', // Soprano: warm ivory glow
    ],
    playheadColor: '#FFF4EC',
    playheadGlowColor: '#F77F00',
    playheadGlowBlur: 14,
    keyboardWhiteKeyFill: '#FAF0E6',
    keyboardWhiteKeyStroke: 'rgba(90, 30, 74, 0.3)',
    keyboardBlackKeyFill: '#2B1038',
    keyboardBlackKeyStroke: '#180820',
    containerBorderClass: 'sm:border sm:border-amber-400/20',
    containerShadowClass: 'shadow-amber-950/40',
  },

  lofi: {
    id: 'lofi',
    name: 'Lofi Slate',
    description: 'Deep slate and indigo background with muted pastel ribbons.',
    isDark: true,
    backgroundGradientCss: 'linear-gradient(to bottom, #1E1E2E, #181825, #11111B)',
    backgroundClass: 'bg-gradient-to-b from-[#1E1E2E] via-[#181825] to-[#11111B] text-[#CDD6F4]',
    textColor: '#CDD6F4',
    textMutedColor: 'rgba(205, 214, 244, 0.60)',
    accentColor: '#89B4FA',
    gridLineColor: 'rgba(205, 214, 244, 0.04)',
    barLineColor: 'rgba(205, 214, 244, 0.16)',
    voicePalette: [
      '#89B4FA', // Bass: periwinkle
      '#74C7EC', // Tenor 1: sky blue
      '#94E2D5', // Tenor 2: mint
      '#A6E3A1', // Alto: soft green
      '#F9E2AF', // Mezzo: soft peach
      '#FAB387', // Soprano: muted melon
    ],
    playheadColor: '#CDD6F4',
    playheadGlowColor: '#89B4FA',
    playheadGlowBlur: 10,
    keyboardWhiteKeyFill: '#313244',
    keyboardWhiteKeyStroke: '#45475A',
    keyboardBlackKeyFill: '#181825',
    keyboardBlackKeyStroke: '#11111B',
    containerBorderClass: 'sm:border sm:border-indigo-900/40',
    containerShadowClass: 'shadow-indigo-950/50',
  },

  cream: {
    id: 'cream',
    name: 'Warm Paper',
    description: 'Warm paper and parchment background with dark charcoal and plum ribbons.',
    isDark: false,
    backgroundGradientCss: 'linear-gradient(to bottom, #F7F3E9, #EFE8D8, #E5DCC9)',
    backgroundClass: 'bg-gradient-to-b from-[#F7F3E9] via-[#EFE8D8] to-[#E5DCC9] text-[#2C2523]',
    textColor: '#2C2523',
    textMutedColor: 'rgba(44, 37, 35, 0.58)',
    accentColor: '#8C3B52',
    gridLineColor: 'rgba(44, 37, 35, 0.05)',
    barLineColor: 'rgba(44, 37, 35, 0.18)',
    voicePalette: [
      '#2D3142', // Bass: deep charcoal
      '#4F5D75', // Tenor 1: steel slate
      '#8C3B52', // Tenor 2: plum crimson
      '#B85D19', // Alto: terracotta
      '#4E6E58', // Mezzo: sage green
      '#6B4C82', // Soprano: muted mulberry
    ],
    playheadColor: '#2C2523',
    playheadGlowColor: '#8C3B52',
    playheadGlowBlur: 8,
    keyboardWhiteKeyFill: '#FFFFFF',
    keyboardWhiteKeyStroke: '#D8CFBF',
    keyboardBlackKeyFill: '#2C2523',
    keyboardBlackKeyStroke: '#1B1615',
    containerBorderClass: 'sm:border sm:border-amber-900/10',
    containerShadowClass: 'shadow-stone-900/15',
  },
};

/**
 * Array of all theme preset objects for selector menus.
 */
export const THEME_PRESETS_LIST: ThemePreset[] = Object.values(THEME_PRESETS);

/**
 * Resolves a ThemePreset by identifier with fallback to pastel.
 */
export function getThemePreset(id?: string): ThemePreset {
  if (id && id in THEME_PRESETS) {
    return THEME_PRESETS[id as ThemePresetId];
  }
  return THEME_PRESETS.pastel;
}
