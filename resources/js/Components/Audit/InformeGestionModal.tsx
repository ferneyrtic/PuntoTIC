import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Download,
    Printer,
    CheckCircle2,
    Building2,
    Calendar,
    Users,
    FileText,
    DoorOpen,
    ShieldCheck,
    Clock,
    Award,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    rendicion: any;
    currentUser: any;
}

export default function InformeGestionModal({ isOpen, onClose, rendicion, currentUser }: Props) {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || typeof document === 'undefined') return null;

    const {
        periodo,
        gestor_seleccionado,
        kpis,
        desglose_servicios = [],
        franjas_horarias,
        acciones_recientes = [],
    } = rendicion || {};

    const gestorName = gestor_seleccionado?.name || 'Consolidado General de Gestores';
    const gestorDoc = gestor_seleccionado?.documento || 'Varios';
    const gestorCargo = gestor_seleccionado?.cargo || 'Equipo Operativo Red PVD';
    const sedeName = gestor_seleccionado?.nombre_punto || 'Red Municipal de Puntos Vive Digital & Aulas';
    const zonaName = gestor_seleccionado?.zona || 'Urbana / Rural';

    const fechaHoy = new Date().toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    const codigoInforme = `TIC-INF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const handleDownloadPdf = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);
        setDownloadSuccess(false);

        try {
            const pageElements = reportRef.current.querySelectorAll('.a4-page');
            if (!pageElements.length) return;

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < pageElements.length; i++) {
                const pageEl = pageElements[i] as HTMLElement;

                const canvas = await html2canvas(pageEl, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    windowWidth: 850,
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);

                if (i > 0) {
                    pdf.addPage();
                }

                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            }

            const cleanGestor = gestorName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25);
            const fileName = `Informe_Gestion_${cleanGestor}_${periodo?.key || 'periodo'}.pdf`;

            pdf.save(fileName);
            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 4500);
        } catch (err) {
            console.error('Error generando el PDF de gestión:', err);
            alert('Ocurrió un error al compilar el documento en PDF. Intenta de nuevo.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const franjaPico =
        (franjas_horarias?.manana ?? 0) >= (franjas_horarias?.tarde ?? 0)
            ? 'Mañana (07:00 a. m. - 11:59 a. m.)'
            : 'Tarde (12:00 p. m. - 05:59 p. m.)';

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <div
                className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col my-auto max-h-[94vh]"
                role="dialog"
                aria-modal="true"
            >
                {/* BARRA SUPERIOR DE ACCIONES */}
                <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                                    Informe Oficial de Rendición y Gestión Operativa
                                </h3>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    Formato A4
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Documento oficial con firmas de supervisión para cuentas de cobro e informes mensuales.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition-colors flex items-center gap-1.5 border border-slate-700"
                            title="Imprimir documento directamente"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">Imprimir</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={isGenerating}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Compilando PDF...</span>
                                </>
                            ) : downloadSuccess ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                                    <span>¡PDF Descargado!</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    <span>Descargar Archivo PDF</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors ml-1"
                            title="Cerrar vista previa"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* CONTENIDO DEL INFORME (PÁGINAS A4 INDEPENDIENTES) */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 flex flex-col items-center gap-6 custom-scrollbar">
                    <div ref={reportRef} className="flex flex-col items-center gap-6">
                        {/* ========================================================= */}
                        {/* PÁGINA 1: PORTADA INSTITUCIONAL, KPIS Y DESGLOSE          */}
                        {/* ========================================================= */}
                        <div className="a4-page bg-white w-[800px] p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-300 text-slate-900 font-sans shrink-0 flex flex-col justify-between min-h-[1130px]">
                            <div>
                                {/* ENCABEZADO INSTITUCIONAL */}
                                <div className="border-b-2 border-emerald-600 pb-4 mb-6 flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-800/20">
                                            TIC
                                        </div>
                                        <div>
                                            <h1 className="text-base font-black text-slate-900 tracking-tight leading-tight uppercase">
                                                Alcaldía Municipal de Acacías
                                            </h1>
                                            <p className="text-xs font-bold text-emerald-700 tracking-wide uppercase">
                                                Secretaría de las Tecnologías de la Información y las Comunicaciones (TIC)
                                            </p>
                                            <p className="text-[11px] text-slate-500 font-medium">
                                                Red Municipal de Puntos Vive Digital & Aulas Digitales
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right flex flex-col items-end">
                                        <div className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                            {codigoInforme}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1">
                                            Expedición: {fechaHoy}
                                        </div>
                                    </div>
                                </div>

                                {/* TÍTULO DEL DOCUMENTO */}
                                <div className="text-center mb-6">
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-300">
                                        Acta Oficial de Rendición de Cuentas
                                    </span>
                                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-2">
                                        Informe de Gestión y Desempeño Operativo
                                    </h2>
                                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                                        Consolidado probatorio de atenciones, trámites comunitarios y cumplimiento en sede
                                    </p>
                                </div>

                                {/* FICHA TÉCNICA DEL GESTOR RESPONSABLE */}
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6">
                                    <div className="flex items-center gap-2 mb-3 border-b border-slate-200/80 pb-2">
                                        <Award className="w-4 h-4 text-emerald-600" />
                                        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                                            Ficha del Funcionario Responsable
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Nombre del Gestor / Cargo</span>
                                            <span className="font-bold text-slate-900">{gestorName}</span>
                                            <span className="text-[11px] text-emerald-700 block font-medium">{gestorCargo}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Documento de Identidad</span>
                                            <span className="font-bold text-slate-900">{gestorDoc}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Sede Asignada & Zona</span>
                                            <span className="font-bold text-slate-900">{sedeName}</span>
                                            <span className="text-[11px] text-slate-500 block font-medium">Zona {zonaName}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Período Auditado</span>
                                            <span className="font-bold text-slate-900">{periodo?.label}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Rango de Fechas</span>
                                            <span className="font-semibold text-slate-800">
                                                {periodo?.desde_humana} al {periodo?.hasta_humana}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Estado del Punto</span>
                                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                Operativo
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* BLOQUE 1: RESUMEN EJECUTIVO (4 KPIS PRINCIPALES) */}
                                <div className="mb-6">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2.5 flex items-center gap-1.5">
                                        <span>📊</span>
                                        <span>Indicadores Cuantitativos de Desempeño</span>
                                    </h3>

                                    <div className="grid grid-cols-4 gap-3 text-center">
                                        {/* Card 1: Atenciones */}
                                        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs">
                                            <div className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                                                Atenciones Ventanilla
                                            </div>
                                            <div className="text-2xl font-black text-emerald-900 mt-0.5">
                                                {kpis?.total_visitas || 0}
                                            </div>
                                            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                                                Visitas comunitarias
                                            </div>
                                        </div>

                                        {/* Card 2: Nuevos Enrolados */}
                                        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-xs">
                                            <div className="text-[10px] font-extrabold uppercase tracking-wide text-blue-700">
                                                Nuevos Ciudadanos
                                            </div>
                                            <div className="text-2xl font-black text-blue-900 mt-0.5">
                                                {kpis?.total_nuevos_ciudadanos || 0}
                                            </div>
                                            <div className="text-[10px] text-blue-600 font-medium mt-0.5">
                                                Empadronados en BD
                                            </div>
                                        </div>

                                        {/* Card 3: Préstamos de Sala */}
                                        <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 shadow-xs">
                                            <div className="text-[10px] font-extrabold uppercase tracking-wide text-purple-700">
                                                Préstamo de Salas
                                            </div>
                                            <div className="text-2xl font-black text-purple-900 mt-0.5">
                                                {kpis?.total_prestamos || 0}
                                            </div>
                                            <div className="text-[10px] text-purple-600 font-medium mt-0.5">
                                                {kpis?.total_aforo_prestamos || 0} personas aforo
                                            </div>
                                        </div>

                                        {/* Card 4: Impresiones */}
                                        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs">
                                            <div className="text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
                                                Trámites Impresión
                                            </div>
                                            <div className="text-2xl font-black text-amber-900 mt-0.5">
                                                {kpis?.total_impresiones || 0}
                                            </div>
                                            <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                                                {kpis?.total_hojas_impresas || 0} hojas laborales
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* BLOQUE 2: CONSTANCIA OPERATIVA Y CUMPLIMIENTO */}
                                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-6 text-xs">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Días Activos en Sede</span>
                                            <span className="font-bold text-slate-900 text-sm">{kpis?.dias_activos || 0} días</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Promedio Atenciones / Día</span>
                                            <span className="font-bold text-slate-900 text-sm">{kpis?.promedio_diario || 0} visitas/día</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Franja Horaria Pico</span>
                                            <span className="font-bold text-slate-900 text-[11px] leading-tight block">{franjaPico}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* BLOQUE 3: DESGLOSE OPERATIVO POR SERVICIOS */}
                                <div className="mb-6">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2.5 flex items-center gap-1.5">
                                        <span>📋</span>
                                        <span>Distribución de Servicios Atendidos por el Gestor</span>
                                    </h3>

                                    {desglose_servicios.length > 0 ? (
                                        <div className="overflow-hidden border border-slate-200 rounded-xl">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                                                    <tr>
                                                        <th className="py-2.5 px-3">Línea de Servicio / Trámite</th>
                                                        <th className="py-2.5 px-3 text-center">Atenciones</th>
                                                        <th className="py-2.5 px-3 text-right">Participación (%)</th>
                                                        <th className="py-2.5 px-3 w-40">Proporción Visual</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {desglose_servicios.map((s: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                            <td className="py-2 px-3 font-semibold text-slate-800">
                                                                {s.nombre}
                                                            </td>
                                                            <td className="py-2 px-3 text-center font-bold text-slate-900">
                                                                {s.total}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                                                                {s.porcentaje}%
                                                            </td>
                                                            <td className="py-2 px-3">
                                                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full"
                                                                        style={{
                                                                            width: `${Math.min(100, Math.max(5, s.porcentaje))}%`,
                                                                            backgroundColor: s.color || '#059669',
                                                                        }}
                                                                    />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-xl border border-slate-200">
                                            Sin atenciones registradas en el período seleccionado.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* PIE DE PÁGINA 1 */}
                            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                                <span>PuntoTIC · Alcaldía Municipal de Acacías</span>
                                <span>Página 1 de 2</span>
                            </div>
                        </div>

                        {/* ========================================================= */}
                        {/* PÁGINA 2: BITÁCORA PROBATORIA Y FORMALIDAD DE FIRMAS       */}
                        {/* ========================================================= */}
                        <div className="a4-page bg-white w-[800px] p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-300 text-slate-900 font-sans shrink-0 flex flex-col justify-between min-h-[1130px]">
                            <div>
                                {/* CABECERA PÁGINA 2 */}
                                <div className="border-b border-slate-200 pb-2.5 mb-5 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                            Evidencias Probatorias y Legalización del Informe
                                        </h3>
                                        <p className="text-[11px] text-slate-500">
                                            Gestor: <span className="font-bold text-slate-800">{gestorName}</span> · Sede: <span className="font-bold text-slate-800">{sedeName}</span>
                                        </p>
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                        Página 2 de 2
                                    </div>
                                </div>

                                {/* TABLA DE ACCIONES SIGNIFICATIVAS DE EVIDENCIA */}
                                <div className="mb-8">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
                                        <span>📝</span>
                                        <span>Bitácora de Acciones Clave Registradas en el Sistema</span>
                                    </h4>

                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                                                <tr>
                                                    <th className="py-2 px-3">Fecha / Hora</th>
                                                    <th className="py-2 px-3">Operación</th>
                                                    <th className="py-2 px-3">Descripción de la Gestión Comunitaria</th>
                                                    <th className="py-2 px-3 text-right">Sede</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {acciones_recientes.slice(0, 10).map((acc: any, i: number) => (
                                                    <tr key={i} className="hover:bg-slate-50/50">
                                                        <td className="py-2 px-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                                                            {acc.fecha_hora}
                                                        </td>
                                                        <td className="py-2 px-3 whitespace-nowrap">
                                                            <span
                                                                className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                                                    acc.color === 'emerald'
                                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                                        : acc.color === 'blue'
                                                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                                                        : acc.color === 'purple'
                                                                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                                                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                                                }`}
                                                            >
                                                                {acc.titulo}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-3 text-slate-700 text-[11px] leading-snug">
                                                            {acc.detalle}
                                                        </td>
                                                        <td className="py-2 px-3 text-right font-medium text-slate-500 text-[11px] whitespace-nowrap">
                                                            {acc.sede}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 italic">
                                        * Registro trazado automáticamente por el subsistema de auditoría de PuntoTIC con sello de tiempo e IP.
                                    </p>
                                </div>

                                {/* DECLARACIÓN DE CUMPLIMIENTO */}
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed mb-10">
                                    <h4 className="text-[11px] font-bold uppercase text-slate-800 mb-1">
                                        Declaración y Certificación de Cumplimiento
                                    </h4>
                                    <p className="text-[11px] text-slate-600">
                                        El presente informe certifica que el funcionario / contratista identificado en la ficha técnica ha cumplido a cabalidad con las actividades de atención ciudadana, dinamización tecnológica, préstamo de salas comunitarias y custodia del Punto Vive Digital asignado por la Alcaldía Municipal de Acacías durante el período reportado, acorde con los lineamientos del convenio y supervisión TIC.
                                    </p>
                                </div>

                                {/* SECCIÓN DE FIRMAS DE LEGALIZACIÓN */}
                                <div className="grid grid-cols-2 gap-10 mt-12 pt-4">
                                    {/* FIRMA GESTOR */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-56 border-b-2 border-slate-700 mb-2"></div>
                                        <span className="text-xs font-black text-slate-900 uppercase">
                                            {gestorName}
                                        </span>
                                        <span className="text-[11px] text-slate-600 font-medium">
                                            C.C. {gestorDoc}
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-800 uppercase mt-0.5">
                                            Gestor Operativo Responsable
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {sedeName}
                                        </span>
                                    </div>

                                    {/* FIRMA SUPERVISOR */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-56 border-b-2 border-slate-700 mb-2"></div>
                                        <span className="text-xs font-black text-slate-900 uppercase">
                                            {currentUser?.name || 'Administrador General TIC'}
                                        </span>
                                        <span className="text-[11px] text-slate-600 font-medium">
                                            Secretaría de las TIC
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-800 uppercase mt-0.5">
                                            Supervisor del Contrato / Administrador
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            Alcaldía Municipal de Acacías
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* PIE DE PÁGINA 2 */}
                            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                                <span>PuntoTIC · Sistema de Auditoría y Trazabilidad Municipal</span>
                                <span>Página 2 de 2</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
