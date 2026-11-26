<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Citizen;
use App\Models\DocumentType;
use App\Models\Point;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Muestra la vista de registro ciudadano para préstamos de salas y servicios.
     */
    public function create(): Response
    {
        $documentTypes = DocumentType::where('activo', true)->get(['id_tipo', 'nombre_tipo', 'sigla']);
        if ($documentTypes->isEmpty()) {
            $documentTypes = [
                ['id_tipo' => 2, 'nombre_tipo' => 'Cédula de Ciudadanía', 'sigla' => 'CC'],
                ['id_tipo' => 1, 'nombre_tipo' => 'Tarjeta de Identidad', 'sigla' => 'TI'],
                ['id_tipo' => 3, 'nombre_tipo' => 'Cédula de Extranjería', 'sigla' => 'CE'],
                ['id_tipo' => 5, 'nombre_tipo' => 'Permiso por Protección Temporal', 'sigla' => 'PPT'],
            ];
        }

        $points = Point::where('activo', true)->whereNotIn('id_punto', [5, 6])->get(['id_punto', 'nombre_punto', 'zona']);

        return Inertia::render('Auth/Register', [
            'documentTypes' => $documentTypes,
            'points' => $points,
        ]);
    }

    /**
     * Procesa el registro del ciudadano, sincronizando form_pvd y creando el usuario.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            // Identificación
            'id_tipo' => ['required'],
            'documento' => ['required', 'string', 'max:50'],
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'fecha_nac' => ['nullable', 'date'],
            'edad' => ['nullable', 'integer', 'min:0', 'max:130'],
            'genero' => ['nullable', 'string', 'max:30'],

            // Contacto y Notificaciones
            'email' => ['required', 'string', 'email', 'max:150'],
            'telefono' => ['required', 'string', 'max:50'],

            // Credenciales
            'password' => ['required', 'confirmed', Rules\Password::defaults()],

            // Ubicación y Residencia
            'direccion' => ['required', 'string', 'max:255'],
            'barrio' => ['required', 'string', 'max:120'],
            'zona' => ['required', 'in:Urbana,Rural'],
            'estrato' => ['required', 'integer', 'min:1', 'max:6'],
            'up' => ['nullable', 'string', 'max:100'],
            'id_punto' => ['nullable'],

            // Caracterización y Enfoque Diferencial
            'nivel_educativo' => ['nullable', 'string', 'max:100'],
            'ocupacion' => ['nullable', 'string', 'max:100'],
            'g_poblacional' => ['nullable', 'string', 'max:150'],
            'grupo_etnico' => ['nullable', 'string', 'max:100'],
            't_aseguramiento' => ['nullable', 'string', 'max:100'],
        ], [
            'documento.required' => 'El número de documento es obligatorio.',
            'nombres.required' => 'El nombre es obligatorio.',
            'apellidos.required' => 'Los apellidos son obligatorios.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'Ingresa un correo electrónico válido.',
            'telefono.required' => 'El número de teléfono es obligatorio.',
            'password.required' => 'Debes crear una contraseña.',
            'password.confirmed' => 'La confirmación de contraseña no coincide.',
            'password.min' => 'La contraseña debe tener al menos :min caracteres.',
            'password.mixed' => 'La contraseña debe incluir al menos una letra mayúscula y una minúscula.',
            'password.letters' => 'La contraseña debe incluir letras.',
            'password.numbers' => 'La contraseña debe incluir al menos un número.',
            'password.symbols' => 'La contraseña debe incluir al menos un símbolo (por ejemplo @, #, !, *).',
            'password.uncompromised' => 'Esa contraseña es muy común o ha aparecido en filtraciones. Por favor elige otra diferente.',
            'direccion.required' => 'La dirección de residencia es obligatoria.',
            'barrio.required' => 'El barrio o vereda es obligatorio.',
        ]);

        $emailNormalized = mb_strtolower(trim($validated['email']));
        $documentoNormalized = preg_replace('/\s+/', '', trim($validated['documento']));

        // 1. Validar que no exista un usuario registrado con este correo o documento
        if (User::whereRaw('LOWER(email) = ?', [$emailNormalized])->exists()) {
            throw ValidationException::withMessages([
                'email' => 'Ya existe un usuario registrado con este correo electrónico. Por favor inicia sesión.',
            ]);
        }

        if (User::where('documento', $documentoNormalized)->exists()) {
            throw ValidationException::withMessages([
                'documento' => 'Ya existe una cuenta con este número de documento. Por favor inicia sesión.',
            ]);
        }

        // Calcular edad si se especificó fecha de nacimiento
        $edad = $validated['edad'] ?? null;
        if (! empty($validated['fecha_nac']) && ! $edad) {
            try {
                $edad = Carbon::parse($validated['fecha_nac'])->age;
            } catch (\Exception $e) {
                $edad = null;
            }
        }

        // 2. Comprobar si ya existe una ficha previa en form_pvd (por visitas anteriores en sede, incluso sin columna documento)
        $numericDoc = preg_replace('/\D/', '', $documentoNormalized);
        $citizen = Citizen::where('documento', $documentoNormalized)
            ->orWhere('id_form_pvd', $documentoNormalized)
            ->when(! empty($numericDoc), fn ($q) => $q->orWhere('id', (int) $numericDoc))
            ->first();

        if ($citizen) {
            // Actualizar datos de contacto y caracterización (y normalizar documento/id_form_pvd si faltaban)
            $citizen->update([
                'documento' => $citizen->documento ?: $documentoNormalized,
                'id_form_pvd' => $citizen->id_form_pvd ?: $citizen->id,
                'id_tipo' => $citizen->id_tipo ?: $validated['id_tipo'],
                'correo' => $emailNormalized,
                'telefono' => $validated['telefono'],
                'direccion' => $validated['direccion'],
                'barrio' => $validated['barrio'],
                'zona' => $validated['zona'],
                'estrato' => $validated['estrato'],
                'nivel_educativo' => $validated['nivel_educativo'] ?? $citizen->nivel_educativo,
                'ocupacion' => $validated['ocupacion'] ?? $citizen->ocupacion,
                'g_poblacional' => $validated['g_poblacional'] ?? $citizen->g_poblacional,
                'grupo_etnico' => $validated['grupo_etnico'] ?? $citizen->grupo_etnico,
                't_aseguramiento' => $validated['t_aseguramiento'] ?? $citizen->t_aseguramiento,
            ]);
        } else {
            // Crear nueva ficha oficial en form_pvd
            $citizen = Citizen::create([
                'id_tipo' => $validated['id_tipo'],
                'documento' => $documentoNormalized,
                'nombres' => $validated['nombres'],
                'apellidos' => $validated['apellidos'],
                'fecha_nac' => $validated['fecha_nac'] ?? null,
                'edad' => $edad,
                'genero' => $validated['genero'] ?? 'Otro',
                'correo' => $emailNormalized,
                'telefono' => $validated['telefono'],
                'direccion' => $validated['direccion'],
                'barrio' => $validated['barrio'],
                'zona' => $validated['zona'],
                'estrato' => $validated['estrato'],
                'up' => $validated['up'] ?? null,
                'id_punto' => $validated['id_punto'] ?? 1,
                'nivel_educativo' => $validated['nivel_educativo'] ?? 'Bachillerato completo',
                'ocupacion' => $validated['ocupacion'] ?? 'Independiente',
                'g_poblacional' => $validated['g_poblacional'] ?? 'Ninguno',
                'grupo_etnico' => $validated['grupo_etnico'] ?? 'Ninguno',
                't_aseguramiento' => $validated['t_aseguramiento'] ?? 'Subsidiado',
            ]);
        }

        // 3. Crear cuenta de usuario ciudadana vinculada
        $user = User::create([
            'name' => trim($validated['nombres'] . ' ' . $validated['apellidos']),
            'email' => $emailNormalized,
            'documento' => $documentoNormalized,
            'id_form_pvd' => $citizen->id ?? $citizen->id_form_pvd,
            'telefono' => $validated['telefono'],
            'cargo' => 'Ciudadano',
            'password' => Hash::make($validated['password']),
            'activo' => true,
        ]);

        // Asignar rol Ciudadano oficial
        try {
            $user->assignRole('Ciudadano');
        } catch (\Exception $e) {
            // Si Spatie no tiene asignado, continuar
        }

        event(new Registered($user));

        Auth::login($user);

        return redirect()->route('portal.index')->with('success', '¡Bienvenido a PuntoTIC! Tu cuenta ciudadana ha sido creada con éxito. Ya puedes solicitar préstamos de salas y consultar su estado.');
    }
}
