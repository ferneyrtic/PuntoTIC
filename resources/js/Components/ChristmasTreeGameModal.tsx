import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
    X,
    Sparkles,
    Trash2,
    Save,
    RotateCcw,
    Heart,
    CheckCircle2,
    Eye,
    MessageCircle,
    Sliders,
    Lightbulb,
} from 'lucide-react';

export interface Decoration {
    id: string;
    tipo: string;
    x: number;
    y: number;
    color?: string;
}

export interface TreeData {
    id?: number;
    user_id?: number;
    id_punto?: number | null;
    nombre_gestor: string;
    nombre_punto: string | null;
    decoraciones: Decoration[];
    mensaje: string | null;
    luces_activas: boolean;
    reacciones_count: number;
    created_at?: string;
    updated_at?: string;
    user?: { id: number; name: string };
    point?: { id_punto: number; nombre_punto: string; zona?: string };
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentUserName?: string;
    currentUserPoint?: string;
}

// Catálogo de adornos disponibles para decorar
export const ORNAMENT_TYPES = [
    { id: 'estrella', label: 'Estrella de Belén', emoji: '⭐', iconBg: 'bg-amber-100 border-amber-300 text-amber-600', isStar: true },
    { id: 'bola_roja', label: 'Esfera Rubí', emoji: '🔴', iconBg: 'bg-rose-100 border-rose-300 text-rose-600' },
    { id: 'bola_oro', label: 'Esfera Dorada', emoji: '🟡', iconBg: 'bg-yellow-100 border-yellow-300 text-yellow-600' },
    { id: 'bola_azul', label: 'Esfera Zafiro', emoji: '🔵', iconBg: 'bg-blue-100 border-blue-300 text-blue-600' },
    { id: 'bola_morada', label: 'Esfera Amatista', emoji: '🟣', iconBg: 'bg-purple-100 border-purple-300 text-purple-600' },
    { id: 'baston', label: 'Bastón Caramelo', emoji: '🍭', iconBg: 'bg-red-50 border-red-200 text-red-600' },
    { id: 'campana', label: 'Campana Dorada', emoji: '🔔', iconBg: 'bg-amber-100 border-amber-300 text-amber-700' },
    { id: 'lazo', label: 'Moño Navideño', emoji: '🎀', iconBg: 'bg-pink-100 border-pink-300 text-pink-600' },
    { id: 'galleta', label: 'Hombre Jengibre', emoji: '🍪', iconBg: 'bg-orange-100 border-orange-300 text-orange-700' },
    { id: 'regalo', label: 'Regalo Festivo', emoji: '🎁', iconBg: 'bg-emerald-100 border-emerald-300 text-emerald-700' },
    { id: 'copo', label: 'Copo Brillante', emoji: '❄️', iconBg: 'bg-cyan-100 border-cyan-300 text-cyan-600' },
    { id: 'vela', label: 'Vela de Navidad', emoji: '🕯️', iconBg: 'bg-amber-50 border-amber-200 text-amber-600' },
];

/**
 * Componente que dibuja el pino navideño en SVG con sus adornos y luces
 */
