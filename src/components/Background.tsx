
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useBgTheme } from '@/providers/BgThemeProvider';

interface Particle {
    x: number;
    y: number;
    speed: number;
    baseSpeed: number;
    size: number;
    opacity: number;
    baseOpacity: number;
    breathePhase: number;
}

interface BackgroundProps {
    timerProgress?: number; // 0-100
    isTimerActive?: boolean;
    isAlarmRinging?: boolean;
}

export default function Background({ timerProgress = 0, isTimerActive = false, isAlarmRinging = false }: BackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme, mode } = useTheme();
    const { bgTheme } = useBgTheme();
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [flashOpacity, setFlashOpacity] = useState(0);

    // Refs for animation loop access
    const timerProgressRef = useRef(timerProgress);
    const isTimerActiveRef = useRef(isTimerActive);
    const modeRef = useRef(mode);

    useEffect(() => { timerProgressRef.current = timerProgress; }, [timerProgress]);
    useEffect(() => { isTimerActiveRef.current = isTimerActive; }, [isTimerActive]);
    useEffect(() => { modeRef.current = mode; }, [mode]);

    // Alarm flash effect
    useEffect(() => {
        if (isAlarmRinging) {
            setFlashOpacity(0.3);
            const t = setTimeout(() => setFlashOpacity(0), 500);
            return () => clearTimeout(t);
        }
    }, [isAlarmRinging]);

    // Check if background video exists
    useEffect(() => {
        const checkVideo = async () => {
            for (const ext of ['background.mov', 'background.mp4']) {
                try {
                    const res = await fetch(`/${ext}`, { method: 'HEAD' });
                    if (res.ok) {
                        setVideoSrc(`/${ext}`);
                        return;
                    }
                } catch (e) { /* continue */ }
            }
        };
        checkVideo();
    }, []);

    // Particle System with live reactions
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationFrameId: number;
        let time = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const initParticles = () => {
            particles = [];
            const count = Math.floor((canvas.width * canvas.height) / 15000);

            for (let i = 0; i < count; i++) {
                const baseSpeed = Math.random() * 0.5 + 0.2;
                const baseOpacity = Math.random() * 0.5 + 0.1;
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    speed: baseSpeed,
                    baseSpeed,
                    size: Math.random() * 2 + 1,
                    opacity: baseOpacity,
                    baseOpacity,
                    breathePhase: Math.random() * Math.PI * 2,
                });
            }
        };

        const draw = () => {
            time += 0.016;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const isRain = theme.ambience === 'rain';
            const progress = timerProgressRef.current;
            const active = isTimerActiveRef.current;
            const currentMode = modeRef.current;

            // Speed multiplier based on timer progress
            let speedMult = 1;
            if (active && progress > 70) {
                speedMult = 1 + ((progress - 70) / 30) * 1.5; // Accelerate in last 30%
            }

            particles.forEach((p) => {
                // Relax mode: particles "breathe"
                let currentOpacity = p.baseOpacity;
                let currentSize = p.size;

                if (currentMode === 'relax') {
                    const breathe = Math.sin(time * 0.5 + p.breathePhase);
                    currentOpacity = p.baseOpacity * (0.5 + breathe * 0.5);
                    currentSize = p.size * (0.8 + breathe * 0.3);
                }

                // Timer active: calmer, slower drift
                if (active && progress < 70) {
                    currentOpacity *= 0.7;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
                ctx.fillStyle = bgTheme.particleColor;
                ctx.fill();

                // Update position with speed multiplier
                p.y += p.baseSpeed * (isRain ? 3 : 0.5) * speedMult;
                if (p.y > canvas.height) {
                    p.y = 0;
                    p.x = Math.random() * canvas.width;
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [theme, bgTheme]);

    return (
        <>
            {/* Custom background gradient */}
            <div
                className="fixed inset-0 z-0 transition-all duration-1000"
                style={{ background: bgTheme.gradient }}
            />
            {videoSrc && (
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="fixed inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 opacity-40"
                    src={videoSrc}
                />
            )}
            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none z-0 mix-blend-screen"
            />
            {/* Alarm flash */}
            <div
                className="fixed inset-0 z-[5] pointer-events-none bg-white transition-opacity duration-500"
                style={{ opacity: flashOpacity }}
            />
        </>
    );
}
