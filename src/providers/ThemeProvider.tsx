
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeConfig, THEMES, ThemeMode } from '@/lib/constants';

interface ThemeContextType {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    theme: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getTimeBasedMode(): ThemeMode {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'study';
    if (hour >= 12 && hour < 18) return 'relax';
    return 'sleep'; // 18-6
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>('study');
    const [prevMode, setPrevMode] = useState<ThemeMode>('study');
    const [transitioning, setTransitioning] = useState(false);

    // Dynamic time-of-day default
    useEffect(() => {
        const suggested = getTimeBasedMode();
        setMode(suggested);
        setPrevMode(suggested);
    }, []);

    const handleSetMode = (newMode: ThemeMode) => {
        if (newMode === mode) return;
        setPrevMode(mode);
        setTransitioning(true);

        // Brief fade transition
        setTimeout(() => {
            setMode(newMode);
            setTimeout(() => setTransitioning(false), 50);
        }, 300);
    };

    return (
        <ThemeContext.Provider value={{ mode, setMode: handleSetMode, theme: THEMES[mode] }}>
            <div
                className={`min-h-screen bg-gradient-to-b text-white transition-all duration-700 ease-in-out
                    ${THEMES[mode].colors.background}
                    ${transitioning ? 'opacity-0 scale-[0.99]' : 'opacity-100 scale-100'}`}
            >
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
