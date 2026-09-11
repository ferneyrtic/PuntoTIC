<?php

namespace App\Http\Controllers;

use App\Models\DynamicField;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DynamicFieldController extends Controller
{
    public function index(): Response
    {
        $fields = DynamicField::orderBy('modulo')->orderBy('orden')->get();

        return Inertia::render('DynamicFields/Index', [
            'fields' => $fields,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'modulo' => ['required', 'in:form_pvd,visitas,prestamo_sala,registro_impresion'],
            'nombre_campo' => ['required', 'string', 'max:100'],
            'tipo' => ['required', 'in:texto,numero,lista,fecha,booleano'],
            'opciones' => ['nullable', 'array'],
            'requerido' => ['boolean'],
            'incluir_en_reporte' => ['boolean'],
        ]);

        $validated['slug'] = Str::slug($validated['nombre_campo'], '_');

        DynamicField::create($validated);

        return redirect()->route('campos-dinamicos.index')
            ->with('success', 'Campo personalizado agregado exitosamente. Aparecerá en formularios y reportes.');
    }

    public function destroy(DynamicField $campo): RedirectResponse
    {
        $campo->delete();

        return redirect()->route('campos-dinamicos.index')
            ->with('success', 'Campo personalizado eliminado.');
    }
}
