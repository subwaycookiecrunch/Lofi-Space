
import { useState, useEffect, useCallback } from 'react';

interface Position {
    x: number;
    y: number;
}

export function useDraggable(initialPos: Position = { x: 100, y: 100 }) {
    const [position, setPosition] = useState(initialPos);
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // Sync with external updates
    useEffect(() => {
        setPosition(initialPos);
    }, [initialPos.x, initialPos.y]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Stop event from bubbling to other elements

        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);

        setIsDragging(true);
        setOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    }, [position]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;

        e.preventDefault();
        setPosition({
            x: e.clientX - offset.x,
            y: e.clientY - offset.y,
        });
    }, [isDragging, offset]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;

        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        target.releasePointerCapture(e.pointerId);

        setIsDragging(false);
    }, [isDragging]);

    return {
        position,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        isDragging,
        setPosition
    };
}
