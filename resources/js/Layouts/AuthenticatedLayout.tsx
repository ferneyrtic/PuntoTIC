import React, { useState, useEffect, PropsWithChildren, ReactNode } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
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
    CheckCircle2,
    AlertCircle,
    MapPin,
    Calendar,
    Search,
    Download,
} from 'lucide-react';
import PwaStatusBanner from '@/Components/PwaStatusBanner';
import { promptPwaInstall, isPwaStandalone } from '@/services/pwaService';

interface Props {
    header?: ReactNode;
}

export default function AuthenticatedLayout({ header, children }: PropsWithChildren<Props>) {
    const { auth, flash, points, selectedPointId } = usePage<any>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dismissFlash, setDismissFlash] = useState(false);
    const [quickSearch, setQuickSearch] = useState('');
    const [canInstallApp, setCanInstallApp] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const user = auth?.user;

    const currentUrl = window.location.pathname;

    useEffect(() => {
        setIsInstalled(isPwaStandalone());
        const handleInstallable = (e: any) => {
            setCanInstallApp(e.detail?.available ?? true);
        };
        const handleInstalled = () => {
            setCanInstallApp(false);
            setIsInstalled(true);
        };
        window.addEventListener('pwa-installable', handleInstallable);
        window.addEventListener('pwa-installed', handleInstalled);
        return () => {
            window.removeEventListener('pwa-installable', handleInstallable);
            window.removeEventListener('pwa-installed', handleInstalled);
        };
    }, []);

    useEffect(() => {
        setDismissFlash(false);
    }, [flash]);

    // Keyboard shortcut for search (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSidebarOpen(false);
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('topbar-quick-search');
                if (searchInput) searchInput.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (quickSearch.trim()) {
            router.get(route('ciudadanos.index'), { search: quickSearch });
        }
    };

    // Formatted date in Spanish
    const currentDateFormatted = new Intl.DateTimeFormat('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date());

    const navSections = [
        {
            title: 'Operación Principal',
            items: [
                {
                    name: 'Panel de Control',
                    href: route('dashboard'),
                    icon: LayoutDashboard,
                    active: currentUrl === '/dashboard' || currentUrl === '/',
                },
                {
                    name: 'Registrar Visita',
                    href: route('visitas.create'),
                    icon: UserPlus,
                    active: currentUrl === '/visitas/create',
                },
                {
                    name: 'Historial de Visitas',
                    href: route('visitas.index'),
                    icon: CalendarCheck,
                    active: currentUrl === '/visitas' || (currentUrl.startsWith('/visitas') && currentUrl !== '/visitas/create'),
                },
                {
                    name: 'Directorio Ciudadano',
                    href: route('ciudadanos.index'),
                    icon: Users,
                    active: currentUrl.startsWith('/ciudadanos'),
                },
            ],
        },
        {
            title: 'Servicios en Sala',
            items: [
                {
                    name: 'Préstamo de Salas',
                    href: route('prestamos.index'),
                    icon: DoorOpen,
                    active: currentUrl.startsWith('/prestamos'),
                },
                {
                    name: 'Impresiones y Copias',
                    href: route('impresiones.index'),
                    icon: Printer,
                    active: currentUrl.startsWith('/impresiones'),
                },
            ],
        },
        {
            title: 'Administración y Datos',
            items: [
                {
                    name: 'Exportar Reportes',
                    href: route('exportar.index'),
                    icon: FileSpreadsheet,
                    active: currentUrl.startsWith('/exportar'),
                },
                {
                    name: 'Categorías y Servicios',
                    href: route('categorias.index'),
                    icon: Layers,
                    active: currentUrl.startsWith('/categorias'),
                },
                {
                    name: 'Campos Dinámicos',
                    href: route('campos-dinamicos.index'),
                    icon: SlidersHorizontal,
                    active: currentUrl.startsWith('/campos-dinamicos'),
                },
                {
                    name: 'Configuración y Auditoría',
                    href: route('configuracion.index'),
                    icon: Settings,
                    active: currentUrl.startsWith('/configuracion'),
                },
            ],
        },
    ];

    const currentPointName =
        points?.find((p: any) => p.id_punto === (selectedPointId || user?.id_punto))?.nombre_punto ||
        'Punto Vive Digital';

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row font-sans selection:bg-emerald-600 selection:text-white">
            {/* Mobile Header */}
            <header className="md:hidden bg-slate-950 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800/80">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="btn-tactile p-2 rounded-xl bg-slate-900 text-slate-200 hover:text-white border border-slate-800"
                        aria-label="Abrir menú"
                    >
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <div className="bg-white px-2.5 py-1 rounded-xl shadow-xs flex items-center justify-center">
                        <img
                            src="/images/logo_alcaldia.png"
                            alt="Logo Alcaldía"
                            className="h-8 w-auto max-w-[130px] object-contain"
                        />
                    </div>
                    <div>
                        <div className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                            <span>PuntoTIC</span>
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                Acacías
                            </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {currentPointName}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={route('visitas.create')}
                        className="btn-tactile p-2 rounded-xl bg-emerald-600 text-white shadow-sm"
                        title="Registrar Visita"
                    >
                        <UserPlus className="w-4 h-4" />
                    </Link>
                </div>
            </header>

            {/* Sidebar (Desktop Permanent, Mobile Slide-out Drawer) */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0B132B] text-slate-300 flex flex-col border-r border-slate-800/60 shadow-xl transition-all duration-300 ease-out md:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full md:static'
                }`}
            >
                {/* Brand Header - High Prominence Institutional Logo */}
                <div className="p-4 border-b border-slate-800/60 bg-slate-950/40">
                    {/* Official Banner Card: Full-width container giving maximum visibility to the logo */}
                    <div className="bg-white rounded-2xl px-3.5 py-3 shadow-md border border-white/10 flex items-center justify-center mb-3 group transition-all duration-200 hover:shadow-lg">
                        <img
                            src="/images/logo_alcaldia.png"
                            alt="Alcaldía de Acacías"
                            className="h-11 w-full object-contain"
                        />
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <div>
                            <div className="text-base font-black text-white tracking-tight flex items-center gap-1.5 leading-tight">
                                <span>PuntoTIC</span>
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                                    Acacías
                                </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium truncate mt-1">
                                Red de Puntos Vive Digital
                            </div>
                        </div>

                        {/* Mobile close button inside drawer */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                            aria-label="Cerrar menú"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation Sections */}
                <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
                    {navSections.map((section) => (
                        <div key={section.title} className="space-y-1">
                            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {section.title}
                            </div>
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`btn-tactile group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                                            item.active
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                                                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/70'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Icon
                                                className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                                                    item.active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                                                }`}
                                            />
                                            <span className="truncate">{item.name}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* PWA Install Action in Sidebar */}
                {canInstallApp && !isInstalled && (
                    <div className="px-3.5 pb-2">
                        <button
                            onClick={() => promptPwaInstall()}
                            className="btn-tactile w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-700/60 hover:bg-emerald-600 text-white text-xs font-bold border border-emerald-500/40 shadow-xs transition-all"
                        >
                            <Download className="w-4 h-4 text-emerald-300" />
                            <span>Instalar App PuntoTIC</span>
                        </button>
                    </div>
                )}

                {/* User Footer Profile */}
                <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60">
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800/60">
                        <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'TIC'}
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-100 truncate">
                                    {user?.name || 'Funcionario TIC'}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                    {user?.cargo || 'Operador PVD'}
                                </div>
                            </div>
                        </div>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="btn-tactile p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Cerrar sesión"
                        >
                            <LogOut className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Mobile Drawer Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
                {/* Modern Command Topbar */}
                <header className="bg-white sticky top-0 z-20 px-4 md:px-8 py-2.5 flex items-center justify-between border-b border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Institutional Brand Badge in Topbar */}
                        <div className="hidden sm:flex items-center gap-2.5 pr-3 border-r border-slate-200">
                            <img
                                src="/images/escudo_acacias.png"
                                alt="Escudo Alcaldía de Acacías"
                                className="h-7 w-auto object-contain"
                            />
                            <div className="leading-tight">
                                <span className="text-xs font-black text-slate-900 tracking-tight block">Alcaldía de Acacías</span>
                                <span className="text-[10px] text-emerald-700 font-bold tracking-wide">Puntos Vive Digital</span>
                            </div>
                        </div>

                        {/* Active Sede Badge positioned elegantly in the Topbar */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate max-w-[200px] sm:max-w-xs">{currentPointName}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Quick Search Shortcut Bar */}
                        <form onSubmit={handleSearchSubmit} className="hidden md:block relative w-56 lg:w-72">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                id="topbar-quick-search"
                                type="text"
                                placeholder="Buscar ciudadano o CC..."
                                value={quickSearch}
                                onChange={(e) => setQuickSearch(e.target.value)}
                                className="w-full pl-9 pr-14 py-2 rounded-xl bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                            />
                            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-white border border-slate-200 text-slate-400 pointer-events-none">
                                ⌘K
                            </kbd>
                        </form>

                        {/* Calendar Date Badge */}
                        <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span className="capitalize">{currentDateFormatted}</span>
                        </div>

                        {/* Direct Action */}
                        <Link
                            href={route('visitas.create')}
                            className="btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Registrar Visita</span>
                            <span className="sm:hidden">+ Visita</span>
                        </Link>
                    </div>
                </header>

                {/* PWA Connectivity & Synchronization Status Banner */}
                <PwaStatusBanner />

                {/* Animated Flash Toast Alerts */}
                {flash?.success && !dismissFlash && (
                    <div className="mx-4 md:mx-8 mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center justify-between gap-3 shadow-sm animate-fade-in-down">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold">{flash.success}</span>
                        </div>
                        <button
                            onClick={() => setDismissFlash(true)}
                            className="btn-tactile p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100/60 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {flash?.error && !dismissFlash && (
                    <div className="mx-4 md:mx-8 mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-medium flex items-center justify-between gap-3 shadow-sm animate-fade-in-down">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold">{flash.error}</span>
                        </div>
                        <button
                            onClick={() => setDismissFlash(true)}
                            className="btn-tactile p-1.5 rounded-lg text-rose-700 hover:bg-rose-100/60 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Page Content Container */}
                <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
                    {header && (
                        <div className="animate-fade-in">
                            {header}
                        </div>
                    )}
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Thumb Navigation Bar */}
            <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 z-30 px-3 py-2 flex items-center justify-around shadow-xl">
                <Link
                    href={route('dashboard')}
                    className={`btn-tactile flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold ${
                        currentUrl === '/dashboard' || currentUrl === '/'
                            ? 'text-emerald-700'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Panel</span>
                </Link>

                <Link
                    href={route('visitas.index')}
                    className={`btn-tactile flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold ${
                        currentUrl === '/visitas'
                            ? 'text-emerald-700'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <CalendarCheck className="w-5 h-5" />
                    <span>Visitas</span>
                </Link>

                <Link
                    href={route('visitas.create')}
                    className="btn-tactile -mt-5 flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-700/30 ring-4 ring-white"
                    title="Registrar Visita"
                >
                    <UserPlus className="w-5 h-5" />
                </Link>

                <Link
                    href={route('ciudadanos.index')}
                    className={`btn-tactile flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold ${
                        currentUrl.startsWith('/ciudadanos')
                            ? 'text-emerald-700'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Users className="w-5 h-5" />
                    <span>Ciudadanos</span>
                </Link>

                <button
                    onClick={() => setSidebarOpen(true)}
                    className="btn-tactile flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-800"
                >
                    <Menu className="w-5 h-5" />
                    <span>Más</span>
                </button>
            </div>
        </div>
    );
}
