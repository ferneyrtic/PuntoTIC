<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Citizen;
use App\Models\DynamicField;
use App\Models\DynamicFieldValue;
use App\Models\Point;
use App\Models\SubCategory;
use App\Models\User;
use App\Models\Visit;
use Database\Seeders\PuntosVdSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\TipoIdSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class ExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_login(): void
    {
        $response = $this->get(route('exportar.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_view_exports_index(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('exportar.index'));

        $response->assertOk();
    }

    public function test_authenticated_users_can_download_listado_asistencia_stream(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('exportar.listado-asistencia'));

        $response->assertOk();
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_dashboard_graficas_respects_custom_date_range(): void
    {
        $this->seed(PuntosVdSeeder::class);
        $this->seed(TipoIdSeeder::class);
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('Administrador');

        $response = $this->actingAs($user)->get(route('dashboard', [
            'print' => 'true',
            'fecha_desde' => '2026-03-01',
            'fecha_hasta' => '2026-03-31',
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('stats.periodo.key', 'custom')
            ->where('stats.periodo.fecha_desde', '2026-03-01')
            ->where('stats.periodo.fecha_hasta', '2026-03-31')
        );
    }

    public function test_visitas_xlsx_export_generates_valid_readable_workbook_with_dynamic_fields(): void
    {
        $this->seed(PuntosVdSeeder::class);
        $this->seed(TipoIdSeeder::class);
        $this->seed(RolesAndPermissionsSeeder::class);

        $point = Point::firstOrFail();
        $user = User::factory()->create([
            'name' => 'Gestor Prueba Export',
            'id_punto' => $point->id_punto,
        ]);
        $user->assignRole('Gestor PVD');

        $category = Category::create([
            'nombre' => 'Trámites en Línea',
            'descripcion' => 'Soporte ciudadano',
            'activo' => true,
        ]);
        $subCategory = SubCategory::create([
            'categoria_id' => $category->id_categoria,
            'nombre' => 'Certificado SISBEN',
            'activo' => true,
        ]);

        $citizen = Citizen::create([
            'documento' => '1000999888',
            'id_tipo' => 2,
            'nombres' => 'María',
            'apellidos' => 'González',
            'edad' => 34,
            'genero' => 'Femenino',
            'telefono' => '3101234567',
            'zona' => 'Urbana',
            'id_punto' => $point->id_punto,
            'id_gestor' => $user->id,
        ]);

        $visit = Visit::create([
            'id_form_pvd' => $citizen->id_form_pvd,
            'id_punto' => $point->id_punto,
            'id_categoria' => $category->id_categoria,
            'id_subcategoria' => $subCategory->id_subcategoria,
            'servicio_texto' => 'Trámites en Línea',
            'descripcion' => 'Atención rápida sin novelties',
            'id_gestor' => $user->id,
            'duracion_minutos' => 25,
        ]);

        $field = DynamicField::create([
            'modulo' => 'visitas',
            'nombre_campo' => 'Observación Especial',
            'slug' => 'observacion_especial',
            'tipo' => 'texto',
            'activo' => true,
        ]);

        DynamicFieldValue::create([
            'id_campo' => $field->id_campo,
            'entidad_tipo' => 'visitas',
            'entidad_id' => $visit->id_visita,
            'valor' => 'Entregado impreso',
        ]);

        $response = $this->actingAs($user)->get(route('exportar.download', [
            'tipo' => 'visitas',
            'formato' => 'xlsx',
            'columnas' => ['documento', 'tipo_doc', 'nombres', 'categoria', 'subcategoria', 'duracion', 'gestor'],
        ]));

        $response->assertOk();
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertStringContainsString('.xlsx', (string) $response->headers->get('content-disposition'));

        $file = $response->getFile();
        $spreadsheet = IOFactory::load($file->getPathname());
        $sheet = $spreadsheet->getActiveSheet();

        $this->assertSame('N° Documento', (string) $sheet->getCell('A1')->getValue());
        $this->assertSame('Tipo Documento', (string) $sheet->getCell('B1')->getValue());
        $this->assertSame('[Extra] Observación Especial', (string) $sheet->getCell('H1')->getValue());

        $this->assertSame('1000999888', (string) $sheet->getCell('A2')->getValue());
        $this->assertSame('TI', (string) $sheet->getCell('B2')->getValue());
        $this->assertSame('María', (string) $sheet->getCell('C2')->getValue());
        $this->assertSame('Trámites en Línea', (string) $sheet->getCell('D2')->getValue());
        $this->assertSame('Certificado SISBEN', (string) $sheet->getCell('E2')->getValue());
        $this->assertEquals(25, $sheet->getCell('F2')->getValue());
        $this->assertSame('Gestor Prueba Export', (string) $sheet->getCell('G2')->getValue());
        $this->assertSame('Entregado impreso', (string) $sheet->getCell('H2')->getValue());

        $spreadsheet->disconnectWorksheets();
        @unlink($file->getPathname());
    }

    public function test_visitas_csv_and_ciudadanos_xlsx_exports_return_valid_files(): void
    {
        $this->seed(PuntosVdSeeder::class);
        $this->seed(TipoIdSeeder::class);
        $this->seed(RolesAndPermissionsSeeder::class);

        $point = Point::firstOrFail();
        $user = User::factory()->create(['id_punto' => $point->id_punto]);
        $user->assignRole('Gestor PVD');

        $citizen = Citizen::create([
            'documento' => '1000777666',
            'id_tipo' => 1,
            'nombres' => 'Carlos',
            'apellidos' => 'Pérez',
            'edad' => 29,
            'genero' => 'Masculino',
            'zona' => 'Rural',
            'id_punto' => $point->id_punto,
            'id_gestor' => $user->id,
        ]);

        Visit::create([
            'id_form_pvd' => $citizen->id_form_pvd,
            'id_punto' => $point->id_punto,
            'servicio_texto' => 'Navegación Libre',
            'id_gestor' => $user->id,
            'duracion_minutos' => 45,
        ]);

        $csvResponse = $this->actingAs($user)->get(route('exportar.download', [
            'tipo' => 'visitas',
            'formato' => 'csv',
            'columnas' => ['documento', 'nombres', 'categoria'],
        ]));

        $csvResponse->assertOk();
        $csvPath = $csvResponse->getFile()->getPathname();
        $csvContent = file_get_contents($csvPath) ?: '';
        @unlink($csvPath);
        $this->assertStringContainsString('1000777666', $csvContent);
        $this->assertStringContainsString('Navegación Libre', $csvContent);

        $citizensResponse = $this->actingAs($user)->get(route('exportar.download', [
            'tipo' => 'ciudadanos',
            'formato' => 'xlsx',
        ]));

        $citizensResponse->assertOk();
        $xlsxPath = $citizensResponse->getFile()->getPathname();
        $spreadsheet = IOFactory::load($xlsxPath);
        $sheet = $spreadsheet->getActiveSheet();

        $this->assertSame('N° Documento', (string) $sheet->getCell('C1')->getValue());
        $this->assertSame('Total Visitas', (string) $sheet->getCell('V1')->getValue());
        $this->assertSame('1000777666', (string) $sheet->getCell('C2')->getValue());
        $this->assertEquals(1, $sheet->getCell('V2')->getValue());

        $spreadsheet->disconnectWorksheets();
        @unlink($xlsxPath);
    }
}
