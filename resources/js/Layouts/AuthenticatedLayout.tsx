import React, { useState, PropsWithChildren, ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    UserPlus,
    Users,
    CalendarCheck,
    DoorOpen,
    Printer,
    FileSpreadsheet,
    Layers,
    SlidersHorizontal,
    Settings,
    LogOut,
    Menu,
    X,
    Building2,
    CheckCircle2,
    AlertCircle,
    MapPin,
} from 'lucide-react';

interface Props {
    header?: ReactNode;
}

export default function AuthenticatedLayout({ header, children }: PropsWithChildren<Props>) {
    const { auth, flash, points, selectedPointId } = usePage<any>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = auth?.user;

    const currentUrl = window.location.pathname;

    const navItems = [
        { name: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard, active: currentUrl === '/dashboard' || currentUrl === '/' },
        { name: 'Registrar Visita', href: route('visitas.create'), icon: UserPlus, active: currentUrl === '/visitas/create' },
        { name: 'Registro de Visitas', href: route('visitas.index'), icon: CalendarCheck, active: currentUrl === '/visitas' },
        { name: 'Directorio Ciudadanos', href: route('ciudadanos.index'), icon: Users, active: currentUrl.startsWith('/ciudadanos') },
        { name: 'Préstamo de Salas', href: route('prestamos.index'), icon: DoorOpen, active: currentUrl.startsWith('/prestamos') },
        { name: 'Impresiones y Copias', href: route('impresiones.index'), icon: Printer, active: currentUrl.startsWith('/impresiones') },
        { name: 'Exportar Reportes', href: route('exportar.index'), icon: FileSpreadsheet, active: currentUrl.startsWith('/exportar') },
        { name: 'Categorías y Servicios', href: route('categorias.index'), icon: Layers, active: currentUrl.startsWith('/categorias') },
        { name: 'Campos Dinámicos', href: route('campos-dinamicos.index'), icon: SlidersHorizontal, active: currentUrl.startsWith('/campos-dinamicos') },
        { name: 'Configuración y Auditoría', href: route('configuracion.index'), icon: Settings, active: currentUrl.startsWith('/configuracion') },
    ];

    const currentPointName = points?.find((p: any) => p.id_punto === (selectedPointId || user?.id_punto))?.nombre_punto || 'Punto Vive Digital';

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
            {/* Mobile Header */}
            <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                    <div className="bg-white/95 p-1 rounded-lg shadow-sm">
                        <img src="/images/logo_alcaldia.png" alt="Logo Alcaldía" className="h-7 w-auto object-contain" />
                    </div>
                    <div>
                        <div className="text-sm font-black leading-tight flex items-center gap-1.5 text-white">
                            <span>PuntoTIC</span>
                            <span className="text-[9px] font-bold text-alcaldia-yellow uppercase tracking-wider">Acacías</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">Plataforma Digital Municipal</div>
                    </div>
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                    {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-950 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full md:static'
                }`}
            >
                {/* Brand Header */}
                <div className="p-4 border-b border-slate-800/80 bg-slate-900/60">
                    <div className="flex flex-col gap-2.5">
                        <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-white/20 flex items-center justify-center">
                            <img
                                src="/images/logo_alcaldia.png"
                                alt="Alcaldía de Acacías"
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                        <div className="px-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-black text-white tracking-wider">PuntoTIC</span>
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-alcaldia-green text-white tracking-widest border border-alcaldia-green-light/40">v2.0</span>
                            </div>
                            <div className="text-[11px] font-bold text-alcaldia-yellow tracking-wide mt-0.5">
                                Plataforma de Puntos y Aulas Digitales
                            </div>
                        </div>
                    </div>

                    {/* Sede Badge */}
                    <div className="mt-4 p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-alcaldia-green shrink-0" />
                        <div className="min-w-0">
                            <div className="text-[10px] text-slate-400 font-medium">Sede activa</div>
                            <div className="text-xs font-bold text-slate-200 truncate">{currentPointName}</div>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Módulos del Sistema</div>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                                    item.active
                                        ? 'bg-alcaldia-green text-white shadow-md shadow-alcaldia-green/20'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${item.active ? 'text-white' : 'text-slate-400'}`} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-alcaldia-green text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-800 shrink-0">
                            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Usuario'}</div>
                            <div className="text-[11px] text-slate-400 truncate">{user?.cargo || 'Coordinador PVD'}</div>
                        </div>
                    </div>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Cerrar sesión"
                    >
                        <LogOut className="w-4 h-4" />
                    </Link>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-6 py-3.5 flex items-center justify-between">
                    <div>{header}</div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('visitas.create')}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-alcaldia-green hover:bg-alcaldia-green-dark text-white text-xs font-bold shadow-sm transition-all"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>+ Registrar Visita</span>
                        </Link>
                    </div>
                </header>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2 shadow-sm animate-fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2 shadow-sm">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
            </div>
        </div>
    );
}
