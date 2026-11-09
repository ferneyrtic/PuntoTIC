<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Category;

$cats = Category::with('subcategorias')->get();
foreach ($cats as $c) {
    echo "ID: {$c->id_categoria} | {$c->nombre} | Activo: " . ($c->activo ? 'SI' : 'NO') . " | Subcategorias (" . $c->subcategorias->count() . "):\n";
    foreach ($c->subcategorias as $s) {
        echo "   - [{$s->id_subcategoria}] {$s->nombre}\n";
    }
}
