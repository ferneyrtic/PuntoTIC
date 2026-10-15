<?php

namespace App\Http\Controllers;

use App\Models\Citizen;
use App\Models\Point;
use App\Models\RoomLoan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RoomLoanController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['fecha_desde', 'fecha_hasta', 'id_punto', 'estado', 'tipo_actividad', 'search']);

        $loans = RoomLoan::with(['ciudadano', 'punto', 'gestor'])
            ->dateBetween($filters['fecha_desde'] ?? null, $filters['fecha_hasta'] ?? null)
            ->when($filters['id_punto'] ?? null, fn($q, $p) => $q->where('id_punto', $p))
            ->when($filters['estado'] ?? null, fn($q, $e) => $q->where('estado', $e))
            ->when($filters['tipo_actividad'] ?? null, fn($q, $t) => $q->where('tipo_actividad', $t))
            ->when($filters['search'] ?? null, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('nombre_responsable_texto', 'like', "%{$search}%")
                        ->orWhere('observaciones', 'like', "%{$search}%")
                        ->orWhereHas('ciudadano', function ($c) use ($search) {
                            $c->where('nombres', 'like', "%{$search}%")
                              ->orWhere('apellidos', 'like', "%{$search}%")
                              ->orWhere('documento', 'like', "%{$search}%");
                        });
                });
            })
            ->latest('fecha_prestamo')
            ->paginate(15)
            ->withQueryString();

        $points = Point::where('activo', true)->get(['id_punto', 'nombre_punto']);
        $tiposActividad = RoomLoan::select('tipo_actividad')
            ->distinct()
            ->orderBy('tipo_actividad')
            ->pluck('tipo_actividad');

        // Eventos completos para la vista de calendario
        $selectedMonth = $request->get('mes', now()->format('Y-m'));
        try {
            $monthCarbon = \Carbon\Carbon::createFromFormat('Y-m', $selectedMonth);
        } catch (\Exception $e) {
            $monthCarbon = now();
            $selectedMonth = now()->format('Y-m');
        }

        $monthStart = $monthCarbon->copy()->startOfMonth()->subDays(7)->toDateString();
        $monthEnd = $monthCarbon->copy()->endOfMonth()->addDays(7)->toDateString();

        $calendarLoans = RoomLoan::with(['ciudadano', 'punto'])
            ->whereBetween('fecha_prestamo', [$monthStart, $monthEnd])
            ->when($filters['id_punto'] ?? null, fn($q, $p) => $q->where('id_punto', $p))
            ->when($filters['tipo_actividad'] ?? null, fn($q, $t) => $q->where('tipo_actividad', $t))
            ->orderBy('fecha_prestamo')
            ->get();

        return Inertia::render('RoomLoans/Index', [
            'loans' => $loans,
            'calendarLoans' => $calendarLoans,
            'selectedMonth' => $selectedMonth,
            'filters' => $filters,
            'points' => $points,
            'tiposActividad' => $tiposActividad,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id_form_pvd' => ['nullable', 'exists:form_pvd,id_form_pvd'],
            'nombre_responsable_texto' => ['nullable', 'string', 'max:150'],
            'id_punto' => ['required', 'exists:puntos_vd,id_punto'],
            'tipo_actividad' => ['required', 'string', 'max:150'],
            'num_asistentes' => ['required', 'integer', 'min:1', 'max:500'],
            'fecha_prestamo' => ['required', 'date'],
            'hora_inicio' => ['nullable', 'string'],
            'hora_fin' => ['nullable', 'string'],
            'observaciones' => ['nullable', 'string'],
            'estado' => ['required', 'in:Reservado,En curso,Completado,Cancelado'],
        ]);

        $validated['id_gestor'] = Auth::id();

        RoomLoan::create($validated);

        return redirect()->route('prestamos.index')
            ->with('success', 'Préstamo de sala registrado con éxito.');
    }

    public function update(Request $request, RoomLoan $loan): RedirectResponse
    {
        $validated = $request->validate([
            'estado' => ['required', 'in:Reservado,En curso,Completado,Cancelado'],
            'observaciones' => ['nullable', 'string'],
        ]);

        $loan->update($validated);

        return redirect()->route('prestamos.index')
            ->with('success', 'Estado del préstamo actualizado.');
    }
}
