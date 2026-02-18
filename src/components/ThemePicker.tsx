
'use client';

import React, { useState } from 'react';
import { Palette, X, Check } from 'lucide-react';
import { BG_THEMES, useBgTheme, BgTheme } from '@/providers/BgThemeProvider';

interface ThemePickerProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORIES = ['All', 'Dark', 'Ocean', 'Cosmic', 'Warm', 'Nature', 'Neon'];

export default function ThemePicker({ isOpen, onClose }: ThemePickerProps) {
    const { bgTheme, setBgTheme } = useBgTheme();
    const [activeCategory, setActiveCategory] = useState<string>('All');

    const filtered = activeCategory === 'All'
        ? BG_THEMES
        : BG_THEMES.filter(t => t.category === activeCategory);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <div
                onClick={e => e.stopPropagation()}
                className="relative w-[92vw] max-w-md rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_25px_60px_rgba(0,0,0,0.5)]"
                style={{
                    background: 'linear-gradient(165deg, rgba(30,30,50,0.95), rgba(15,15,30,0.98))',
                }}
            >
                {/* Rainbow gradient bar */}
                <div className="h-1 w-full bg-gradient-to-r from-violet-500/60 via-pink-500/50 to-amber-500/50" />

                <div className="p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/25 to-pink-500/15 flex items-center justify-center border border-white/[0.06]">
                                <Palette size={16} className="text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-white/90 tracking-wide">Themes</h2>
                                <p className="text-[10px] text-white/30 tracking-wider">{BG_THEMES.length} BACKGROUNDS</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/70 transition-all"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Category Pills */}
                    <div className="flex gap-1.5 mb-4 flex-wrap">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 ${activeCategory === cat
                                        ? 'bg-white/[0.12] text-white/90'
                                        : 'text-white/30 hover:text-white/55 hover:bg-white/[0.04]'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Theme Grid — no visible scrollbar */}
                    <div
                        className="max-h-[50vh] overflow-y-auto pr-0.5"
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                    >
                        <style>{`.theme-grid::-webkit-scrollbar { display: none; }`}</style>
                        <div className="grid grid-cols-3 gap-2 theme-grid">
                            {filtered.map(theme => (
                                <ThemeCard
                                    key={theme.id}
                                    theme={theme}
                                    isActive={bgTheme.id === theme.id}
                                    onClick={() => setBgTheme(theme.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ThemeCard({ theme, isActive, onClick }: { theme: BgTheme; isActive: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${isActive
                    ? 'ring-[1.5px] ring-white/40 shadow-lg'
                    : 'ring-1 ring-white/[0.06] hover:ring-white/15'
                }`}
        >
            {/* Preview */}
            <div
                className="aspect-[4/3] w-full relative"
                style={{ background: theme.gradient }}
            >
                {/* Subtle dots */}
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: 2,
                            height: 2,
                            left: `${20 + i * 15}%`,
                            top: `${25 + (i % 3) * 20}%`,
                            backgroundColor: theme.particleColor,
                        }}
                    />
                ))}

                {/* Active check */}
                {isActive && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Check size={10} className="text-white" />
                    </div>
                )}
            </div>

            {/* Label */}
            <div className="px-1.5 py-1.5 bg-black/30">
                <div className={`text-[10px] font-medium text-center tracking-wide ${isActive ? 'text-white/90' : 'text-white/45 group-hover:text-white/65'
                    }`}>
                    {theme.name}
                </div>
            </div>
        </button>
    );
}
