
'use client';

import { useEffect } from 'react';
import { useTheme } from '@/providers/ThemeProvider';

// Syncs CSS custom properties based on system dark/light mode and screen orientation
// Adds subtle ambient shifts to the background
export default function AmbientLightSync() {
    const { mode } = useTheme();

    useEffect(() => {
        const root = document.documentElement;

        // Detect system dark/light preference
        const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyLightSync = () => {
            const isDark = darkQuery.matches;

            // Adjust ambient tint based on system theme
            const warmth = isDark ? 0 : 15; // Add warmth in light mode
            const brightness = isDark ? 1 : 1.05;

            root.style.setProperty('--ambient-warmth', `${warmth}`);
            root.style.setProperty('--ambient-brightness', `${brightness}`);

            // Apply subtle filter to the body
            const filter = isDark
                ? 'none'
                : `brightness(${brightness}) sepia(${warmth / 100})`;

            root.style.filter = filter;
        };

        const handleOrientationChange = () => {
            const isLandscape = window.innerWidth > window.innerHeight;
            root.style.setProperty('--ambient-layout', isLandscape ? 'landscape' : 'portrait');
        };

        // Time-based ambient color temperature
        const updateTimeAmbience = () => {
            const hour = new Date().getHours();
            let temp = 6500; // Daylight kelvin

            if (hour >= 20 || hour < 6) {
                temp = 3500; // Warm night
            } else if (hour >= 17) {
                temp = 4500; // Sunset warm
            } else if (hour >= 6 && hour < 9) {
                temp = 5000; // Cool morning
            }

            // Convert temperature to a subtle CSS hue-rotate
            const hueShift = ((6500 - temp) / 6500) * 8; // Max 8deg shift
            root.style.setProperty('--ambient-hue', `${hueShift}deg`);

            // Very subtle background overlay based on time
            const overlay = document.getElementById('ambient-time-overlay');
            if (overlay) {
                if (hour >= 20 || hour < 6) {
                    overlay.style.background = 'radial-gradient(ellipse at top, rgba(30,0,60,0.15), transparent)';
                } else if (hour >= 17) {
                    overlay.style.background = 'radial-gradient(ellipse at bottom, rgba(60,20,0,0.1), transparent)';
                } else {
                    overlay.style.background = 'none';
                }
            }
        };

        applyLightSync();
        handleOrientationChange();
        updateTimeAmbience();

        darkQuery.addEventListener('change', applyLightSync);
        window.addEventListener('resize', handleOrientationChange);

        // Update time ambience every 5 minutes
        const timeInterval = setInterval(updateTimeAmbience, 5 * 60 * 1000);

        return () => {
            darkQuery.removeEventListener('change', applyLightSync);
            window.removeEventListener('resize', handleOrientationChange);
            clearInterval(timeInterval);
            root.style.filter = 'none';
            root.style.removeProperty('--ambient-warmth');
            root.style.removeProperty('--ambient-brightness');
            root.style.removeProperty('--ambient-hue');
            root.style.removeProperty('--ambient-layout');
        };
    }, [mode]);

    return (
        <div
            id="ambient-time-overlay"
            className="fixed inset-0 z-[1] pointer-events-none transition-all duration-[5000ms]"
        />
    );
}
