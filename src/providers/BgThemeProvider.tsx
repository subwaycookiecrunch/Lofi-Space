
'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';

export interface BgTheme {
    id: string;
    name: string;
    category: string;
    gradient: string;        // CSS gradient string
    particleColor: string;   // rgba for particles
    accentHue: number;       // 0-360 for UI accents
}

export const BG_THEMES: BgTheme[] = [
    // ── Dark & Minimal ──
    { id: 'midnight', name: 'Midnight', category: 'Dark', gradient: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 40%, #0a0a1a 100%)', particleColor: 'rgba(255,255,255,0.15)', accentHue: 240 },
    { id: 'void', name: 'The Void', category: 'Dark', gradient: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #050510 100%)', particleColor: 'rgba(150,150,200,0.12)', accentHue: 260 },
    { id: 'charcoal', name: 'Charcoal', category: 'Dark', gradient: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', particleColor: 'rgba(180,200,255,0.15)', accentHue: 220 },
    // ── Ocean & Blue ──
    { id: 'deep-ocean', name: 'Deep Ocean', category: 'Ocean', gradient: 'linear-gradient(180deg, #0c1445 0%, #0b2a6b 40%, #051937 100%)', particleColor: 'rgba(100,180,255,0.2)', accentHue: 210 },
    { id: 'arctic', name: 'Arctic', category: 'Ocean', gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 40%, #2c5364 100%)', particleColor: 'rgba(170,220,240,0.18)', accentHue: 195 },
    { id: 'sea-foam', name: 'Sea Foam', category: 'Ocean', gradient: 'linear-gradient(160deg, #0d1b2a 0%, #1b3a4b 50%, #065a60 100%)', particleColor: 'rgba(120,220,200,0.18)', accentHue: 180 },
    // ── Purple & Cosmic ──
    { id: 'nebula', name: 'Nebula', category: 'Cosmic', gradient: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 40%, #11001c 100%)', particleColor: 'rgba(200,150,255,0.2)', accentHue: 280 },
    { id: 'aurora', name: 'Aurora', category: 'Cosmic', gradient: 'linear-gradient(160deg, #0a0e27 0%, #1a1a4e 30%, #0d3b3b 70%, #0a0e27 100%)', particleColor: 'rgba(100,255,200,0.15)', accentHue: 160 },
    { id: 'cosmos', name: 'Cosmos', category: 'Cosmic', gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', particleColor: 'rgba(180,160,255,0.18)', accentHue: 260 },
    { id: 'galaxy', name: 'Galaxy', category: 'Cosmic', gradient: 'radial-gradient(ellipse at 30% 50%, #1a0030 0%, #0f0025 40%, #0a001a 100%)', particleColor: 'rgba(220,180,255,0.2)', accentHue: 290 },
    // ── Warm & Sunset ──
    { id: 'sunset', name: 'Sunset', category: 'Warm', gradient: 'linear-gradient(180deg, #1a0a1e 0%, #2d1338 30%, #4a1942 60%, #1a0a1e 100%)', particleColor: 'rgba(255,150,100,0.18)', accentHue: 340 },
    { id: 'ember', name: 'Ember', category: 'Warm', gradient: 'linear-gradient(135deg, #1a0a00 0%, #2d1500 40%, #4a1a00 70%, #1a0a00 100%)', particleColor: 'rgba(255,120,50,0.2)', accentHue: 25 },
    { id: 'rose', name: 'Rose Gold', category: 'Warm', gradient: 'linear-gradient(160deg, #1a0a10 0%, #2d0a1a 40%, #1a0510 100%)', particleColor: 'rgba(255,150,180,0.18)', accentHue: 350 },
    // ── Nature & Forest ──
    { id: 'forest', name: 'Forest', category: 'Nature', gradient: 'linear-gradient(180deg, #0a1a0a 0%, #0d2818 40%, #0a1a0a 100%)', particleColor: 'rgba(100,255,100,0.15)', accentHue: 130 },
    { id: 'moss', name: 'Moss', category: 'Nature', gradient: 'linear-gradient(135deg, #0a150a 0%, #1a2f1a 40%, #0f200f 100%)', particleColor: 'rgba(150,210,120,0.18)', accentHue: 110 },
    { id: 'rain-forest', name: 'Rain Forest', category: 'Nature', gradient: 'linear-gradient(160deg, #071a12 0%, #0a2e1f 50%, #051a0e 100%)', particleColor: 'rgba(80,200,150,0.2)', accentHue: 155 },
    // ── Neon & Cyberpunk ──
    { id: 'cyber', name: 'Cyberpunk', category: 'Neon', gradient: 'linear-gradient(135deg, #0a0015 0%, #1a0030 30%, #000a20 70%, #150020 100%)', particleColor: 'rgba(255,0,200,0.15)', accentHue: 310 },
    { id: 'neon-night', name: 'Neon Night', category: 'Neon', gradient: 'linear-gradient(160deg, #0d001a 0%, #1a0033 40%, #002a1a 100%)', particleColor: 'rgba(0,255,180,0.15)', accentHue: 165 },
    { id: 'synthwave', name: 'Synthwave', category: 'Neon', gradient: 'linear-gradient(180deg, #0a0020 0%, #1a0045 35%, #2d0040 65%, #0a0020 100%)', particleColor: 'rgba(255,100,255,0.18)', accentHue: 300 },
];

const STORAGE_KEY = 'lucid-bg-theme';
const DEFAULT_THEME = 'midnight';

interface BgThemeContextType {
    bgTheme: BgTheme;
    setBgTheme: (id: string) => void;
}

const BgThemeContext = createContext<BgThemeContextType>({
    bgTheme: BG_THEMES[0],
    setBgTheme: () => { },
});

export const useBgTheme = () => useContext(BgThemeContext);

export default function BgThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeId, setThemeId] = useState<string>(DEFAULT_THEME);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && BG_THEMES.find(t => t.id === saved)) {
                setThemeId(saved);
            }
        } catch { }
    }, []);

    const setBgTheme = (id: string) => {
        setThemeId(id);
        localStorage.setItem(STORAGE_KEY, id);
    };

    const bgTheme = BG_THEMES.find(t => t.id === themeId) || BG_THEMES[0];

    return (
        <BgThemeContext.Provider value={{ bgTheme, setBgTheme }}>
            {children}
        </BgThemeContext.Provider>
    );
}
