<?php

namespace Tests\Feature;

use App\Models\Point;
use App\Models\User;
use Database\Seeders\TipoIdSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VisitTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_login_when_accessing_visits(): void
    {
        $response = $this->get(route('visitas.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_view_visits_index(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('visitas.index'));

        $response->assertOk();
    }

    public function test_authenticated_user_point_is_assigned_automatically_when_storing_visit(): void
    {
        $this->seed(TipoIdSeeder::class);

        $point = Point::create([
            'nombre_punto' => 'Punto TIC Centro',
            'activo' => true,
        ]);

        $user = User::factory()->create([
            'id_punto' => $point->id_punto,
        ]);

        $response = $this
            ->actingAs($user)
            ->post(route('visitas.store'), [
                'documento' => '1234567890',
                'nombres' => 'Juan',
                'apellidos' => 'Perez',
                'servicio_texto' => 'Uso de internet',
                'descripcion' => 'Consulta general',
                'duracion_minutos' => 30,
            ]);

        $response->assertRedirect(route('visitas.index'));

        $this->assertDatabaseHas('visitas', [
            'id_punto' => $point->id_punto,
            'servicio_texto' => 'Uso de internet',
        ]);
    }
}
