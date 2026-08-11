<?php
// Script to list middleware for kinerja routes
define('LARAVEL_START', microtime(true));
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach (app('router')->getRoutes() as $route) {
    if (str_contains($route->uri(), 'kinerja')) {
        $middleware = $route->gatherMiddleware();
        echo $route->methods()[0] . ' /api/' . $route->uri() . ' => [' . implode(', ', $middleware) . ']' . PHP_EOL;
    }
}
