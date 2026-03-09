import React, { useEffect, useRef } from 'react';
import { useUIPreferences } from '../contexts/UIPreferencesContext';

export function PremiumParticles() {
    const { preferences } = useUIPreferences();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!preferences.dynamicParticles || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: { x: number, y: number, r: number, vx: number, vy: number, alpha: number }[] = [];
        let animationFrameId: number;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const initParticles = () => {
            particles = [];
            // Reduced particle density for better performance
            const numParticles = Math.floor((canvas.width * canvas.height) / 25000);
            for (let i = 0; i < numParticles; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    r: Math.random() * 1.5 + 0.5,
                    vx: (Math.random() - 0.5) * 0.15, // slower, smoother movement
                    vy: (Math.random() - 0.5) * 0.15,
                    alpha: Math.random() * 0.4 + 0.1
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Pre-calculate threshold squared to avoid Math.sqrt in the tight loop
            const thresholdSq = 75 * 75;

            // Single loop optimization
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 245, 255, ${p.alpha})`; // Accent color
                ctx.fill();

                // Network effect - check only forward to avoid duplicate lines and reduce loop count by half
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < thresholdSq) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        // Approximate opacity based on squared distance
                        const opacity = 0.08 - (distSq / (thresholdSq * 12.5));
                        if (opacity > 0) {
                            ctx.strokeStyle = `rgba(0, 245, 255, ${opacity})`;
                            ctx.lineWidth = 0.5;
                            ctx.stroke();
                        }
                    }
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [preferences.dynamicParticles]);

    if (!preferences.dynamicParticles) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 0.6 }}
        />
    );
}
