<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'telefono' => ['nullable', 'string', 'max:50'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'barrio' => ['nullable', 'string', 'max:120'],
            'zona' => ['nullable', 'string', 'max:30'],
            'estrato' => ['nullable', 'integer', 'min:1', 'max:6'],
            'nivel_educativo' => ['nullable', 'string', 'max:100'],
            'ocupacion' => ['nullable', 'string', 'max:100'],
            'g_poblacional' => ['nullable', 'string', 'max:150'],
            'grupo_etnico' => ['nullable', 'string', 'max:100'],
            't_aseguramiento' => ['nullable', 'string', 'max:100'],
        ];
    }
}
