<?php

namespace App\Http\Requests\Auth;

use App\Models\Citizen;
use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     * Permite ingresar tanto con Correo Electrónico como con Número de Documento.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $login = trim($this->input('email'));
        $password = $this->input('password');
        $remember = $this->boolean('remember');

        $isEmail = filter_var($login, FILTER_VALIDATE_EMAIL);
        $authenticated = false;

        if ($isEmail) {
            // Intentar autenticación por correo electrónico
            $authenticated = Auth::attempt(['email' => $login, 'password' => $password], $remember);

            // Si falló, intentar variantes con punto o guión bajo habituales
            if (! $authenticated) {
                if ($login === 'gestor.plus@acacias.gov.co') {
                    $authenticated = Auth::attempt(['email' => 'gestor_plus@acacias.gov.co', 'password' => $password], $remember);
                } elseif ($login === 'gestor_plus@acacias.gov.co') {
                    $authenticated = Auth::attempt(['email' => 'gestor.plus@acacias.gov.co', 'password' => $password], $remember);
                }
            }
        } else {
            // Normalizar posibles puntos o espacios en el documento (ej. 1.121.000.999)
            $digitsOnly = preg_replace('/\D/', '', $login);

            // 1. Intentar autenticación por documento directo en users
            $authenticated = Auth::attempt(['documento' => $login, 'password' => $password], $remember);

            if (! $authenticated && $digitsOnly !== '' && $digitsOnly !== $login) {
                $authenticated = Auth::attempt(['documento' => $digitsOnly, 'password' => $password], $remember);
            }

            // 2. Si no autenticó, buscar en form_pvd (incluyendo registros históricos) o en users por id_form_pvd
            if (! $authenticated) {
                $docLookup = $digitsOnly !== '' ? $digitsOnly : $login;
                $citizen = Citizen::where('documento', $login)
                    ->when($docLookup !== $login, fn ($q) => $q->orWhere('documento', $docLookup))
                    ->orWhere('id_form_pvd', $docLookup)
                    ->when(ctype_digit((string) $docLookup), fn ($q) => $q->orWhere('id', (int) $docLookup))
                    ->first();

                $user = User::query()
                    ->where('documento', $login)
                    ->when($docLookup !== $login, fn ($q) => $q->orWhere('documento', $docLookup))
                    ->when($citizen, function ($q) use ($citizen) {
                        $q->orWhere('id_form_pvd', $citizen->id)
                            ->when($citizen->id_form_pvd, fn ($sub) => $sub->orWhere('id_form_pvd', $citizen->id_form_pvd));
                    })
                    ->first();

                if ($user && Hash::check($password, $user->password)) {
                    Auth::login($user, $remember);
                    $authenticated = true;
                }
            }
        }

        if ($authenticated && Auth::user()?->activo === false) {
            Auth::logout();
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => 'Esta cuenta se encuentra desactivada. Comunícate con la coordinación TIC.',
            ]);
        }

        if (! $authenticated) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => 'Las credenciales ingresadas (correo o documento) no coinciden con nuestros registros.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => "Demasiados intentos de inicio de sesión. Por favor intenta nuevamente en {$seconds} segundos.",
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
