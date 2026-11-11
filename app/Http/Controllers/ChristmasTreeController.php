<?php

namespace App\Http\Controllers;

use App\Models\ChristmasTree;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChristmasTreeController extends Controller
{
    /**
     * Obtiene el árbol del usuario actual y la galería de todos los gestores.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $miArbol = ChristmasTree::where('user_id', $user->id)->first();

        $arboles = ChristmasTree::with(['user:id,name', 'point:id_punto,nombre_punto,zona'])
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'mi_arbol' => $miArbol,
            'arboles' => $arboles,
        ]);
    }

    /**
     * Guarda o actualiza la decoración del árbol del gestor.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'decoraciones' => ['required', 'array', 'max:80'],
            'decoraciones.*.id' => ['required', 'string'],
            'decoraciones.*.tipo' => ['required', 'string', 'max:30'],
            'decoraciones.*.x' => ['required', 'numeric', 'min:0', 'max:100'],
            'decoraciones.*.y' => ['required', 'numeric', 'min:0', 'max:100'],
            'decoraciones.*.color' => ['nullable', 'string', 'max:20'],
            'mensaje' => ['nullable', 'string', 'max:200'],
            'luces_activas' => ['boolean'],
        ]);

        $user = $request->user();
        $point = $user->point;
        $nombrePunto = $point ? $point->nombre_punto : 'Punto Vive Digital';

        $tree = ChristmasTree::updateOrCreate(
            ['user_id' => $user->id],
            [
                'id_punto' => $user->id_punto,
                'nombre_gestor' => $user->name,
                'nombre_punto' => $nombrePunto,
                'decoraciones' => $validated['decoraciones'],
                'mensaje' => $validated['mensaje'] ?? '¡Feliz Navidad a todo el equipo TIC!',
                'luces_activas' => $validated['luces_activas'] ?? true,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => '¡Tu árbol navideño ha sido guardado y ya lo pueden ver tus compañeros!',
            'tree' => $tree,
        ]);
    }

    /**
     * Envía una reacción festiva (❤️ / 🎄) al árbol de un compañero gestor.
     */
    public function reaccionar(int $id): JsonResponse
    {
        $tree = ChristmasTree::findOrFail($id);
        $tree->increment('reacciones_count');

        return response()->json([
            'success' => true,
            'reacciones_count' => $tree->reacciones_count,
        ]);
    }
}
