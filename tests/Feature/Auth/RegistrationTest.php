<?php

namespace Tests\Feature\Auth;

use Database\Seeders\PuntosVdSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\TipoIdSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PuntosVdSeeder::class);
        $this->seed(TipoIdSeeder::class);
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');
        $response->assertStatus(200);
    }

    public function test_new_citizens_can_register(): void
    {
        $response = $this->post('/register', [
            'id_tipo' => 2,
            'documento' => '1199887766',
            'nombres' => 'Camilo',
            'apellidos' => 'Andrade',
            'email' => 'camilo@example.com',
            'telefono' => '3201234567',
            'direccion' => 'Calle 10 # 5-20',
            'barrio' => 'Centro',
            'zona' => 'Urbana',
            'estrato' => 2,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('portal.index', absolute: false));
    }
}
