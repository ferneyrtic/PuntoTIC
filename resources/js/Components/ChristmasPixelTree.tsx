import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface Props {
    enabled?: boolean;
}

export default function ChristmasPixelTree({ enabled = true }: Props) {
    const [minimized, setMinimized] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    if (!enabled) return null;

    if (minimized) {
        return (
            <button
                type="button"
                onClick={() => setMinimized(false)}
                className="fixed bottom-4 right-4 z-20 hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900/90 text-white border border-slate-700 shadow-xl hover:scale-105 transition-all text-xs font-bold group"
                title="Mostrar Árbol Navideño"
            >
                <span className="text-base animate-bounce">🎁</span>
                <span className="text-[10px] text-emerald-400 group-hover:underline">Navidad</span>
            </button>
        );
    }

    return (
        <div
            className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 hidden md:flex flex-col items-end select-none pointer-events-auto transition-all"
            style={{
                // Auto hide if zoom causes vertical space to drop below 550px
                maxHeight: 'calc(100vh - 100px)',
            }}
        >
            {/* Tooltip Balloon on Hover */}
            {showTooltip && (
                <div className="mb-2 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-xl shadow-2xl border border-slate-700/80 animate-fade-in flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>¡Felices Fiestas en la Red de PVD Acacías!</span>
                </div>
            )}

            <div
                className="relative bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {/* Minimize Button */}
                <button
                    type="button"
                    onClick={() => setMinimized(true)}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors text-[10px]"
                    title="Minimizar adorno"
                    aria-label="Minimizar árbol navideño"
                >
                    <X className="w-3 h-3" />
                </button>

                {/* 8-Bit Pixel Art Christmas Tree & Gifts SVG with crispEdges */}
                <svg
                    width="112"
                    height="132"
                    viewBox="0 0 28 33"
                    className="overflow-visible"
                    style={{ shapeRendering: 'crispEdges' }}
                >
                    {/* STAR ON TOP (Golden yellow & amber) */}
                    <rect x="13" y="0" width="2" height="1" fill="#FACC15" />
                    <rect x="12" y="1" width="4" height="2" fill="#EAB308" />
                    <rect x="11" y="2" width="6" height="1" fill="#FACC15" />
                    <rect x="13" y="1" width="2" height="1" fill="#FEF08A" />
                    <rect x="10" y="3" width="8" height="1" fill="#EAB308" />
                    <rect x="12" y="4" width="4" height="1" fill="#FACC15" />

                    {/* TREE TIER 1 (Top cone) */}
                    <rect x="13" y="5" width="2" height="1" fill="#15803D" />
                    <rect x="12" y="6" width="4" height="1" fill="#16A34A" />
                    <rect x="11" y="7" width="6" height="1" fill="#15803D" />
                    <rect x="10" y="8" width="8" height="1" fill="#16A34A" />
                    <rect x="9" y="9" width="10" height="1" fill="#15803D" />
                    {/* Tier 1 snow tips & bauble */}
                    <rect x="9" y="9" width="1" height="1" fill="#E0F2FE" />
                    <rect x="18" y="9" width="1" height="1" fill="#E0F2FE" />
                    <rect x="13" y="7" width="2" height="1" fill="#EF4444" className="animate-pulse" />

                    {/* TREE TIER 2 (Middle cone) */}
                    <rect x="11" y="10" width="6" height="1" fill="#166534" />
                    <rect x="10" y="11" width="8" height="1" fill="#16A34A" />
                    <rect x="9" y="12" width="10" height="1" fill="#15803D" />
                    <rect x="8" y="13" width="12" height="1" fill="#16A34A" />
                    <rect x="7" y="14" width="14" height="1" fill="#15803D" />
                    <rect x="6" y="15" width="16" height="1" fill="#166534" />
                    {/* Tier 2 snow tips & ornaments */}
                    <rect x="6" y="15" width="2" height="1" fill="#BAE6FD" />
                    <rect x="20" y="15" width="2" height="1" fill="#BAE6FD" />
                    <rect x="10" y="13" width="1" height="1" fill="#F59E0B" />
                    <rect x="16" y="12" width="1" height="1" fill="#06B6D4" />
                    <rect x="13" y="14" width="2" height="1" fill="#EC4899" />

                    {/* TREE TIER 3 (Base wide cone) */}
                    <rect x="9" y="16" width="10" height="1" fill="#166534" />
                    <rect x="8" y="17" width="12" height="1" fill="#16A34A" />
                    <rect x="7" y="18" width="14" height="1" fill="#15803D" />
                    <rect x="6" y="19" width="16" height="1" fill="#16A34A" />
                    <rect x="5" y="20" width="18" height="1" fill="#15803D" />
                    <rect x="4" y="21" width="20" height="1" fill="#166534" />
                    <rect x="3" y="22" width="22" height="1" fill="#14532D" />
                    {/* Tier 3 snow rim & ornaments */}
                    <rect x="3" y="22" width="3" height="1" fill="#E0F2FE" />
                    <rect x="22" y="22" width="3" height="1" fill="#E0F2FE" />
                    <rect x="8" y="19" width="1" height="1" fill="#EF4444" />
                    <rect x="12" y="21" width="1" height="1" fill="#FACC15" />
                    <rect x="15" y="18" width="1" height="1" fill="#A855F7" />
                    <rect x="18" y="20" width="1" height="1" fill="#0EA5E9" />

                    {/* TREE TRUNK (Brown wood) */}
                    <rect x="12" y="23" width="4" height="4" fill="#78350F" />
                    <rect x="13" y="23" width="2" height="4" fill="#92400E" />

                    {/* PIXEL GIFTS UNDER THE TREE */}
                    {/* Gift 1 (Left - Crimson Red box with Gold Ribbon) */}
                    <rect x="4" y="24" width="7" height="6" fill="#DC2626" />
                    {/* Ribbon */}
                    <rect x="7" y="24" width="1" height="6" fill="#FBBF24" />
                    <rect x="4" y="26" width="7" height="1" fill="#FBBF24" />
                    {/* Bow on top */}
                    <rect x="6" y="23" width="3" height="1" fill="#F59E0B" />

                    {/* Gift 2 (Right - Royal Blue box with White Ribbon) */}
                    <rect x="17" y="24" width="7" height="6" fill="#0284C7" />
                    {/* Ribbon */}
                    <rect x="20" y="24" width="1" height="6" fill="#FFFFFF" />
                    <rect x="17" y="26" width="7" height="1" fill="#FFFFFF" />
                    {/* Bow on top */}
                    <rect x="19" y="23" width="3" height="1" fill="#E0F2FE" />

                    {/* Gift 3 (Front Center - Emerald Green box with Pink Ribbon) */}
                    <rect x="10" y="27" width="8" height="4" fill="#059669" />
                    {/* Ribbon */}
                    <rect x="13" y="27" width="2" height="4" fill="#FB7185" />
                    <rect x="10" y="28" width="8" height="1" fill="#FB7185" />
                    {/* Bow on top */}
                    <rect x="12" y="26" width="4" height="1" fill="#F43F5E" />

                    {/* SNOW BASE LAYER */}
                    <rect x="2" y="31" width="24" height="2" fill="#BAE6FD" rx="1" />
                    <rect x="1" y="32" width="26" height="1" fill="#E0F2FE" />
                </svg>

                {/* Subtitle Label */}
                <div className="text-center mt-1.5 text-[10px] font-black text-emerald-800 tracking-wider uppercase font-mono">
                    PuntoTIC · 2026
                </div>
            </div>
        </div>
    );
}
