<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Citizen;
use App\Models\Point;
use App\Models\Training;
use App\Models\TrainingRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TrainingController extends Controller
{
    /**
     * Muestra el panel administrativo de capacitaciones.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $categoria = $request->input('categoria');
        $idPunto = $request->input('id_punto');

        $trainings = Training::with('punto')
            ->withCount('inscripciones')
            ->when($search, function ($q, $s) {
                $q->where(function ($sub) use ($s) {
                    $sub->where('titulo', 'like', "%{$s}%")
                        ->orWhere('descripcion', 'like', "%{$s}%")
                        ->orWhere('instructor', 'like', "%{$s}%");
                });
            })
            ->when($categoria, fn ($q, $c) => $q->where('categoria', $c))
            ->when($idPunto, fn ($q, $p) => $q->where('id_punto', $p))
            ->orderByDesc('id_capacitacion')
            ->paginate(10)
            ->withQueryString();

        $points = Point::where('activo', true)
            ->whereNotIn('id_punto', [5, 6])
            ->get(['id_punto', 'nombre_punto', 'zona']);

        $categorias = [
            'Ofimática & Empleabilidad',
            'Programación & Robótica',
            'Inclusión & Adulto Mayor',
            'Emprendimiento & Negocios',
            'Diseño & Contenido Digital',
            'Trámites en Línea',
            'Ciberseguridad & Ciudadanía Digital',
        ];

        return Inertia::render('Trainings/Index', [
            'trainings' => $trainings,
            'points' => $points,
            'categorias' => $categorias,
            'filters' => [
                'search' => $search,
                'categoria' => $categoria,
                'id_punto' => $idPunto,
            ],
        ]);
    }

    /**
     * Almacena una nueva capacitación en la base de datos.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'id_punto' => 'nullable|exists:puntos_vd,id_punto',
            'descripcion' => 'required|string',
            'categoria' => 'required|string|max:100',
            'tipo' => 'required|string|max:50',
            'instructor' => 'nullable|string|max:150',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'horario' => 'nullable|string|max:150',
            'duracion_horas' => 'nullable|integer|min:1|max:500',
            'cupos_totales' => 'required|integer|min:1|max:500',
            'requisitos' => 'nullable|string',
            'dirigido_a' => 'nullable|string|max:150',
            'imagen_url' => 'nullable|string|max:500',
            'color_tema' => 'nullable|string|max:50',
            'activo' => 'boolean',
            'destacado' => 'boolean',
        ]);

        $validated['cupos_disponibles'] = $validated['cupos_totales'];
        $validated['slug'] = Str::slug($validated['titulo']).'-'.Str::lower(Str::random(5));

        $training = Training::create($validated);

        if ($request->user()) {
            AuditLog::registrar(
                $request->user(),
                'crear_capacitacion',
                "Creó la capacitación #{$training->id_capacitacion}: {$training->titulo}"
            );
        }

        return back()->with('success', 'Capacitación creada y publicada correctamente.');
    }

    /**
     * Actualiza una capacitación existente.
     */
    public function update(Request $request, Training $capacitacione): RedirectResponse
    {
        $training = $capacitacione;

        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'id_punto' => 'nullable|exists:puntos_vd,id_punto',
            'descripcion' => 'required|string',
            'categoria' => 'required|string|max:100',
            'tipo' => 'required|string|max:50',
            'instructor' => 'nullable|string|max:150',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date',
            'horario' => 'nullable|string|max:150',
            'duracion_horas' => 'nullable|integer|min:1|max:500',
            'cupos_totales' => 'required|integer|min:1|max:500',
            'requisitos' => 'nullable|string',
            'dirigido_a' => 'nullable|string|max:150',
            'imagen_url' => 'nullable|string|max:500',
            'color_tema' => 'nullable|string|max:50',
            'activo' => 'boolean',
            'destacado' => 'boolean',
        ]);

        // Ajustar cupos disponibles si cambiaron los totales
        if ($training->cupos_totales !== (int) $validated['cupos_totales']) {
            $diff = (int) $validated['cupos_totales'] - $training->cupos_totales;
            $validated['cupos_disponibles'] = max(0, $training->cupos_disponibles + $diff);
        }

        $training->update($validated);

        if ($request->user()) {
            AuditLog::registrar(
                $request->user(),
                'editar_capacitacion',
                "Actualizó la capacitación #{$training->id_capacitacion}: {$training->titulo}"
            );
        }

        return back()->with('success', 'Capacitación actualizada correctamente.');
    }

    /**
     * Alterna el estado activo / inactivo de la capacitación.
     */
    public function toggleActive(Request $request, Training $capacitacion): RedirectResponse
    {
        $capacitacion->activo = ! $capacitacion->activo;
        $capacitacion->save();

        return back()->with('success', 'Estado de la capacitación actualizado.');
    }

    /**
     * Elimina una capacitación.
     */
    public function destroy(Request $request, Training $capacitacione): RedirectResponse
    {
        $training = $capacitacione;
        $titulo = $training->titulo;
        $training->delete();

        if ($request->user()) {
            AuditLog::registrar(
                $request->user(),
                'eliminar_capacitacion',
                "Eliminó la capacitación: {$titulo}"
            );
        }

        return back()->with('success', 'Capacitación eliminada.');
    }

    /**
     * Preinscripción pública ciudadana desde la Landing Page.
     */
    public function inscribirsePublico(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'id_capacitacion' => 'required|exists:capacitaciones,id_capacitacion',
            'documento' => 'required|string|max:50',
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'telefono' => 'required|string|max:50',
            'correo' => 'nullable|email|max:150',
        ]);

        $training = Training::findOrFail($validated['id_capacitacion']);

        if (! $training->activo) {
            return back()->withErrors(['documento' => 'Esta capacitación ya no se encuentra abierta para inscripciones.']);
        }

        // Verificar si ya está registrado en este curso
        $exists = TrainingRegistration::where('id_capacitacion', $training->id_capacitacion)
            ->where('documento', $validated['documento'])
            ->exists();

        if ($exists) {
            return back()->with('info', 'Ya te encuentras preinscrito en esta capacitación. El gestor se pondrá en contacto contigo.');
        }

        // Vincular con ciudadano si ya existe en la base de datos municipal
        $citizen = Citizen::where('documento', $validated['documento'])->first();

        TrainingRegistration::create([
            'id_capacitacion' => $training->id_capacitacion,
            'id_form_pvd' => $citizen?->id_form_pvd,
            'documento' => $validated['documento'],
            'nombres' => $validated['nombres'],
            'apellidos' => $validated['apellidos'],
            'telefono' => $validated['telefono'],
            'correo' => $validated['correo'] ?? null,
            'estado' => 'preinscrito',
        ]);

        // Decrementar cupos disponibles si aún hay cupo
        if ($training->cupos_disponibles > 0) {
            $training->decrement('cupos_disponibles');
        }

        return back()->with('success', "¡Preinscripción exitosa en \"{$training->titulo}\"! Tu cupo ha sido reservado.");
    }
}