export function PineTreeCanvas({
    decorations,
    lucesActivas = true,
    interactive = false,
    onCanvasClick,
    onRemoveDecoration,
    size = 'normal',
}: {
    decorations: Decoration[];
    lucesActivas?: boolean;
    interactive?: boolean;
    onCanvasClick?: (x: number, y: number) => void;
    onRemoveDecoration?: (id: string) => void;
    size?: 'normal' | 'mini' | 'preview';
}) {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!interactive || !onCanvasClick || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        const rawX = ((clientX - rect.left) / rect.width) * 100;
        const rawY = ((clientY - rect.top) / rect.height) * 100;

        // Limitar dentro del área visible del pino
        const clampedX = Math.max(16, Math.min(84, rawX));
        const clampedY = Math.max(8, Math.min(82, rawY));

        onCanvasClick(Math.round(clampedX * 10) / 10, Math.round(clampedY * 10) / 10);
    };

    const isMini = size === 'mini';
    const isPreview = size === 'preview';

    return (
        <div
            ref={containerRef}
            onClick={handleClick}
            className={`relative select-none ${
                interactive ? 'cursor-crosshair' : 'cursor-default'
            } ${
                isMini
                    ? 'w-full h-48'
                    : isPreview
                    ? 'w-full max-w-[320px] h-72'
                    : 'w-full max-w-[380px] h-[400px] sm:h-[440px]'
            } mx-auto flex items-center justify-center`}
        >
            {/* SVG Base del Árbol de Navidad */}
            <svg
                viewBox="0 0 300 380"
                className="w-full h-full drop-shadow-xl overflow-visible pointer-events-none"
                style={{ filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.12))' }}
            >
                <defs>
                    {/* Degradados festivos para los follajes del pino */}
                    <linearGradient id="pinoGradiente1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#16a34a" />
                        <stop offset="100%" stopColor="#15803d" />
                    </linearGradient>
                    <linearGradient id="pinoGradiente2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#15803d" />
                        <stop offset="100%" stopColor="#166534" />
                    </linearGradient>
                    <linearGradient id="pinoGradiente3" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#166534" />
                        <stop offset="100%" stopColor="#14532d" />
                    </linearGradient>
                    <linearGradient id="troncoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#78350f" />
                        <stop offset="50%" stopColor="#92400e" />
                        <stop offset="100%" stopColor="#78350f" />
                    </linearGradient>
                    <linearGradient id="nieveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f0f9ff" />
                        <stop offset="100%" stopColor="#bae6fd" />
                    </linearGradient>
                    <filter id="brilloLuz" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Sombra de la base en la nieve */}
                <ellipse cx="150" cy="358" rx="100" ry="18" fill="rgba(14, 116, 144, 0.15)" />

                {/* Tronco de Madera Robusta */}
                <rect x="134" y="300" width="32" height="48" rx="4" fill="url(#troncoGrad)" />
                <path d="M 142 300 L 142 345 M 150 305 L 150 348 M 158 300 L 158 344" stroke="#582407" strokeWidth="1.5" strokeOpacity="0.4" />

                {/* CAPA 3 (Inferior - Ancha) */}
                <polygon points="150,185 265,315 220,315 245,315 150,305 55,315 80,315 35,315" fill="url(#pinoGradiente3)" />
                <path
                    d="M 150 185 L 265 315 Q 210 305 150 310 Q 90 305 35 315 Z"
                    fill="url(#pinoGradiente3)"
                />
                {/* Ribete de nieve capa 3 */}
                <path
                    d="M 40 315 Q 60 305 85 314 Q 115 306 150 311 Q 185 306 215 314 Q 240 305 260 315"
                    stroke="url(#nieveGrad)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.85"
                />

                {/* CAPA 2 (Media) */}
                <path
                    d="M 150 115 L 240 225 Q 195 215 150 220 Q 105 215 60 225 Z"
                    fill="url(#pinoGradiente2)"
                />
                {/* Ribete de nieve capa 2 */}
                <path
                    d="M 66 224 Q 90 216 120 222 Q 150 217 180 222 Q 210 216 234 224"
                    stroke="url(#nieveGrad)"
                    strokeWidth="3.5"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.85"
                />

                {/* CAPA 1 (Superior - Cuspide) */}
                <path
                    d="M 150 48 L 210 145 Q 180 138 150 142 Q 120 138 90 145 Z"
                    fill="url(#pinoGradiente1)"
                />
                {/* Ribete de nieve capa 1 */}
                <path
                    d="M 94 144 Q 120 139 150 142 Q 180 139 206 144"
                    stroke="url(#nieveGrad)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.85"
                />

                {/* Copete de nieve en la cima */}
                <path d="M 150 48 Q 158 60 162 66 Q 150 63 138 66 Z" fill="#ffffff" opacity="0.9" />

                {/* Luces y Guirnalda Festiva (si están activas) */}
                {lucesActivas && (
                    <g className="luces-navidenas">
                        {/* Guirnalda 1 (Superior) */}
                        <path
                            d="M 112 110 Q 150 132 188 110"
                            stroke="rgba(254, 240, 138, 0.45)"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                            fill="none"
                        />
                        {/* Bombillos Nivel 1 */}
                        <circle cx="120" cy="115" r="4" fill="#ef4444" className="animate-pulse" filter="url(#brilloLuz)" />
                        <circle cx="138" cy="122" r="4.5" fill="#facc15" className="animate-pulse" filter="url(#brilloLuz)" style={{ animationDelay: '200ms' }} />
                        <circle cx="162" cy="122" r="4.5" fill="#06b6d4" className="animate-pulse" filter="url(#brilloLuz)" style={{ animationDelay: '400ms' }} />
                        <circle cx="180" cy="115" r="4" fill="#a855f7" className="animate-pulse" filter="url(#brilloLuz)" style={{ animationDelay: '600ms' }} />

                        {/* Guirnalda 2 (Media) */}
                        <path
                            d="M 85 180 Q 150 215 215 180"
                            stroke="rgba(254, 240, 138, 0.4)"
                            strokeWidth="1.5"
                            strokeDasharray="5 5"
                            fill="none"
                        />
                        {/* Bombillos Nivel 2 */}
                        <circle cx="98" cy="188" r="4.5" fill="#facc15" className="animate-pulse" filter="url(#brilloLuz)" style={{ animationDelay: '150ms' }} />
                        <circle cx="124" cy="198" r="4.5" fill="#3b82f6" className="animate-pulse" filter="url(#brilloLuz)" style={{ animationDelay: '350ms' }} />
                        <circle cx="150" cy="202" r="5" fill="#ef4444" className="animate-pulse" filter="url(#brilloLuz)" style={{ animationDelay: '550ms' }} />
                        <circle cx="176" cy="198" r="4.5" fill="#10b981" className="animate-pulse" filter="url(#brilloLuz)" style={{ animationDelay: '250ms' }} />
                        <circle cx="202" cy="188" r="4.5" fill="#f59e0b" className="animate-pulse" filter="url(#brilloLuz)" style={{ animationDelay: '450ms' }} />

                        {/* Guirnalda 3 (Inferior) */}
                        <path
                            d="M 65 260 Q 150 305 235 260"
                            stroke="rgba(254, 240, 138, 0.4)"
                            strokeWidth="1.5"
                            strokeDasharray="5 5"
                            fill="none"
                        />
                        {/* Bombillos Nivel 3 */}
                        <circle cx="80" cy="272" r="5" fill="#ec4899" className="animate-pulse" filter="url(#brilloLuz)" style={{ animationDelay: '100ms' }} />
                        <circle cx="108" cy="285" r="5" fill="#facc15" className="animate-pulse" filter="url(#brilloLuz)" style={{ animationDelay: '300ms' }} />
                        <circle cx="136" cy="292" r="5" fill="#06b6d4" className="animate-pulse" filter="url(#brilloLuz)" style={{ animationDelay: '500ms' }} />
                        <circle cx="164" cy="292" r="5" fill="#ef4444" className="animate-pulse" filter="url(#brilloLuz)" style={{ animationDelay: '200ms' }} />
                        <circle cx="192" cy="285" r="5" fill="#a855f7" className="animate-pulse" filter="url(#brilloLuz)" style={{ animationDelay: '400ms' }} />
                        <circle cx="220" cy="272" r="5" fill="#facc15" className="animate-pulse" filter="url(#brilloLuz)" style={{ animationDelay: '600ms' }} />
                    </g>
                )}

                {/* Base de Nieve Suave */}
                <ellipse cx="150" cy="350" rx="90" ry="12" fill="url(#nieveGrad)" />
                <ellipse cx="140" cy="354" rx="70" ry="8" fill="#ffffff" opacity="0.9" />

                {/* Regalos al pie del árbol */}
                <g>
                    {/* Regalo Rojo */}
                    <rect x="75" y="325" width="28" height="24" rx="2" fill="#dc2626" />
                    <rect x="87" y="325" width="4" height="24" fill="#fbbf24" />
                    <rect x="75" y="335" width="28" height="4" fill="#fbbf24" />
                    <circle cx="89" cy="323" r="3" fill="#f59e0b" />

                    {/* Regalo Azul */}
                    <rect x="195" y="322" width="30" height="26" rx="2" fill="#0284c7" />
                    <rect x="208" y="322" width="4" height="26" fill="#f0fdf4" />
                    <rect x="195" y="333" width="30" height="4" fill="#f0fdf4" />
                    <circle cx="210" cy="320" r="3.5" fill="#ffffff" />
                </g>
            </svg>

            {/* ADORNOS COLOCADOS POR EL GESTOR (Posicionados en %) */}
            {decorations.map((deco) => {
                const ornamentMeta = ORNAMENT_TYPES.find((t) => t.id === deco.tipo) || ORNAMENT_TYPES[1];
                const isStar = deco.tipo === 'estrella';

                return (
                    <div
                        key={deco.id}
                        style={{
                            left: `${deco.x}%`,
                            top: `${deco.y}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                        onClick={(e) => {
                            if (interactive && onRemoveDecoration) {
                                e.stopPropagation();
                                onRemoveDecoration(deco.id);
                            }
                        }}
                        className={`absolute flex items-center justify-center transition-transform ${
                            interactive
                                ? 'hover:scale-135 cursor-pointer group pointer-events-auto'
                                : 'pointer-events-none'
                        }`}
                        title={interactive ? `${ornamentMeta.label} (Clic para quitar)` : ornamentMeta.label}
                    >
                        <span
                            className={`select-none filter drop-shadow-md transition-all ${
                                isStar
                                    ? isMini
                                        ? 'text-xl'
                                        : 'text-3xl sm:text-4xl animate-bounce'
                                    : isMini
                                    ? 'text-xs'
                                    : 'text-lg sm:text-xl'
                            } ${interactive ? 'group-hover:rotate-12' : ''}`}
                            style={{
                                filter: isStar
                                    ? 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.9))'
                                    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                            }}
                        >
                            {ornamentMeta.emoji}
                        </span>

                        {/* Indicador pequeño al pasar el cursor para borrar */}
                        {interactive && (
                            <span className="opacity-0 group-hover:opacity-100 absolute -top-4 bg-rose-600 text-white rounded-full p-0.5 shadow-md text-[9px] transition-opacity">
                                <X className="w-2.5 h-2.5" />
                            </span>
                        )}
                    </div>
                );
            })}

            {/* Hint si está vacío en modo interactivo */}
            {interactive && decorations.length === 0 && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center pointer-events-none bg-slate-900/70 backdrop-blur-xs text-white p-3 rounded-2xl border border-white/20 animate-fade-in">
                    <Sparkles className="w-6 h-6 text-amber-300 mx-auto mb-1 animate-spin" />
                    <p className="text-xs font-bold text-amber-300">¡Tu árbol está esperando tus adornos!</p>
                    <p className="text-[11px] text-slate-200 mt-0.5">
                        Elige un adorno abajo y haz clic sobre las ramas para colocarlo.
                    </p>
                </div>
            )}
        </div>
    );
}

export default function ChristmasTreeGameModal({
    isOpen,
    onClose,
    currentUserName,
    currentUserPoint,
}: Props) {
    const [activeTab, setActiveTab] = useState<'decorar' | 'galeria'>('decorar');
    const [selectedOrnament, setSelectedOrnament] = useState<string>('bola_roja');
    const [decorations, setDecorations] = useState<Decoration[]>([]);
    const [lucesActivas, setLucesActivas] = useState<boolean>(true);
    const [mensaje, setMensaje] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    const [isLoadingGallery, setIsLoadingGallery] = useState<boolean>(false);
    const [galleryTrees, setGalleryTrees] = useState<TreeData[]>([]);
    const [selectedPreviewTree, setSelectedPreviewTree] = useState<TreeData | null>(null);
    const [myTreeId, setMyTreeId] = useState<number | null>(null);
    const [heartAnimatingId, setHeartAnimatingId] = useState<number | null>(null);

    // Cargar datos al abrir modal
    useEffect(() => {
        if (!isOpen) return;

        document.body.style.overflow = 'hidden';

        const loadTrees = async () => {
            setIsLoadingGallery(true);
            try {
                const res = await axios.get('/api/navidad/arboles');
                const data = res.data;

                if (data.mi_arbol) {
                    setMyTreeId(data.mi_arbol.id);
                    setDecorations(data.mi_arbol.decoraciones || []);
                    setMensaje(data.mi_arbol.mensaje || '');
                    setLucesActivas(data.mi_arbol.luces_activas ?? true);
                } else {
                    // Diseño inicial por defecto sugerido si nunca ha decorado
                    aplicarDisenoSugeridoInicial();
                }

                if (Array.isArray(data.arboles)) {
                    setGalleryTrees(data.arboles);
                }
            } catch (err) {
                console.warn('No se pudo cargar la galería navideña:', err);
            } finally {
                setIsLoadingGallery(false);
            }
        };

        loadTrees();

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Sugerencia inicial armónica
    const aplicarDisenoSugeridoInicial = () => {
        const disenoBase: Decoration[] = [
            { id: 'star-top', tipo: 'estrella', x: 50, y: 11 },
            { id: 'b1', tipo: 'bola_roja', x: 44, y: 28 },
            { id: 'b2', tipo: 'bola_oro', x: 56, y: 32 },
            { id: 'b3', tipo: 'baston', x: 38, y: 48 },
            { id: 'b4', tipo: 'bola_azul', x: 62, y: 50 },
            { id: 'b5', tipo: 'campana', x: 50, y: 46 },
            { id: 'b6', tipo: 'bola_morada', x: 30, y: 66 },
            { id: 'b7', tipo: 'bola_roja', x: 70, y: 68 },
            { id: 'b8', tipo: 'lazo', x: 48, y: 68 },
            { id: 'b9', tipo: 'galleta', x: 60, y: 72 },
            { id: 'b10', tipo: 'regalo', x: 38, y: 74 },
        ];
        setDecorations(disenoBase);
        if (!mensaje) {
            setMensaje(`¡Felices fiestas y próspero 2027 les desea el equipo de ${currentUserPoint || 'PuntoTIC Acacías'}! 🎄✨`);
        }
    };

    // Generar diseño sorpresa aleatorio
    const generarDisenoSorpresa = () => {
        const nuevas: Decoration[] = [
            { id: `star-${Date.now()}`, tipo: 'estrella', x: 50, y: 11 },
        ];

        // Lista de tipos ornamentales
        const pool = ['bola_roja', 'bola_oro', 'bola_azul', 'bola_morada', 'baston', 'campana', 'lazo', 'galleta', 'copo', 'regalo'];

        // Cúspide
        nuevas.push({
            id: `d1-${Date.now()}`,
            tipo: pool[Math.floor(Math.random() * pool.length)],
            x: 43 + Math.random() * 14,
            y: 28 + Math.random() * 8,
        });

        // Nivel Medio
        for (let i = 0; i < 4; i++) {
            nuevas.push({
                id: `d2-${i}-${Date.now()}`,
                tipo: pool[Math.floor(Math.random() * pool.length)],
                x: 32 + (i * 12) + (Math.random() * 6 - 3),
                y: 44 + Math.random() * 12,
            });
        }

        // Nivel Inferior
        for (let i = 0; i < 6; i++) {
            nuevas.push({
                id: `d3-${i}-${Date.now()}`,
                tipo: pool[Math.floor(Math.random() * pool.length)],
                x: 24 + (i * 10) + (Math.random() * 6 - 3),
                y: 64 + Math.random() * 14,
            });
        }

        setDecorations(nuevas);
    };

    // Colocar adorno al hacer clic en el árbol
    const handleAddDecoration = (x: number, y: number) => {
        if (decorations.length >= 45) {
            alert('Has alcanzado el límite de 45 adornos para que el árbol no quede saturado.');
            return;
        }

        let finalX = x;
        let finalY = y;

        // Si es la estrella de Belén, siempre va en la cima
        if (selectedOrnament === 'estrella') {
            finalX = 50;
            finalY = 11;
            // Remover estrella anterior si ya existe
            setDecorations((prev) => [
                ...prev.filter((d) => d.tipo !== 'estrella'),
                { id: `star-${Date.now()}`, tipo: 'estrella', x: finalX, y: finalY },
            ]);
            return;
        }

        const newDeco: Decoration = {
            id: `deco-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            tipo: selectedOrnament,
            x: finalX,
            y: finalY,
        };

        setDecorations((prev) => [...prev, newDeco]);
    };

    // Quitar adorno
    const handleRemoveDecoration = (id: string) => {
        setDecorations((prev) => prev.filter((d) => d.id !== id));
    };

    // Guardar árbol en backend
    const handleSaveTree = async () => {
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const res = await axios.post('/api/navidad/arbol', {
                decoraciones: decorations,
                mensaje: mensaje.trim() || '¡Feliz Navidad a todo el equipo TIC!',
                luces_activas: lucesActivas,
            });

            if (res.data.success) {
                setSaveSuccess(true);
                setMyTreeId(res.data.tree.id);

                // Actualizar la lista de la galería
                setGalleryTrees((prev) => {
                    const filtered = prev.filter((t) => t.id !== res.data.tree.id);
                    return [res.data.tree, ...filtered];
                });

                setTimeout(() => setSaveSuccess(false), 4500);
            }
        } catch (err: any) {
            console.error('Error guardando el árbol:', err);
            alert('No se pudo guardar tu árbol. Por favor intenta de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    // Reaccionar al árbol de un compañero
    const handleReaccionar = async (treeId: number) => {
        setHeartAnimatingId(treeId);
        setTimeout(() => setHeartAnimatingId(null), 800);

        // Optimistic update
        setGalleryTrees((prev) =>
            prev.map((t) => (t.id === treeId ? { ...t, reacciones_count: (t.reacciones_count || 0) + 1 } : t))
        );

        if (selectedPreviewTree && selectedPreviewTree.id === treeId) {
            setSelectedPreviewTree((prev) =>
                prev ? { ...prev, reacciones_count: (prev.reacciones_count || 0) + 1 } : null
            );
        }

        try {
            await axios.post(`/api/navidad/arbol/${treeId}/reaccionar`);
        } catch (err) {
            console.warn('Error registrando reacción:', err);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
            <div
                className="relative w-full max-w-4xl bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-white rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden flex flex-col my-auto max-h-[92vh]"
                role="dialog"
                aria-modal="true"
            >
                {/* CABECERA FESTIVA */}
                <div className="relative px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-emerald-600 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
                            🎄
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                                    Taller Navideño de Gestores
                                </h2>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    PuntoTIC 2026
                                </span>
                            </div>
                            <p className="text-xs text-slate-300">
                                Decora tu propio árbol, compártelo con la red de sedes y disfruta el de tus compañeros.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Selector de Pestañas */}
                        <div className="bg-slate-800/80 p-1 rounded-xl border border-white/10 flex items-center gap-1 text-xs">
                            <button
                                type="button"
                                onClick={() => setActiveTab('decorar')}
                                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                    activeTab === 'decorar'
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <span>🎨</span>
                                <span>Mi Árbol</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('galeria')}
                                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                                    activeTab === 'galeria'
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <span>🌟</span>
                                <span>Galería ({galleryTrees.length})</span>
                            </button>
                        </div>

                        {/* Botón Cerrar */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                            title="Cerrar juego"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {/* ========================================================= */}
                    {/* TAB 1: MODO DECORAR MI ÁRBOL                             */}
                    {/* ========================================================= */}
                    {activeTab === 'decorar' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Lienzo del Árbol (Izquierda / Centro) */}
                            <div className="lg:col-span-7 flex flex-col items-center">
                                <div className="w-full bg-slate-950/60 rounded-3xl p-4 sm:p-6 border border-emerald-500/20 shadow-inner flex flex-col items-center relative overflow-hidden">
                                    {/* Insignia del Gestor */}
                                    <div className="w-full flex items-center justify-between text-xs mb-2 text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                            <span className="font-bold text-white">{currentUserName || 'Gestor TIC'}</span>
                                            <span className="text-slate-400">· {currentUserPoint || 'Sede Acacías'}</span>
                                        </div>
                                        <div className="text-[11px] font-mono bg-white/10 px-2 py-0.5 rounded-md text-emerald-300 font-bold">
                                            {decorations.length} / 45 adornos
                                        </div>
                                    </div>

                                    {/* ÁRBOL INTERACTIVO */}
                                    <PineTreeCanvas
                                        decorations={decorations}
                                        lucesActivas={lucesActivas}
                                        interactive={true}
                                        onCanvasClick={handleAddDecoration}
                                        onRemoveDecoration={handleRemoveDecoration}
                                        size="normal"
                                    />

                                    {/* Barra de sugerencia inferior */}
                                    <div className="text-[11px] text-slate-400 text-center mt-3">
                                        💡 <span className="text-slate-300 font-medium">Tip:</span> Selecciona un adorno de la paleta y haz clic en las ramas verdes. Haz clic en un adorno colocado para retirarlo.
                                    </div>
                                </div>
                            </div>

                            {/* Panel de Controles y Paleta (Derecha) */}
                            <div className="lg:col-span-5 flex flex-col gap-4">
                                {/* PALETA DE ADORNOS */}
                                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                                            <span>🎁</span>
                                            <span>Paleta de Adornos</span>
                                        </h3>
                                        <span className="text-[10px] text-slate-400">Clic para elegir</span>
                                    </div>

                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2">
                                        {ORNAMENT_TYPES.map((ornament) => {
                                            const isSelected = selectedOrnament === ornament.id;
                                            return (
                                                <button
                                                    key={ornament.id}
                                                    type="button"
                                                    onClick={() => setSelectedOrnament(ornament.id)}
                                                    className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all text-center relative ${
                                                        isSelected
                                                            ? 'bg-amber-400/20 border-2 border-amber-400 scale-105 shadow-md shadow-amber-400/20'
                                                            : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-102'
                                                    }`}
                                                    title={ornament.label}
                                                >
                                                    <span className="text-2xl drop-shadow">{ornament.emoji}</span>
                                                    <span className="text-[10px] leading-tight font-medium text-slate-200 line-clamp-1">
                                                        {ornament.label.split(' ')[0]}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* HERRAMIENTAS RÁPIDAS */}
                                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                            <Sliders className="w-3.5 h-3.5" />
                                            <span>Efectos y Ajustes</span>
                                        </h3>

                                        {/* Toggle Luces */}
                                        <button
                                            type="button"
                                            onClick={() => setLucesActivas(!lucesActivas)}
                                            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                                lucesActivas
                                                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                                                    : 'bg-slate-800 text-slate-400 border border-white/10'
                                            }`}
                                        >
                                            <Lightbulb className={`w-3.5 h-3.5 ${lucesActivas ? 'fill-current' : ''}`} />
                                            <span>{lucesActivas ? 'Luces ON' : 'Luces OFF'}</span>
                                        </button>
                                    </div>

                                    {/* Botones de Acción Rápida */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={generarDisenoSorpresa}
                                            className="px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                            title="Generar distribución armónica automática"
                                        >
                                            <span>🎲</span>
                                            <span>Diseño Sorpresa</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setDecorations([])}
                                            className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                            title="Eliminar todos los adornos colocados"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Limpiar Árbol</span>
                                        </button>
                                    </div>

                                    {/* MENSAJE O DEDICATORIA NAVIDEÑA */}
                                    <div className="flex flex-col gap-1 mt-1">
                                        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Tu Mensaje para los Compañeros Gestores:</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={mensaje}
                                            onChange={(e) => setMensaje(e.target.value)}
                                            maxLength={160}
                                            placeholder="Ej: ¡Feliz Navidad y bendiciones les desea Dinamarca!"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>

                                    {/* BOTÓN GUARDAR MI ÁRBOL */}
                                    <button
                                        type="button"
                                        onClick={handleSaveTree}
                                        disabled={isSaving}
                                        className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Sparkles className="w-4 h-4 animate-spin" />
                                                <span>Guardando Árbol...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span>Guardar y Publicar mi Árbol</span>
                                            </>
                                        )}
                                    </button>

                                    {saveSuccess && (
                                        <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center flex items-center justify-center gap-2 animate-fade-in">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>¡Árbol guardado con éxito! Tus compañeros ya pueden verlo en la galería.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 2: GALERÍA DE GESTORES DE LA RED                      */}
                    {/* ========================================================= */}
                    {activeTab === 'galeria' && (
                        <div className="flex flex-col gap-5">
                            {/* Banner Informativo */}
                            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-amber-950/50 border border-emerald-500/30 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">🎅</span>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">
                                            Galería Navideña de la Red de Puntos Vive Digital & Aulas
                                        </h3>
                                        <p className="text-xs text-slate-300">
                                            Descubre los árboles decorados por cada gestor de Acacías. ¡Haz clic en el corazón para enviarles tus mejores deseos!
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('decorar')}
                                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5 shadow-md"
                                >
                                    <span>🎨</span>
                                    <span>Modificar Mi Árbol</span>
                                </button>
                            </div>

                            {/* Carga o Estado Vacío */}
                            {isLoadingGallery ? (
                                <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
                                    <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
                                    <p className="text-sm">Cargando los árboles de la red municipal...</p>
                                </div>
                            ) : galleryTrees.length === 0 ? (
                                <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3 bg-slate-950/40 rounded-3xl border border-white/5 p-8">
                                    <span className="text-4xl">🎄</span>
                                    <h4 className="text-base font-bold text-white">¡Aún no hay árboles en la galería!</h4>
                                    <p className="text-xs text-slate-300 max-w-sm">
                                        Sé el primer gestor en decorar y guardar tu árbol para que todos tus compañeros lo vean aquí.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('decorar')}
                                        className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                                    >
                                        Empezar a Decorar
                                    </button>
                                </div>
                            ) : (
                                /* GRID DE ÁRBOLES DE GESTORES */
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {galleryTrees.map((tree) => {
                                        const isMine = myTreeId === tree.id;
                                        const isHeartBeating = heartAnimatingId === tree.id;

                                        return (
                                            <div
                                                key={tree.id}
                                                className={`bg-slate-950/70 rounded-3xl border p-4 flex flex-col justify-between transition-all hover:scale-[1.01] hover:shadow-xl ${
                                                    isMine
                                                        ? 'border-emerald-500/60 shadow-emerald-500/10'
                                                        : 'border-white/10 hover:border-emerald-500/30'
                                                }`}
                                            >
                                                {/* Header del Card */}
                                                <div>
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <h4 className="text-xs font-black text-white line-clamp-1">
                                                                    {tree.nombre_gestor}
                                                                </h4>
                                                                {isMine && (
                                                                    <span className="text-[9px] uppercase font-bold bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-md border border-emerald-500/40">
                                                                        Tú
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-emerald-400 font-semibold line-clamp-1">
                                                                {tree.nombre_punto || 'Punto Vive Digital'}
                                                            </p>
                                                        </div>

                                                        {/* Contador de Adornos */}
                                                        <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                                                            {(tree.decoraciones || []).length} adornos
                                                        </span>
                                                    </div>

                                                    {/* Previsualización del Árbol en Miniatura */}
                                                    <div className="bg-slate-900/80 rounded-2xl p-2 border border-white/5 relative overflow-hidden group">
                                                        <PineTreeCanvas
                                                            decorations={tree.decoraciones || []}
                                                            lucesActivas={tree.luces_activas ?? true}
                                                            interactive={false}
                                                            size="mini"
                                                        />

                                                        {/* Botón Ver en Grande al pasar el cursor */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedPreviewTree(tree)}
                                                            className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center gap-1.5 text-xs font-bold text-white transition-opacity"
                                                        >
                                                            <Eye className="w-4 h-4 text-amber-400" />
                                                            <span>Ver en Detalle</span>
                                                        </button>
                                                    </div>

                                                    {/* Mensaje / Dedicatoria */}
                                                    {tree.mensaje && (
                                                        <div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 italic relative">
                                                            <span className="text-amber-400 font-bold not-italic mr-1">“</span>
                                                            {tree.mensaje}
                                                            <span className="text-amber-400 font-bold not-italic ml-1">”</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Footer del Card: Botón de Reacción */}
                                                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={() => tree.id && handleReaccionar(tree.id)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                                            isHeartBeating
                                                                ? 'bg-rose-500 text-white scale-110 shadow-lg shadow-rose-500/40'
                                                                : 'bg-white/10 hover:bg-rose-500/20 text-rose-300 hover:text-white border border-white/10'
                                                        }`}
                                                        title="Enviar un corazón navideño"
                                                    >
                                                        <Heart
                                                            className={`w-3.5 h-3.5 fill-current ${
                                                                isHeartBeating ? 'animate-bounce' : ''
                                                            }`}
                                                        />
                                                        <span>{tree.reacciones_count || 0}</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedPreviewTree(tree)}
                                                        className="text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                                                    >
                                                        <span>Inspeccionar</span>
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* MODAL SECUNDARIO: VISTA DETALLADA DEL ÁRBOL DE UN COMPAÑERO */}
                {selectedPreviewTree && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
                        <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 text-white shadow-2xl flex flex-col items-center">
                            <button
                                type="button"
                                onClick={() => setSelectedPreviewTree(null)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="text-center mb-2">
                                <h3 className="text-base font-black text-white">
                                    {selectedPreviewTree.nombre_gestor}
                                </h3>
                                <p className="text-xs text-emerald-400 font-semibold">
                                    {selectedPreviewTree.nombre_punto || 'Punto Vive Digital'}
                                </p>
                            </div>

                            <div className="w-full bg-slate-950/60 rounded-2xl p-4 border border-white/10 flex items-center justify-center my-2">
                                <PineTreeCanvas
                                    decorations={selectedPreviewTree.decoraciones || []}
                                    lucesActivas={selectedPreviewTree.luces_activas ?? true}
                                    interactive={false}
                                    size="preview"
                                />
                            </div>

                            {selectedPreviewTree.mensaje && (
                                <p className="text-xs text-slate-200 italic text-center px-4 my-2">
                                    “{selectedPreviewTree.mensaje}”
                                </p>
                            )}

                            <div className="mt-3 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => selectedPreviewTree.id && handleReaccionar(selectedPreviewTree.id)}
                                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
                                >
                                    <Heart className="w-4 h-4 fill-current" />
                                    <span>¡Me Encanta! ({selectedPreviewTree.reacciones_count || 0})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPreviewTree(null)}
                                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold"
                                >
                                    Volver a la Galería
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
