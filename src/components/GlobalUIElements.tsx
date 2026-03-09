import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUIPreferences } from '../contexts/UIPreferencesContext';
import { PremiumParticles } from './PremiumParticles';
import { NeonCursor } from './NeonCursor';

export function GlobalUIElements() {
    const { preferences } = useUIPreferences();
    const location = useLocation();
    const [isGlitching, setIsGlitching] = useState(false);

    useEffect(() => {
        if (preferences.glitchTransitions) {
            setIsGlitching(true);
            const timer = setTimeout(() => setIsGlitching(false), 400); // glitch duration
            return () => clearTimeout(timer);
        }
    }, [location.pathname, preferences.glitchTransitions]);

    return (
        <>
            <PremiumParticles />
            <NeonCursor />
            {isGlitching && (
                <div className="fixed inset-0 pointer-events-none z-[99998] mix-blend-screen bg-transparent glitch-anim">
                    {/* Glitch overlay */}
                    <div className="absolute inset-0 bg-accent/10 opacity-50 flex flex-col justify-between">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className="w-full h-1 bg-white/20" style={{ transform: `translateX(${(Math.random() - 0.5) * 100}px)` }} />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
