
export const THEMES = {
  study: {
    id: 'study',
    name: 'Study',
    colors: {
      background: 'from-slate-900 via-blue-950 to-slate-900',
      accent: 'text-blue-200',
      glass: 'bg-blue-950/20',
      border: 'border-blue-500/20',
    },
    audio: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&controls=0&loop=1&playlist=jfKfPfyJRdk', // Lofi Girl
    ambience: 'rain',
  },
  sleep: {
    id: 'sleep',
    name: 'Sleep',
    colors: {
      background: 'from-indigo-950 via-purple-950 to-indigo-950',
      accent: 'text-purple-200',
      glass: 'bg-purple-950/20',
      border: 'border-purple-500/20',
    },
    audio: 'https://www.youtube.com/embed/rUxyKA_-grg?autoplay=1&mute=1&controls=0&loop=1&playlist=rUxyKA_-grg', // Sleep Lofi
    ambience: 'night',
  },
  relax: {
    id: 'relax',
    name: 'Relax',
    colors: {
      background: 'from-stone-900 via-orange-950/40 to-stone-900',
      accent: 'text-orange-200',
      glass: 'bg-orange-950/20',
      border: 'border-orange-500/20',
    },
    audio: 'https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1&mute=1&controls=0&loop=1&playlist=5qap5aO4i9A', // Chill Lofi
    ambience: 'cafe',
  },
} as const;

export type ThemeMode = keyof typeof THEMES;
export type ThemeConfig = typeof THEMES[ThemeMode];
