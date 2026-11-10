<?php

namespace Tests\Feature;

use App\Models\DynamicField;
use App\Models\User;
use Database\Seeders\PuntosVdSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\TipoIdSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DynamicFieldTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PuntosVdSeeder::class);
        $this->seed(TipoIdSeeder::class);
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_admin_can_view_dynamic_fields(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Administrador');

        $response = $this->actingAs($admin)->get('/campos-dinamicos');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('DynamicFields/Index'));
    }

    public function test_non_admin_cannot_manage_dynamic_fields(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Usuario');

        $response = $this->actingAs($user)->get('/campos-dinamicos');
        $response->assertStatus(403);
    }

    public function test_admin_can_create_and_delete_dynamic_field(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Administrador');

        $postResponse = $this->actingAs($admin)->post('/campos-dinamicos', [
            'modulo' => 'visitas',
            'nombre_campo' => 'Programa Social',
            'tipo' => 'texto',
            'requerido' => false,
            'incluir_en_reporte' => true,
        ]);

        $postResponse->assertRedirect('/campos-dinamicos');
        $this->assertDatabaseHas('campos_dinamicos', [
            'nombre_campo' => 'Programa Social',
            'modulo' => 'visitas',
        ]);

        $field = DynamicField::where('nombre_campo', 'Programa Social')->firstOrFail();

        $deleteResponse = $this->actingAs($admin)->delete("/campos-dinamicos/{$field->id_campo}");
        $deleteResponse->assertRedirect('/campos-dinamicos');

        $this->assertDatabaseMissing('campos_dinamicos', [
            'id_campo' => $field->id_campo,
        ]);
    }
}
