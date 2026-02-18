
'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/providers/ThemeProvider';

// Animated pixel art scenes for each mode
export default function PixelArtScene() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { mode } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = 160;
        const H = 100;
        canvas.width = W;
        canvas.height = H;
        ctx.imageSmoothingEnabled = false;

        let animId: number;
        let frame = 0;

        const drawPixel = (x: number, y: number, color: string) => {
            ctx.fillStyle = color;
            ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
        };

        const drawRect = (x: number, y: number, w: number, h: number, color: string) => {
            ctx.fillStyle = color;
            ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
        };

        // Sleeping cat scene
        const drawSleepScene = () => {
            // Night sky
            ctx.fillStyle = '#0a0a20';
            ctx.fillRect(0, 0, W, H);

            // Stars
            const starPositions = [
                [20, 10], [45, 15], [80, 8], [120, 12], [140, 20],
                [30, 25], [100, 18], [60, 5], [15, 30], [130, 7],
                [55, 22], [90, 28], [110, 5], [35, 8], [150, 15],
            ];
            starPositions.forEach(([sx, sy]) => {
                const twinkle = Math.sin(frame * 0.05 + sx * 0.3) > 0.3;
                if (twinkle) drawPixel(sx, sy, '#ffffff');
                else drawPixel(sx, sy, '#666688');
            });

            // Moon
            drawRect(130, 5, 8, 8, '#ffffcc');
            drawRect(133, 5, 5, 3, '#0a0a20'); // Crescent

            // Ground
            drawRect(0, 75, W, 25, '#1a1a35');
            drawRect(0, 74, W, 1, '#2a2a50');

            // Window sill
            drawRect(50, 50, 60, 2, '#3a3a5a');
            drawRect(48, 40, 64, 2, '#3a3a5a');
            drawRect(48, 40, 2, 12, '#3a3a5a');
            drawRect(110, 40, 2, 12, '#3a3a5a');
            drawRect(79, 40, 2, 12, '#3a3a5a');

            // Cat on window sill
            const breathe = Math.sin(frame * 0.03) * 0.5;
            const catY = 44 + breathe;

            // Cat body
            drawRect(58, catY + 2, 16, 6, '#444466');
            // Cat head
            drawRect(61, catY - 1, 8, 5, '#444466');
            // Ears
            drawPixel(61, catY - 2, '#444466');
            drawPixel(68, catY - 2, '#444466');
            // Tail
            drawRect(73, catY + 3, 4, 2, '#444466');
            drawPixel(77, catY + 2, '#444466');
            // Zzz
            const zOffset = Math.floor(frame / 30) % 3;
            if (zOffset >= 0) drawPixel(72, catY - 4, '#8888aa');
            if (zOffset >= 1) drawPixel(75, catY - 6, '#6666aa');
            if (zOffset >= 2) drawPixel(78, catY - 8, '#4444aa');
        };

        // Campfire scene
        const drawRelaxScene = () => {
            // Dusk sky
            ctx.fillStyle = '#1a1020';
            ctx.fillRect(0, 0, W, 40);
            ctx.fillStyle = '#2a1525';
            ctx.fillRect(0, 40, W, 20);
            ctx.fillStyle = '#3a2030';
            ctx.fillRect(0, 55, W, 10);

            // Ground
            drawRect(0, 65, W, 35, '#1a0f0a');

            // Trees silhouette
            const trees = [[15, 8], [35, 12], [120, 10], [140, 14]];
            trees.forEach(([tx, th]) => {
                drawRect(tx + 2, 65 - th * 3, 2, th * 3, '#0a0a0a');
                for (let i = 0; i < th; i++) {
                    const w = Math.max(1, th - i);
                    drawRect(tx + 3 - Math.floor(w / 2), 65 - th * 3 + i * 2, w, 2, '#0f0f0f');
                }
            });

            // Campfire logs
            drawRect(75, 72, 12, 2, '#3a2010');
            drawRect(73, 74, 16, 2, '#3a2010');

            // Fire
            const fireColors = ['#ff4400', '#ff6600', '#ffaa00', '#ffcc00', '#ffee88'];
            for (let i = 0; i < 8; i++) {
                const fx = 78 + Math.sin(frame * 0.1 + i * 1.5) * 3;
                const fy = 68 - i * 1 - Math.random() * 2;
                const color = fireColors[Math.min(i, fireColors.length - 1)];
                drawRect(fx, fy, 2 + (i < 3 ? 2 : 0), 2, color);
            }

            // Sparks
            if (frame % 8 === 0) {
                const sparkX = 79 + (Math.random() - 0.5) * 10;
                const sparkY = 62 - Math.random() * 8;
                drawPixel(sparkX, sparkY, '#ffcc44');
            }

            // Stars
            for (let i = 0; i < 10; i++) {
                const sx = (i * 37 + 5) % W;
                const sy = (i * 13 + 3) % 35;
                const twinkle = Math.sin(frame * 0.04 + i) > 0.2;
                drawPixel(sx, sy, twinkle ? '#ffffff' : '#555555');
            }
        };

        // Rainy window scene
        const drawStudyScene = () => {
            // Indoor warm tone
            ctx.fillStyle = '#1a1825';
            ctx.fillRect(0, 0, W, H);

            // Desk
            drawRect(0, 70, W, 30, '#2a2018');
            drawRect(0, 69, W, 1, '#3a3028');

            // Laptop
            drawRect(55, 56, 30, 14, '#222233');
            drawRect(57, 58, 26, 10, '#3355aa'); // Screen glow
            drawRect(50, 70, 40, 2, '#333344');

            // Coffee mug
            drawRect(100, 63, 8, 8, '#ccccbb');
            drawRect(108, 65, 3, 4, '#ccccbb');
            // Steam
            const steam1 = Math.sin(frame * 0.06) * 2;
            const steam2 = Math.sin(frame * 0.06 + 1) * 2;
            drawPixel(102 + steam1, 60, '#ffffff33');
            drawPixel(105 + steam2, 58, '#ffffff22');

            // Window
            drawRect(20, 10, 40, 45, '#1a2a40');
            drawRect(20, 10, 40, 1, '#3a3a5a');
            drawRect(20, 55, 40, 1, '#3a3a5a');
            drawRect(20, 10, 1, 45, '#3a3a5a');
            drawRect(60, 10, 1, 45, '#3a3a5a');
            drawRect(40, 10, 1, 45, '#3a3a5a');

            // Rain drops on window
            for (let i = 0; i < 12; i++) {
                const rx = 21 + (i * 7 + frame) % 39;
                const ry = (frame * 2 + i * 23) % 44 + 11;
                drawPixel(rx, ry, '#5588cc');
            }

            // Book
            drawRect(10, 65, 14, 6, '#aa4444');
            drawRect(10, 65, 14, 1, '#cc6666');
        };

        const animate = () => {
            frame++;

            switch (mode) {
                case 'sleep': drawSleepScene(); break;
                case 'relax': drawRelaxScene(); break;
                case 'study': drawStudyScene(); break;
            }

            animId = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(animId);
    }, [mode]);

    return (
        <div className="flex flex-col items-center gap-2">
            <canvas
                ref={canvasRef}
                className="rounded-xl border border-white/5 shadow-lg"
                style={{
                    width: 320,
                    height: 200,
                    imageRendering: 'pixelated',
                }}
            />
            <span className="text-[9px] uppercase tracking-[0.3em] text-white/20">
                {mode === 'sleep' ? '🌙 Midnight' : mode === 'relax' ? '🔥 Campfire' : '📚 Study Desk'}
            </span>
        </div>
    );
}
