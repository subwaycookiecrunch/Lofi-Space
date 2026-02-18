
import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(initialTime: number) {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [isActive, setIsActive] = useState(false);
    const endTimeRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    const start = useCallback(() => {
        if (isActive) return;

        setIsActive(true);
        // Calculate end time based on current timeLeft
        endTimeRef.current = Date.now() + timeLeft * 1000;

        const tick = () => {
            if (!endTimeRef.current) return;

            const now = Date.now();
            const remaining = Math.ceil((endTimeRef.current - now) / 1000);

            if (remaining <= 0) {
                setTimeLeft(0);
                setIsActive(false);
                endTimeRef.current = null;
            } else {
                setTimeLeft(remaining);
                rafRef.current = requestAnimationFrame(tick);
            }
        };

        rafRef.current = requestAnimationFrame(tick);
    }, [isActive, timeLeft]);

    const pause = useCallback(() => {
        if (!isActive) return;

        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        setIsActive(false);
        endTimeRef.current = null; // Clear end time, strict pause
    }, [isActive]);

    const reset = useCallback((newTime: number) => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        setIsActive(false);
        setTimeLeft(newTime);
        endTimeRef.current = null;
    }, []);

    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return { timeLeft, isActive, start, pause, reset, setTimeLeft };
}
