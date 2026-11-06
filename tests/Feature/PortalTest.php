<?php

namespace Tests\Feature;

use App\Models\Citizen;
use App\Models\Point;
use App\Models\RoomLoan;
use App\Models\User;
use Database\Seeders\PuntosVdSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\TipoIdSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PortalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PuntosVdSeeder::class);
        $this->seed(TipoIdSeeder::class);
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_guest_is_redirected_from_portal(): void
    {
        $response = $this->get('/portal');
        $response->assertRedirect('/login');
    }

    public function test_citizen_user_can_view_portal(): void
    {
        $citizen = Citizen::create([
            'documento' => '1122334455',
            'tipo_doc' => 'CC',
            'nombres' => 'Juan Carlos',
            'apellidos' => 'Pérez Gómez',
            'email' => 'juan.perez@example.com',
            'telefono' => '3101234567',
        ]);

        $user = User::factory()->create([
            'email' => 'juan.perez@example.com',
            'documento' => '1122334455',
            'id_form_pvd' => $citizen->id_form_pvd,
        ]);
        $user->assignRole('Usuario');

        $response = $this->actingAs($user)->get('/portal');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Portal/Index')
            ->has('ciudadano')
            ->where('ciudadano.documento', '1122334455')
            ->has('stats')
            ->has('puntos')
            ->has('solicitudes')
            ->has('visitas')
        );
    }

    public function test_citizen_can_request_room_loan_with_pending_status(): void
    {
        $point = Point::create([
            'nombre_punto' => 'PVD Principal Las Villas',
            'direccion' => 'Calle 15 # 20-30',
            'activo' => true,
        ]);

        $citizen = Citizen::create([
            'documento' => '1122334455',
            'tipo_doc' => 'CC',
            'nombres' => 'María',
            'apellidos' => 'Rodríguez',
        ]);

        $user = User::factory()->create([
            'email' => 'maria@example.com',
            'documento' => '1122334455',
            'id_form_pvd' => $citizen->id_form_pvd,
        ]);
        $user->assignRole('Usuario');

        $response = $this->actingAs($user)->post('/portal/solicitar-sala', [
            'id_punto' => $point->id_punto,
            'tipo_actividad' => 'Cine Comunitario, Cineclub y Proyecciones Audiovisuales',
            'num_asistentes' => 25,
            'fecha_prestamo' => now()->addDays(2)->toDateString(),
            'hora_inicio' => '14:00',
            'hora_fin' => '16:00',
            'motivo' => 'Proyección documental barrial de memoria histórica',
        ]);

        $response->assertRedirect('/portal');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('prestamo_sala', [
            'id_form_pvd' => $citizen->id_form_pvd,
            'id_punto' => $point->id_punto,
            'estado' => 'Pendiente',
            'num_asistentes' => 25,
        ]);
    }

    public function test_citizen_cannot_request_room_with_overlapping_schedule(): void
    {
        $point = Point::create([
            'nombre_punto' => 'PVD Centro',
            'direccion' => 'Carrera 14 # 11-20',
            'activo' => true,
        ]);

        $targetDate = now()->addDays(3)->toDateString();

        // Existing confirmed loan from 14:00 to 16:00
        RoomLoan::create([
            'id_punto' => $point->id_punto,
            'tipo_actividad' => 'Cursos SENA',
            'num_asistentes' => 20,
            'fecha_prestamo' => $targetDate,
            'hora_inicio' => '14:00',
            'hora_fin' => '16:00',
            'estado' => 'Reservado',
        ]);

        $user = User::factory()->create([
            'email' => 'test.overlap@example.com',
            'documento' => '99887766',
        ]);
        $user->assignRole('Usuario');

        // Attempting to book 15:00 to 17:00 (overlaps with 14:00-16:00)
        $response = $this->actingAs($user)->post('/portal/solicitar-sala', [
            'id_punto' => $point->id_punto,
            'tipo_actividad' => 'Reunión JAC',
            'num_asistentes' => 15,
            'fecha_prestamo' => $targetDate,
            'hora_inicio' => '15:00',
            'hora_fin' => '17:00',
            'motivo' => 'Reunión con los vecinos de la cuadra',
        ]);

        $response->assertSessionHasErrors(['hora_inicio']);
        $this->assertEquals(1, RoomLoan::count());
    }

    public function test_staff_can_approve_pending_loan(): void
    {
        $point = Point::create([
            'nombre_punto' => 'PVD Las Villas',
            'activo' => true,
        ]);

        $loan = RoomLoan::create([
            'id_punto' => $point->id_punto,
            'tipo_actividad' => 'Reunión JAC',
            'num_asistentes' => 15,
            'fecha_prestamo' => now()->addDays(1)->toDateString(),
            'hora_inicio' => '10:00',
            'hora_fin' => '12:00',
            'estado' => 'Pendiente',
        ]);

        $staff = User::factory()->create();
        $staff->assignRole('Administrador');

        $response = $this->actingAs($staff)->put("/prestamos/{$loan->id_prestamo}", [
            'estado' => 'Reservado',
            'observaciones' => 'Confirmado y asignado gestor de apoyo.',
        ]);

        $response->assertRedirect();
        $loan->refresh();
        $this->assertEquals('Reservado', $loan->estado);
        $this->assertEquals($staff->id, $loan->id_gestor);
    }
}
