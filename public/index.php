<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Suppress E_WARNING from vendor packages (e.g. thecodingmachine/safe uses legacy
// type names "resource"/"integer" that trigger warnings on PHP 8.3+).
set_error_handler(function (int $errno, string $errstr, string $errfile): bool {
    if ($errno === E_WARNING && str_contains($errfile, DIRECTORY_SEPARATOR.'vendor'.DIRECTORY_SEPARATOR)) {
        return true;
    }
    return false;
});

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
