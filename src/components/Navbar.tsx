
'use client';

import React from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { THEMES, ThemeMode } from '@/lib/constants';

export default function Navbar() {
    const { mode, setMode, theme } = useTheme();

    return (
        <div className="fixed top-0 left-0 w-full z-40 p-6 flex justify-between items-center pointer-events-none">
            <div className="pointer-events-auto">
                <h1 className={`text-2xl font-bold tracking-tighter ${theme.colors.accent} drop-shadow-lg`}>
                    Lucid LoFi
                </h1>
            </div>

            <div className="pointer-events-auto flex items-center gap-2 bg-black/20 backdrop-blur-md p-1 rounded-full border border-white/5">
                {(Object.keys(THEMES) as ThemeMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300
              ${mode === m
                                ? 'bg-white/10 text-white shadow-lg'
                                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                            }`}
                    >
                        {THEMES[m].name}
                    </button>
                ))}
            </div>
        </div>
    );
}
