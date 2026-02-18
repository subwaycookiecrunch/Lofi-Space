
'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/providers/ThemeProvider';

export default function CursorTrail() {
    const glowRef = useRef<HTMLDivElement>(null);
    const { mode } = useTheme();

    useEffect(() => {
        const glow = glowRef.current;
        if (!glow) return;

        const handleMouse = (e: MouseEvent) => {
            glow.style.left = `${e.clientX}px`;
            glow.style.top = `${e.clientY}px`;
        };

        window.addEventListener('mousemove', handleMouse);
        return () => window.removeEventListener('mousemove', handleMouse);
    }, []);

    const getGlowColor = () => {
        switch (mode) {
            case 'study': return 'rgba(147, 197, 253, 0.15)';
            case 'relax': return 'rgba(253, 186, 116, 0.12)';
            case 'sleep': return 'rgba(196, 181, 253, 0.12)';
        }
    };

    return (
        <div
            ref={glowRef}
            className="fixed pointer-events-none z-[60] -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-75 ease-out"
            style={{
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${getGlowColor()}, transparent 70%)`,
            }}
        />
    );
}
