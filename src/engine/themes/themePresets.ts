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
    name: 'UltraViolet Pastel',
    description: 'The iconic UltraViolet Chorus pastel aesthetic with rich ultraviolet, deep plum, and glowing magenta accents.',
    isDark: false,
    backgroundGradientCss: 'linear-gradient(180deg, #FDEBF4 0%, #F8D8EC 45%, #FDE4F2 100%)',
    backgroundClass: 'bg-gradient-to-b from-[#FDEBF4] via-[#F8D8EC] to-[#FDE4F2] text-[#240A34]',
    textColor: '#240A34',
    textMutedColor: 'rgba(36, 10, 52, 0.60)',
    accentColor: '#9333EA',
    gridLineColor: 'rgba(36, 10, 52, 0.05)',
    barLineColor: 'rgba(36, 10, 52, 0.16)',
    voicePalette: [
      '#3B0764', // Bass: deep obsidian purple
      '#2563EB', // Tenor 1: royal sapphire
      '#0284C7', // Tenor 2: electric azure
      '#7C3AED', // Alto: vivid ultraviolet
      '#C026D3', // Mezzo: rich fuchsia
      '#E11D48', // Soprano: crisp crimson rose
    ],
    playheadColor: '#240A34',
    playheadGlowColor: '#9333EA',
    playheadGlowBlur: 10,
    keyboardWhiteKeyFill: '#FFFFFF',
    keyboardWhiteKeyStroke: 'rgba(36, 10, 52, 0.16)',
    keyboardBlackKeyFill: '#240A34',
    keyboardBlackKeyStroke: '#170522',
    containerBorderClass: 'sm:border sm:border-purple-300/40',
    containerShadowClass: 'shadow-purple-950/25',
  },

  dark: {
    id: 'dark',
    name: 'Neon UltraViolet',
    description: 'Midnight obsidian background with electric ultraviolet and neon glow.',
    isDark: true,
    backgroundGradientCss: 'linear-gradient(180deg, #090611 0%, #120A21 50%, #06040B 100%)',
    backgroundClass: 'bg-gradient-to-b from-[#090611] via-[#120A21] to-[#06040B] text-white',
    textColor: '#FFFFFF',
    textMutedColor: 'rgba(255, 255, 255, 0.65)',
    accentColor: '#C084FC',
    gridLineColor: 'rgba(255, 255, 255, 0.05)',
    barLineColor: 'rgba(255, 255, 255, 0.18)',
    voicePalette: [
      '#818CF8', // Bass: neon periwinkle
      '#38BDF8', // Tenor 1: neon cyan
      '#34D399', // Tenor 2: electric emerald
      '#F472B6', // Alto: electric rose
      '#FB923C', // Mezzo: neon amber
      '#FDE047', // Soprano: brilliant solar gold
    ],
    playheadColor: '#FFFFFF',
    playheadGlowColor: '#A855F7',
    playheadGlowBlur: 16,
    keyboardWhiteKeyFill: '#1E172E',
    keyboardWhiteKeyStroke: '#382B54',
    keyboardBlackKeyFill: '#090512',
    keyboardBlackKeyStroke: '#000000',
    containerBorderClass: 'sm:border sm:border-purple-500/25',
    containerShadowClass: 'shadow-purple-950/70',
  },

  sunset: {
    id: 'sunset',
    name: 'Velvet Sunset',
    description: 'Warm violet to amber dusk gradient with radiant glowing ribbons.',
    isDark: true,
    backgroundGradientCss: 'linear-gradient(180deg, #240B2D 0%, #4D123A 50%, #7B1E38 100%)',
    backgroundClass: 'bg-gradient-to-b from-[#240B2D] via-[#4D123A] to-[#7B1E38] text-[#FFF6F0]',
    textColor: '#FFF6F0',
    textMutedColor: 'rgba(255, 246, 240, 0.70)',
    accentColor: '#F59E0B',
    gridLineColor: 'rgba(255, 246, 240, 0.05)',
    barLineColor: 'rgba(255, 246, 240, 0.20)',
    voicePalette: [
      '#6D28D9', // Bass: royal violet
      '#3B82F6', // Tenor 1: deep sky
      '#EC4899', // Tenor 2: warm magenta
      '#F97316', // Alto: sunset orange
      '#FBBF24', // Mezzo: radiant gold
      '#FEF08A', // Soprano: warm ivory
    ],
    playheadColor: '#FFF6F0',
    playheadGlowColor: '#F97316',
    playheadGlowBlur: 14,
    keyboardWhiteKeyFill: '#FAF0E6',
    keyboardWhiteKeyStroke: 'rgba(90, 30, 74, 0.3)',
    keyboardBlackKeyFill: '#240B2D',
    keyboardBlackKeyStroke: '#14051B',
    containerBorderClass: 'sm:border sm:border-amber-400/20',
    containerShadowClass: 'shadow-amber-950/40',
  },

  lofi: {
    id: 'lofi',
    name: 'Tokyo Lofi',
    description: 'Deep slate and indigo background with muted retro anime ribbons.',
    isDark: true,
    backgroundGradientCss: 'linear-gradient(180deg, #181926 0%, #131420 50%, #0D0E17 100%)',
    backgroundClass: 'bg-gradient-to-b from-[#181926] via-[#131420] to-[#0D0E17] text-[#CAD3F5]',
    textColor: '#CAD3F5',
    textMutedColor: 'rgba(202, 211, 245, 0.65)',
    accentColor: '#8AADF4',
    gridLineColor: 'rgba(202, 211, 245, 0.04)',
    barLineColor: 'rgba(202, 211, 245, 0.16)',
    voicePalette: [
      '#8AADF4', // Bass: periwinkle
      '#7DC4E4', // Tenor 1: sky
      '#8BD5CA', // Tenor 2: sage teal
      '#A6DA95', // Alto: mint matcha
      '#EED49F', // Mezzo: warm caramel
      '#F5A97F', // Soprano: pastel peach
    ],
    playheadColor: '#CAD3F5',
    playheadGlowColor: '#8AADF4',
    playheadGlowBlur: 10,
    keyboardWhiteKeyFill: '#24273A',
    keyboardWhiteKeyStroke: '#363A4F',
    keyboardBlackKeyFill: '#141522',
    keyboardBlackKeyStroke: '#0D0E17',
    containerBorderClass: 'sm:border sm:border-indigo-900/40',
    containerShadowClass: 'shadow-indigo-950/50',
  },

  cream: {
    id: 'cream',
    name: 'Studio Paper',
    description: 'Warm paper and parchment background with dark charcoal and plum ribbons.',
    isDark: false,
    backgroundGradientCss: 'linear-gradient(180deg, #FAF7F2 0%, #F2ECE1 50%, #E8DFD0 100%)',
    backgroundClass: 'bg-gradient-to-b from-[#FAF7F2] via-[#F2ECE1] to-[#E8DFD0] text-[#1E1917]',
    textColor: '#1E1917',
    textMutedColor: 'rgba(30, 25, 23, 0.62)',
    accentColor: '#862A45',
    gridLineColor: 'rgba(30, 25, 23, 0.05)',
    barLineColor: 'rgba(30, 25, 23, 0.18)',
    voicePalette: [
      '#27272A', // Bass: carbon ink
      '#3B4252', // Tenor 1: deep slate
      '#862A45', // Tenor 2: plum velvet
      '#A15528', // Alto: warm terra
      '#3F5E4D', // Mezzo: forest pine
      '#5E3D6E', // Soprano: royal amethyst
    ],
    playheadColor: '#1E1917',
    playheadGlowColor: '#862A45',
    playheadGlowBlur: 8,
    keyboardWhiteKeyFill: '#FFFFFF',
    keyboardWhiteKeyStroke: '#D8CFBF',
    keyboardBlackKeyFill: '#1E1917',
    keyboardBlackKeyStroke: '#120E0D',
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
