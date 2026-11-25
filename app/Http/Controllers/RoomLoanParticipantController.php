<?php

namespace App\Http\Controllers;

use App\Models\Citizen;
use App\Models\RoomLoan;
use App\Models\RoomLoanParticipant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RoomLoanParticipantController extends Controller
{
    /**
     * Listar participantes de un préstamo.
     */
    public function index(RoomLoan $prestamo): JsonResponse
    {
        $participantes = $prestamo
            ->participantes()
            ->with('ciudadano:id_form_pvd,nombres,apellidos,documento')
            ->get()
            ->map(fn ($p) => [
                'id'              => $p->id,
                'id_form_pvd'     => $p->id_form_pvd,
                'nombre'          => $p->nombre_display,
                'documento'       => $p->documento_display,
                'nombre_libre'    => $p->nombre_libre,
                'documento_libre' => $p->documento_libre,
            ]);

        return response()->json(['participantes' => $participantes]);
    }

    /**
     * Agregar un participante (ciudadano registrado, auto-registro o libre).
     */
    public function store(Request $request, RoomLoan $prestamo): JsonResponse
    {
        $data = $request->validate([
            'id_form_pvd'     => ['nullable', 'exists:form_pvd,id_form_pvd'],
            'nombre_libre'    => ['nullable', 'string', 'max:150'],
            'documento_libre' => ['nullable', 'string', 'max:30'],
            // Campos para auto-registro de un nuevo ciudadano
            'auto_registrar'  => ['nullable', 'boolean'],
            'id_tipo'         => ['nullable', 'integer'],
            'nombres'         => ['nullable', 'string', 'max:100'],
            'apellidos'       => ['nullable', 'string', 'max:100'],
            'documento'       => ['nullable', 'string', 'max:30'],
            'correo'          => ['nullable', 'email', 'max:150'],
            'telefono'        => ['nullable', 'string', 'max:30'],
            'genero'          => ['nullable', 'string', 'max:20'],
            'barrio'          => ['nullable', 'string', 'max:120'],
            'g_poblacional'   => ['nullable', 'string', 'max:100'],
        ]);

        // ── Auto-registro: crear ciudadano en BD y luego asociarlo ──────────
        if (! empty($data['auto_registrar']) && ! empty($data['nombres'])) {
            $documento = trim($data['documento'] ?? '');

            // Verificar si ya existe (protección contra doble submit)
            $existing = $documento ? Citizen::where('documento', $documento)->first() : null;

            if (! $existing) {
                $tipoId = (int) ($data['id_tipo'] ?? 1);
                $existing = Citizen::create([
                    'id_tipo'       => $tipoId,
                    'tipo_id'       => $tipoId,
                    'nombres'       => strtoupper(trim($data['nombres'])),
                    'apellidos'     => strtoupper(trim($data['apellidos'] ?? '')),
                    'documento'     => $documento ?: null,
                    'correo'        => $data['correo'] ?? null,
                    'telefono'      => $data['telefono'] ?? null,
                    'genero'        => $data['genero'] ?? null,
                    'barrio'        => $data['barrio'] ?? null,
                    'g_poblacional' => $data['g_poblacional'] ?? 'Ninguno',
                    'activo'        => true,
                    'id_punto'      => $prestamo->id_punto ?? null,
                    'id_gestor'     => \Illuminate\Support\Facades\Auth::id(),
                ]);
            }

            // Ahora asignamos como ciudadano registrado
            $data['id_form_pvd'] = $existing->id_form_pvd ?? $existing->getKey();
        }

        // Evitar duplicados por ciudadano registrado
        if (! empty($data['id_form_pvd'])) {
            $exists = $prestamo->participantes()
                ->where('id_form_pvd', $data['id_form_pvd'])
                ->exists();

            if ($exists) {
                return response()->json(['error' => 'Este ciudadano ya está en la lista de participantes.'], 422);
            }
        }

        $prestamoId = $prestamo->id_prestamo ?? $prestamo->getKey();

        $participante = $prestamo->participantes()->create([
            'id_prestamo'     => $prestamoId,
            'id_form_pvd'     => $data['id_form_pvd'] ?? null,
            'nombre_libre'    => null,  // ya no guardamos como libre si fue auto-registrado
            'documento_libre' => null,
        ]);

        $participante->load('ciudadano:id_form_pvd,nombres,apellidos,documento');

        return response()->json([
            'participante' => [
                'id'                => $participante->id,
                'id_form_pvd'       => $participante->id_form_pvd,
                'nombre'            => $participante->nombre_display,
                'documento'         => $participante->documento_display,
                'nombre_display'    => $participante->nombre_display,
                'documento_display' => $participante->documento_display,
                'nombre_libre'      => $participante->nombre_libre,
                'documento_libre'   => $participante->documento_libre,
                'ciudadano'         => $participante->ciudadano,
            ],
        ], 201);
    }

    /**
     * Eliminar un participante.
     */
    public function destroy(RoomLoan $prestamo, RoomLoanParticipant $participante): JsonResponse
    {
        // Verificar que el participante pertenece al préstamo
        $prestamoId = $prestamo->id_prestamo ?? $prestamo->getKey();
        if ($participante->id_prestamo != $prestamoId) {
            return response()->json(['error' => 'No autorizado.'], 403);
        }

        $participante->delete();

        return response()->json(['ok' => true]);
    }
}
