<?php

namespace App\Http\Controllers;

use App\Models\Point;
use App\Models\PrintRecord;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PrintRecordController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['fecha_desde', 'fecha_hasta', 'id_punto']);

        $records = PrintRecord::with(['ciudadano', 'punto', 'gestor'])
            ->dateBetween($filters['fecha_desde'] ?? null, $filters['fecha_hasta'] ?? null)
            ->when($filters['id_punto'] ?? null, fn($q, $p) => $q->where('id_punto', $p))
            ->latest('created_at')
            ->paginate(15)
            ->withQueryString();

        $points = Point::where('activo', true)->get(['id_punto', 'nombre_punto']);

        // Stats del mes
        $todaySum = PrintRecord::whereDate('created_at', Carbon::today())->sum('numero_hojas');
        $monthSum = PrintRecord::where('created_at', '>=', Carbon::now()->startOfMonth())->sum('numero_hojas');
        $totalAttended = PrintRecord::where('created_at', '>=', Carbon::now()->startOfMonth())->distinct('id_form_pvd')->count();

        return Inertia::render('PrintRecords/Index', [
            'records' => $records,
            'filters' => $filters,
            'points' => $points,
            'stats' => [
                'hojas_hoy' => (int) $todaySum,
                'hojas_mes' => (int) $monthSum,
                'ciudadanos_mes' => (int) $totalAttended,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id_form_pvd' => ['nullable', 'exists:form_pvd,id_form_pvd'],
            'nombre_usuario_texto' => ['nullable', 'string', 'max:150'],
            'id_punto' => ['required', 'exists:puntos_vd,id_punto'],
            'numero_hojas' => ['required', 'integer', 'min:1', 'max:500'],
            'tipo_impresion' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string'],
        ]);

        $validated['id_gestor'] = Auth::id();

        PrintRecord::create($validated);

        return redirect()->route('impresiones.index')
            ->with('success', 'Registro de impresión guardado exitosamente.');
    }
}
