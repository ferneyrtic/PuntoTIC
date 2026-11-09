<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Point;
use App\Models\RoomLoan;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortalController extends Controller
{
    /**
     * Muestra la Landing Page y Portal de Bienvenida para Ciudadanos.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Asegurar que el usuario tenga vinculada su ficha de ciudadano si tiene cédula
        if (! $user->id_form_pvd && $user->documento) {
            $user->vincularConCiudadano();
            $user->refresh();
        }

        $idCitizen = $user->id_form_pvd;

        // Historial de solicitudes de sala realizadas por el ciudadano
        $solicitudes = RoomLoan::with('punto')
            ->when($idCitizen, fn ($q) => $q->where('id_form_pvd', $idCitizen))
            ->when(! $idCitizen, fn ($q) => $q->where('nombre_responsable_texto', $user->name))
            ->latest('fecha_prestamo')
            ->paginate(6)
            ->withQueryString();

        // Historial de visitas presenciales registradas a su nombre en la red PVD
        $visitas = $idCitizen
            ? Visit::with(['punto', 'categoria'])
                ->where('id_form_pvd', $idCitizen)
                ->latest('created_at')
                ->limit(6)
                ->get()
            : collect([]);

        // Estadísticas personales del ciudadano
        $totalSolicitudes = RoomLoan::when($idCitizen, fn ($q) => $q->where('id_form_pvd', $idCitizen))
            ->when(! $idCitizen, fn ($q) => $q->where('nombre_responsable_texto', $user->name))
            ->count();

        $solicitudesPendientes = RoomLoan::when($idCitizen, fn ($q) => $q->where('id_form_pvd', $idCitizen))
            ->when(! $idCitizen, fn ($q) => $q->where('nombre_responsable_texto', $user->name))
            ->where('estado', 'Pendiente')
            ->count();

        $solicitudesAprobadas = RoomLoan::when($idCitizen, fn ($q) => $q->where('id_form_pvd', $idCitizen))
            ->when(! $idCitizen, fn ($q) => $q->where('nombre_responsable_texto', $user->name))
            ->where('estado', 'Reservado')
            ->count();

        $totalVisitas = $idCitizen ? Visit::where('id_form_pvd', $idCitizen)->count() : 0;

        $puntos = Point::where('activo', true)
            ->get(['id_punto', 'nombre_punto', 'direccion', 'barrio_vereda', 'zona', 'telefono']);

        // Calendario mensual interactivo de ocupación y disponibilidad para el ciudadano
        $selectedMonth = $request->get('mes', now()->format('Y-m'));
        try {
            $monthCarbon = Carbon::createFromFormat('Y-m', $selectedMonth);
        } catch (\Exception $e) {
            $monthCarbon = now();
            $selectedMonth = now()->format('Y-m');
        }

        $monthStart = $monthCarbon->copy()->startOfMonth()->subDays(7)->toDateString();
        $monthEnd = $monthCarbon->copy()->endOfMonth()->addDays(7)->toDateString();

        $selectedPunto = $request->get('id_punto');

        $calendarLoans = RoomLoan::with('punto:id_punto,nombre_punto')
            ->whereBetween('fecha_prestamo', [$monthStart, $monthEnd])
            ->whereIn('estado', ['Pendiente', 'Reservado', 'En curso'])
            ->when($selectedPunto, fn ($q, $p) => $q->where('id_punto', $p))
            ->get([
                'id_prestamo',
                'id_punto',
                'id_form_pvd',
                'tipo_actividad',
                'fecha_prestamo',
                'hora_inicio',
                'hora_fin',
                'estado',
                'num_asistentes',
            ]);

        return Inertia::render('Portal/Index', [
            'ciudadano' => $user->ciudadano,
            'stats' => [
                'total_solicitudes' => $totalSolicitudes,
                'solicitudes_pendientes' => $solicitudesPendientes,
                'solicitudes_aprobadas' => $solicitudesAprobadas,
                'total_visitas' => $totalVisitas,
            ],
            'solicitudes' => $solicitudes,
            'visitas' => $visitas,
            'puntos' => $puntos,
            'calendarLoans' => $calendarLoans,
            'selectedMonth' => $selectedMonth,
            'selectedPunto' => $selectedPunto ? (int) $selectedPunto : null,
            'soporte' => [
                'telefono' => 'XXX-XXXX',
                'whatsapp' => '+57 321 361 8632',
                'correo' => 'xxx@acacias.gov.co',
                'horario' => 'Lunes a Viernes: 8:00 AM - 12:00 M y 2:00 PM - 6:00 PM',
                'direccion' => 'Carrera 15 # 13-30, Alcaldía Municipal de Acacías, Meta',
            ],
        ]);
    }

    /**
     * Consulta la disponibilidad en tiempo real para una sede y fecha específica.
     */
    public function disponibilidad(Request $request): JsonResponse
    {
        $request->validate([
            'id_punto' => ['required', 'exists:puntos_vd,id_punto'],
            'fecha' => ['required', 'date'],
        ]);

        $prestamos = RoomLoan::where('id_punto', $request->id_punto)
            ->whereDate('fecha_prestamo', $request->fecha)
            ->whereIn('estado', ['Pendiente', 'Reservado', 'En curso'])
            ->orderBy('hora_inicio')
            ->get(['id_prestamo', 'hora_inicio', 'hora_fin', 'tipo_actividad', 'estado']);

        return response()->json([
            'fecha' => $request->fecha,
            'id_punto' => (int) $request->id_punto,
            'ocupados' => $prestamos,
        ]);
    }

    /**
     * Radicación de nueva solicitud de espacio por parte del ciudadano.
     */
    public function solicitarSala(Request $request): RedirectResponse
    {
        $user = $request->user();

        // Vincular con ciudadano si aún no lo está
        if (! $user->id_form_pvd && $user->documento) {
            $user->vincularConCiudadano();
            $user->refresh();
        }

        $validated = $request->validate([
            'id_punto' => ['required', 'exists:puntos_vd,id_punto'],
            'tipo_actividad' => ['required', 'string', 'max:150'],
            'num_asistentes' => ['required', 'integer', 'min:1', 'max:300'],
            'fecha_prestamo' => ['required', 'date', 'after_or_equal:today'],
            'hora_inicio' => ['required', 'date_format:H:i'],
            'hora_fin' => ['required', 'date_format:H:i', 'after:hora_inicio'],
            'motivo' => ['required', 'string', 'min:5', 'max:1000'],
        ], [
            'fecha_prestamo.after_or_equal' => 'La fecha de la solicitud no puede ser anterior al día de hoy.',
            'hora_fin.after' => 'La hora final debe ser posterior a la hora de inicio.',
            'motivo.min' => 'Por favor describe con más detalle para qué requieres el espacio.',
        ]);

        // Verificar disponibilidad (Overlap check)
        $solape = RoomLoan::where('id_punto', $validated['id_punto'])
            ->whereDate('fecha_prestamo', $validated['fecha_prestamo'])
            ->whereIn('estado', ['Pendiente', 'Reservado', 'En curso'])
            ->where(function ($q) use ($validated) {
                $inicio = $validated['hora_inicio'];
                $fin = $validated['hora_fin'];
                $q->where(function ($sub) use ($inicio, $fin) {
                    $sub->where('hora_inicio', '<', $fin)
                        ->where('hora_fin', '>', $inicio);
                });
            })
            ->exists();

        if ($solape) {
            return back()->withErrors([
                'hora_inicio' => 'El horario seleccionado entra en conflicto con un préstamo ya reservado u ocupado en esta sede. Por favor elige otro horario o punto.',
            ]);
        }

        $loan = RoomLoan::create([
            'id_form_pvd' => $user->id_form_pvd,
            'nombre_responsable_texto' => $user->name,
            'id_punto' => $validated['id_punto'],
            'id_gestor' => null, // Pendiente de confirmación del gestor
            'tipo_actividad' => $validated['tipo_actividad'],
            'num_asistentes' => $validated['num_asistentes'],
            'fecha_prestamo' => $validated['fecha_prestamo'],
            'hora_inicio' => $validated['hora_inicio'],
            'hora_fin' => $validated['hora_fin'],
            'observaciones' => $validated['motivo'],
            'estado' => 'Pendiente',
        ]);

        AuditLog::registrar(
            accion: 'SOLICITUD_SALA_CIUDADANO',
            modulo: 'prestamos',
            registroId: (string) $loan->id_prestamo,
            antiguos: null,
            nuevos: [
                'usuario' => $user->name,
                'cedula' => $user->documento,
                'punto' => $validated['id_punto'],
                'fecha' => $validated['fecha_prestamo'],
                'horario' => "{$validated['hora_inicio']} - {$validated['hora_fin']}",
                'motivo' => $validated['motivo'],
            ]
        );

        return redirect()->route('portal.index')
            ->with('success', '¡Tu solicitud de sala fue enviada con éxito! El administrador del punto la revisará para su confirmación.');
    }
}
