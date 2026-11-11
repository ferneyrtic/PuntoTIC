<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\DynamicField;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DynamicFieldController extends Controller
{
    private function canManage(Request $request): bool
    {
        $user = $request->user();
        if (! $user) {
            return false;
        }

        return $user->isAdmin() ||
            $user->tieneAlcanceGlobal() ||
            $user->hasRole([
                'Administrador',
                'Super Administrador',
                'Super Admin',
                'Coordinador PVD',
                'Coordinador General',
                'Coordinador',
                'Coordinador Aula Digital',
            ]) ||
            in_array($user->email, ['admin@acacias.gov.co', 'coordinador.general@acacias.gov.co', 'davidmesa.cps.tic@gmail.com']);
    }

    public function index(Request $request): Response
    {
        if (! $this->canManage($request)) {
            abort(403, 'Acceso denegado: La administración de campos dinámicos está reservada exclusivamente para la Coordinación General y Administración.');
        }

        $fields = DynamicField::orderBy('modulo')->orderBy('orden')->get();

        return Inertia::render('DynamicFields/Index', [
            'fields' => $fields,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (! $this->canManage($request)) {
            abort(403, 'Acceso denegado: La administración de campos dinámicos está reservada exclusivamente para la Coordinación General y Administración.');
        }

        $validated = $request->validate([
            'modulo' => ['required', 'in:form_pvd,visitas,prestamo_sala,registro_impresion'],
            'nombre_campo' => ['required', 'string', 'max:100'],
            'tipo' => ['required', 'in:texto,numero,lista,fecha,booleano'],
            'opciones' => ['nullable', 'array'],
            'requerido' => ['boolean'],
            'incluir_en_reporte' => ['boolean'],
        ]);

        $validated['nombre_campo'] = strip_tags($validated['nombre_campo']);
        $validated['slug'] = Str::slug($validated['nombre_campo'], '_');

        $campo = DynamicField::create($validated);

        AuditLog::registrar('CREAR_CAMPO_DINAMICO', 'CamposDinamicos', (string) $campo->id_campo, null, $validated);

        return redirect()->route('campos-dinamicos.index')
            ->with('success', 'Campo personalizado agregado exitosamente.');
    }

    public function destroy(Request $request, DynamicField $campo): RedirectResponse
    {
        if (! $this->canManage($request)) {
            abort(403, 'Acceso denegado: La administración de campos dinámicos está reservada exclusivamente para la Coordinación General y Administración.');
        }

        AuditLog::registrar('ELIMINAR_CAMPO_DINAMICO', 'CamposDinamicos', (string) $campo->id_campo, $campo->toArray(), null);

        $campo->delete();

        return redirect()->route('campos-dinamicos.index')
            ->with('success', 'Campo personalizado eliminado.');
    }
}
