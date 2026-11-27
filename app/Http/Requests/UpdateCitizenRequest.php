<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCitizenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];
        if ($this->has('documento')) {
            $merge['documento'] = trim((string) $this->input('documento'));
        }
        if ($this->has('correo') && $this->input('correo') !== null) {
            $trimmed = trim((string) $this->input('correo'));
            $merge['correo'] = $trimmed === '' ? null : $trimmed;
        }
        if ($this->has('zona')) {
            $val = trim((string) $this->input('zona'));
            if (strcasecmp($val, 'urbano') === 0 || strcasecmp($val, 'urbana') === 0) {
                $merge['zona'] = 'Urbana';
            } elseif (strcasecmp($val, 'rural') === 0) {
                $merge['zona'] = 'Rural';
            }
        }
        if (! empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        $citizen = $this->route('ciudadano') ?? $this->route('citizen');
        $citizenId = is_object($citizen) ? ($citizen->getKey() ?? $citizen->id_form_pvd) : $citizen;

        return [
            'documento' => ['required', 'string', 'max:50', 'unique:form_pvd,documento,' . $citizenId . ',id'],
            'id_tipo' => ['required', 'exists:tipo_id,id_tipo'],
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'fecha_nac' => ['nullable', 'date'],
            'edad' => ['nullable', 'integer', 'min:0', 'max:130'],
            'genero' => ['nullable', 'string', 'max:30'],
            'correo' => ['nullable', 'email', 'max:150'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'barrio' => ['nullable', 'string', 'max:120'],
            'zona' => ['required', 'in:Urbana,Rural,URBANO,RURAL,urbano,rural'],
            'up' => ['nullable', 'string', 'max:100'],
            'estrato' => ['nullable', 'integer', 'min:0', 'max:6'],
            'grupo_etnico' => ['nullable', 'string', 'max:100'],
            'nivel_educativo' => ['nullable', 'string', 'max:100'], // 100% editable
            'ocupacion' => ['nullable', 'string', 'max:100'],
            'g_poblacional' => ['nullable', 'string', 'max:150'],
            't_aseguramiento' => ['nullable', 'string', 'max:100'],
            'id_punto' => ['nullable', 'exists:puntos_vd,id_punto'],
            'activo' => ['boolean'],
        ];
    }
}
