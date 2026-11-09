<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVisitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $user = $this->user();
        if ($user && $user->id_punto) {
            $this->merge([
                'id_punto' => $user->id_punto,
            ]);
        } elseif (! $this->has('id_punto') || empty($this->input('id_punto'))) {
            $this->merge([
                'id_punto' => 1,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'id_form_pvd' => ['nullable', 'exists:form_pvd,id_form_pvd'],
            'documento' => ['nullable', 'string', 'max:50'],
            'nombres' => ['nullable', 'string', 'max:150'],
            'apellidos' => ['nullable', 'string', 'max:150'],
            'nombre_completo' => ['nullable', 'string', 'max:255'],
            'es_registro_rapido' => ['nullable', 'boolean'],
            'id_punto' => ['nullable', 'exists:puntos_vd,id_punto'],
            'id_categoria' => ['nullable', 'exists:categorias,id_categoria'],
            'id_subcategoria' => ['nullable', 'exists:sub_categorias,id_subcategoria'],
            'servicio_texto' => ['nullable', 'string', 'max:200'],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'duracion_minutos' => ['nullable', 'integer', 'min:1', 'max:480'],
            'campos_dinamicos' => ['nullable', 'array'],
            // Caracterización demográfica de ciudadano nuevo
            'telefono' => ['nullable', 'string', 'max:50'],
            'correo' => ['nullable', 'email', 'max:150'],
            'fecha_nac' => ['nullable', 'date'],
            'genero' => ['nullable', 'string', 'max:30'],
            'barrio' => ['nullable', 'string', 'max:100'],
            'zona' => ['nullable', 'string', 'max:30'],
            'estrato' => ['nullable', 'integer', 'min:1', 'max:6'],
            'nivel_educativo' => ['nullable', 'string', 'max:100'],
            't_aseguramiento' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $user = $this->user();
            if ($this->boolean('es_registro_rapido')) {
                if ($user && ! $user->puede_acceder_aula_digital) {
                    $validator->errors()->add('es_registro_rapido', 'Su rol o sede asignada (PVD) no tiene habilitado el registro rápido de Aula Digital. El servicio en PVD requiere el registro formal de ciudadanos.');
                }
            }
        });
    }
}
