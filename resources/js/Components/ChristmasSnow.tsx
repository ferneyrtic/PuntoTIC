import React, { useEffect, useRef } from 'react';

interface Props {
    enabled?: boolean;
}

export default function ChristmasSnow({ enabled = true }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        // Frosty icy-blue palette specifically chosen to be vivid against white backgrounds
        const blueFlakeColors = [
            'rgba(14, 165, 233, 0.75)',  // Vivid Sky Blue
            'rgba(2, 132, 199, 0.70)',   // Deep Winter Azure
            'rgba(56, 189, 248, 0.85)',  // Frost Cyan
            'rgba(99, 102, 241, 0.65)',  // Indigo Frost
            'rgba(37, 99, 235, 0.60)',   // Royal Snow Blue
        ];

        const flakeCount = Math.min(55, Math.floor(window.innerWidth / 30));

        interface Flake {
            x: number;
            y: number;
            size: number;
            speed: number;
            wind: number;
            swaySpeed: number;
            swayOffset: number;
            isCrystal: boolean;
            rotation: number;
            rotationSpeed: number;
            color: string;
            char: string;
        }

        const flakes: Flake[] = [];
        const chars = ['❄', '❅', '✻', '•'];

        for (let i = 0; i < flakeCount; i++) {
            const isCrystal = Math.random() > 0.45; // 55% crystal snowflakes, 45% soft icy dots
            flakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: isCrystal ? Math.random() * 8 + 10 : Math.random() * 2.8 + 1.8,
                speed: Math.random() * 1.1 + 0.6,
                wind: Math.random() * 0.4 - 0.2,
                swaySpeed: Math.random() * 0.02 + 0.01,
                swayOffset: Math.random() * Math.PI * 2,
                isCrystal,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.03,
                color: blueFlakeColors[Math.floor(Math.random() * blueFlakeColors.length)],
                char: chars[Math.floor(Math.random() * (chars.length - 1))],
            });
        }

        let angle = 0;
        const render = () => {
            ctx.clearRect(0, 0, width, height);
            angle += 0.01;

            flakes.forEach((flake) => {
                // Update position
                flake.y += flake.speed;
                flake.x += Math.sin(angle + flake.swayOffset) * 0.7 + flake.wind;
                flake.rotation += flake.rotationSpeed;

                // Wrap around screen boundaries
                if (flake.y > height + 20) {
                    flake.y = -20;
                    flake.x = Math.random() * width;
                }
                if (flake.x > width + 20) {
                    flake.x = -10;
                } else if (flake.x < -20) {
                    flake.x = width + 10;
                }

                ctx.save();
                ctx.translate(flake.x, flake.y);

                if (flake.isCrystal) {
                    // Draw decorative rotating snowflake character in blue
                    ctx.rotate(flake.rotation);
                    ctx.font = `${Math.floor(flake.size)}px "Segoe UI Symbol", "Apple Color Emoji", sans-serif`;
                    ctx.fillStyle = flake.color;
                    ctx.shadowColor = 'rgba(56, 189, 248, 0.45)';
                    ctx.shadowBlur = 6;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(flake.char, 0, 0);
                } else {
                    // Draw soft glowing icy blue dot
                    ctx.beginPath();
                    ctx.arc(0, 0, flake.size, 0, Math.PI * 2);
                    ctx.fillStyle = flake.color;
                    ctx.shadowColor = 'rgba(14, 165, 233, 0.5)';
                    ctx.shadowBlur = 5;
                    ctx.fill();
                }

                ctx.restore();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [enabled]);

    if (!enabled) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-500"
            style={{ width: '100vw', height: '100vh' }}
            aria-hidden="true"
        />
    );
}
