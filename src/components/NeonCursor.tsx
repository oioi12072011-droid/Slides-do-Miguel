import React, { useEffect, useRef, useState } from 'react';
import { useUIPreferences } from '../contexts/UIPreferencesContext';

export function NeonCursor() {
    const { preferences } = useUIPreferences();
    const [isClicking, setIsClicking] = useState(false);

    // Use refs for positions to avoid React re-renders on every mouse move
    const mousePosRef = useRef({ x: -100, y: -100 });
    const trailPosRef = useRef({ x: -100, y: -100 });

    // Refs to direct DOM elements for 60fps manipulation without React overhead
    const cursorRef = useRef<HTMLDivElement>(null);
    const trailRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!preferences.neonCursor) {
            document.body.classList.remove('custom-cursor-active');
            return;
        }

        document.body.classList.add('custom-cursor-active');

        const handleMouseMove = (e: MouseEvent) => {
            mousePosRef.current = { x: e.clientX, y: e.clientY };

            // Immediately update the main sharp pointer
            if (cursorRef.current) {
                cursorRef.current.style.left = `${e.clientX}px`;
                cursorRef.current.style.top = `${e.clientY}px`;
            }
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mousedown', handleMouseDown, { passive: true });
        window.addEventListener('mouseup', handleMouseUp, { passive: true });

        // requestAnimationFrame loop for the smooth trail
        let animationFrameId: number;
        const updateTrail = () => {
            if (!preferences.neonCursor) return;

            // Calculate smooth interpolation
            const dx = mousePosRef.current.x - trailPosRef.current.x;
            const dy = mousePosRef.current.y - trailPosRef.current.y;

            trailPosRef.current = {
                x: trailPosRef.current.x + dx * 0.15,
                y: trailPosRef.current.y + dy * 0.15
            };

            // Apply directly to DOM
            if (trailRef.current) {
                trailRef.current.style.left = `${trailPosRef.current.x}px`;
                trailRef.current.style.top = `${trailPosRef.current.y}px`;
            }

            animationFrameId = requestAnimationFrame(updateTrail);
        };
        updateTrail();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            cancelAnimationFrame(animationFrameId);
            document.body.classList.remove('custom-cursor-active');
        };
    }, [preferences.neonCursor]);

    if (!preferences.neonCursor) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
            {/* Trailing Tech Ring */}
            <div
                ref={trailRef}
                className="absolute w-12 h-12 rounded-full mix-blend-screen flex items-center justify-center"
                style={{
                    transform: `translate(-50%, -50%) ${isClicking ? 'scale-75' : 'scale-100'}`,
                    transition: 'transform 0.1s ease-out',
                    willChange: 'left, top, transform'
                }}
            >
                {/* Rotating segmented ring */}
                <div className="absolute inset-0 border border-transparent border-t-accent border-b-accent opacity-60 rounded-full animate-spin-slow"></div>

                {/* Counter-rotating inner ring */}
                <div className="absolute inset-1 border border-transparent border-l-accent border-r-accent opacity-30 rounded-full animate-spin-reverse-slower"></div>

                {/* Faded radar circle */}
                <div className="absolute inset-2 border border-accent/20 rounded-full"></div>

                {/* Center dot */}
                <div className="w-1 h-1 bg-accent rounded-full shadow-[0_0_15px_var(--accent)] opacity-80" />
            </div>

            {/* Main Sharp Cyber Pointer */}
            <div
                ref={cursorRef}
                className={`absolute flex items-start justify-start ${isClicking ? 'scale-[0.85]' : 'scale-100'} transition-transform duration-100 ease-out`}
                style={{
                    transform: 'translate(-2px, -2px)',
                    filter: 'drop-shadow(0 0 8px rgba(0, 245, 255, 0.8)) drop-shadow(0 0 20px rgba(0, 245, 255, 0.4))',
                    willChange: 'left, top, transform'
                }}
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M2 2 L9.5 22 L13 13 L22 9.5 Z"
                        fill="rgba(0, 245, 255, 0.15)"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeLinejoin="bevel"
                    />
                    <path
                        d="M13 13 L21 21"
                        stroke="rgba(0, 245, 255, 0.8)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
        </div>
    );
}
