import React, { useEffect, useRef } from 'react';

interface Props {
    enabled?: boolean;
}

export default function ChristmasSnow({ enabled = false }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        let resizeTimer: any;
        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (!canvas) return;
                width = canvas.width = window.innerWidth;
                height = canvas.height = window.innerHeight;
            }, 100);
        };

        window.addEventListener('resize', handleResize);

        // Paleta fría invernal nítida sin sombras computadas
        const blueFlakeColors = [
            'rgba(14, 165, 233, 0.70)', // Sky Blue
            'rgba(2, 132, 199, 0.65)',  // Deep Azure
            'rgba(56, 189, 248, 0.75)', // Frost Cyan
            'rgba(99, 102, 241, 0.55)', // Indigo Frost
        ];

        // Cantidad reducida y elegante de copitos: máximo 26 copitos
        const flakeCount = Math.min(26, Math.max(14, Math.floor(window.innerWidth / 55)));

        interface Flake {
            x: number;
            y: number;
            radius: number;
            speed: number;
            wind: number;
            swayOffset: number;
            colorIndex: number;
            isDiamond: boolean;
        }

        const flakes: Flake[] = [];
        for (let i = 0; i < flakeCount; i++) {
            flakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2.2 + 1.2,
                speed: Math.random() * 0.7 + 0.35,
                wind: Math.random() * 0.25 - 0.12,
                swayOffset: Math.random() * Math.PI * 2,
                colorIndex: Math.floor(Math.random() * blueFlakeColors.length),
                isDiamond: Math.random() > 0.65,
            });
        }

        let angle = 0;

        // Render loop ultraligero: CERO shadowBlur, CERO fillText, CERO save/restore
        const render = () => {
            ctx.clearRect(0, 0, width, height);
            angle += 0.01;

            // Actualizar posiciones de las partículas
            for (let i = 0; i < flakes.length; i++) {
                const flake = flakes[i];
                flake.y += flake.speed;
                flake.x += Math.sin(angle + flake.swayOffset) * 0.45 + flake.wind;

                if (flake.y > height + 10) {
                    flake.y = -10;
                    flake.x = Math.random() * width;
                }
                if (flake.x > width + 10) {
                    flake.x = -10;
                } else if (flake.x < -10) {
                    flake.x = width + 10;
                }
            }

            // Agrupar dibujo por color para minimizar llamadas al contexto
            for (let c = 0; c < blueFlakeColors.length; c++) {
                ctx.fillStyle = blueFlakeColors[c];
                ctx.beginPath();
                for (let i = 0; i < flakes.length; i++) {
                    const flake = flakes[i];
                    if (flake.colorIndex === c) {
                        if (flake.isDiamond) {
                            // Pequeño copo en forma de diamante / rombo pixel
                            ctx.rect(flake.x - flake.radius, flake.y - flake.radius, flake.radius * 2, flake.radius * 2);
                        } else {
                            // Copo circular suave
                            ctx.moveTo(flake.x + flake.radius, flake.y);
                            ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
                        }
                    }
                }
                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimer);
            cancelAnimationFrame(animationFrameId);
        };
    }, [enabled]);

    if (!enabled) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-30"
            style={{ width: '100vw', height: '100vh', willChange: 'transform' }}
            aria-hidden="true"
        />
    );
}
