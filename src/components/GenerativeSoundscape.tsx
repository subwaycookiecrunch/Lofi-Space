
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useDeviceMode } from '@/providers/DeviceModeProvider';

// Procedurally generated ambient soundscapes — every session sounds different
export default function GenerativeSoundscape() {
    const { theme, mode } = useTheme();
    const { device } = useDeviceMode();
    const [isPlaying, setIsPlaying] = useState(false);
    const [intensity, setIntensity] = useState(50);
    const ctxRef = useRef<AudioContext | null>(null);
    const nodesRef = useRef<{ stop: () => void }[]>([]);
    const masterRef = useRef<GainNode | null>(null);

    const cleanup = useCallback(() => {
        nodesRef.current.forEach(n => n.stop());
        nodesRef.current = [];
    }, []);

    useEffect(() => {
        return () => {
            cleanup();
            ctxRef.current?.close();
        };
    }, [cleanup]);

    const createNoise = (ctx: AudioContext, filter: BiquadFilterType, freq: number, q: number, gain: number) => {
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        const bq = ctx.createBiquadFilter();
        bq.type = filter;
        bq.frequency.value = freq;
        bq.Q.value = q;
        const g = ctx.createGain();
        g.gain.value = gain;
        src.connect(bq).connect(g);
        src.start();
        return { output: g, stop: () => { try { src.stop(); } catch { } } };
    };

    const startSoundscape = useCallback(() => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ctxRef.current = ctx;
        const master = ctx.createGain();
        master.gain.value = intensity / 100 * 0.4;
        master.connect(ctx.destination);
        masterRef.current = master;

        const nodes: { stop: () => void }[] = [];

        if (mode === 'sleep') {
            // Deep ocean + gentle wind + crickets
            const ocean = createNoise(ctx, 'lowpass', 200 + Math.random() * 150, 1, 0.15);
            ocean.output.connect(master);
            nodes.push(ocean);

            // Ocean waves LFO
            const waveLfo = ctx.createOscillator();
            const waveLfoGain = ctx.createGain();
            waveLfo.frequency.value = 0.08 + Math.random() * 0.04;
            waveLfoGain.gain.value = 100;
            waveLfo.connect(waveLfoGain);
            waveLfoGain.connect(ocean.output.gain);
            waveLfo.start();
            nodes.push({ stop: () => waveLfo.stop() });

            // Crickets (high-pitched filtered noise)
            const crickets = createNoise(ctx, 'bandpass', 4000 + Math.random() * 1000, 10, 0.02);
            crickets.output.connect(master);
            nodes.push(crickets);

            // Random cricket chirp variations
            const chirpLfo = ctx.createOscillator();
            const chirpGain = ctx.createGain();
            chirpLfo.frequency.value = 2 + Math.random() * 3;
            chirpGain.gain.value = 0.015;
            chirpLfo.connect(chirpGain);
            chirpGain.connect(crickets.output.gain);
            chirpLfo.start();
            nodes.push({ stop: () => chirpLfo.stop() });

        } else if (mode === 'study') {
            // Rain with variable intensity
            const rainBase = createNoise(ctx, 'bandpass', 2500 + Math.random() * 1000, 0.5, 0.1);
            rainBase.output.connect(master);
            nodes.push(rainBase);

            // Rain intensity variation
            const rainLfo = ctx.createOscillator();
            const rainLfoGain = ctx.createGain();
            rainLfo.frequency.value = 0.05 + Math.random() * 0.03;
            rainLfoGain.gain.value = 0.05;
            rainLfo.connect(rainLfoGain);
            rainLfoGain.connect(rainBase.output.gain);
            rainLfo.start();
            nodes.push({ stop: () => rainLfo.stop() });

            // Distant thunder (very low rumble, occasional)
            const thunder = createNoise(ctx, 'lowpass', 80 + Math.random() * 40, 2, 0.0);
            thunder.output.connect(master);
            nodes.push(thunder);

            // Thunder scheduler
            const scheduleThunder = () => {
                const delay = 15000 + Math.random() * 45000; // 15-60s
                setTimeout(() => {
                    if (!ctxRef.current) return;
                    const now = ctx.currentTime;
                    thunder.output.gain.linearRampToValueAtTime(0.12, now + 0.5);
                    thunder.output.gain.linearRampToValueAtTime(0.06, now + 1.5);
                    thunder.output.gain.linearRampToValueAtTime(0, now + 4);
                    scheduleThunder();
                }, delay);
            };
            scheduleThunder();

            // Gentle high-freq shimmer (window rain)
            const shimmer = createNoise(ctx, 'highpass', 6000 + Math.random() * 2000, 0.3, 0.03);
            shimmer.output.connect(master);
            nodes.push(shimmer);

        } else {
            // Relax: Forest + birdsong + stream
            const forest = createNoise(ctx, 'bandpass', 600 + Math.random() * 400, 0.3, 0.06);
            forest.output.connect(master);
            nodes.push(forest);

            // Stream water
            const stream = createNoise(ctx, 'highpass', 3000 + Math.random() * 1000, 0.5, 0.04);
            stream.output.connect(master);
            nodes.push(stream);

            // Bird-like tones (sine oscillators with random timing)
            const scheduleBird = () => {
                const delay = 3000 + Math.random() * 8000;
                setTimeout(() => {
                    if (!ctxRef.current) return;
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.frequency.value = 800 + Math.random() * 1200;
                    osc.type = 'sine';
                    g.gain.setValueAtTime(0, ctx.currentTime);
                    g.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.02, ctx.currentTime + 0.1);
                    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3 + Math.random() * 0.3);
                    osc.connect(g).connect(master);
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.6);
                    scheduleBird();
                }, delay);
            };
            scheduleBird();

            // Wind breathing
            const windLfo = ctx.createOscillator();
            const windLfoGain = ctx.createGain();
            windLfo.frequency.value = 0.12 + Math.random() * 0.05;
            windLfoGain.gain.value = 0.03;
            windLfo.connect(windLfoGain);
            windLfoGain.connect(forest.output.gain);
            windLfo.start();
            nodes.push({ stop: () => windLfo.stop() });
        }

        nodesRef.current = nodes;
    }, [mode, intensity]);

    const toggle = () => {
        if (isPlaying) {
            cleanup();
            ctxRef.current?.close();
            ctxRef.current = null;
            setIsPlaying(false);
        } else {
            startSoundscape();
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        if (masterRef.current) {
            masterRef.current.gain.linearRampToValueAtTime(
                intensity / 100 * 0.4,
                ctxRef.current?.currentTime ? ctxRef.current.currentTime + 0.1 : 0
            );
        }
    }, [intensity]);

    // Restart soundscape when mode changes if playing
    useEffect(() => {
        if (isPlaying) {
            cleanup();
            ctxRef.current?.close();
            ctxRef.current = null;
            startSoundscape();
        }
    }, [mode]);

    const getModeLabel = () => {
        switch (mode) {
            case 'study': return '🌧️ Rain & Thunder';
            case 'sleep': return '🌊 Ocean & Crickets';
            case 'relax': return '🌿 Forest & Birds';
        }
    };

    const isMobile = device === 'mobile';

    return (
        <div className={`z-40 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl transition-all duration-500
            ${isMobile ? 'relative w-full max-w-[92vw]' : 'fixed bottom-8 right-8 w-56'}
            ${theme.colors.glass} ${theme.colors.border}`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                    <span className={`text-xs font-medium ${theme.colors.accent}`}>
                        {getModeLabel()}
                    </span>
                    <span className="text-[9px] text-white/40 uppercase tracking-wider">
                        Generative Soundscape
                    </span>
                </div>
                {isPlaying && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={(e) => { e.stopPropagation(); toggle(); }}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all
                        ${isPlaying
                            ? 'bg-white/15 text-white border border-white/20'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'
                        }`}
                >
                    {isPlaying ? '⏸ Stop' : '▶ Play'}
                </button>

                <input
                    type="range"
                    min="10"
                    max="100"
                    value={intensity}
                    onChange={e => setIntensity(parseInt(e.target.value))}
                    className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                />
            </div>
        </div>
    );
}
