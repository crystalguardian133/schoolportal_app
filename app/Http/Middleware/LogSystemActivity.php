<?php

namespace App\Http\Middleware;

use App\Models\SystemLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class LogSystemActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $response = $next($request);

            $this->storeLog($request, $response->getStatusCode());

            return $response;
        } catch (Throwable $throwable) {
            $this->storeLog($request, 500, [
                'exception' => class_basename($throwable),
                'message' => $throwable->getMessage(),
            ]);

            throw $throwable;
        }
    }

    private function storeLog(Request $request, int $statusCode, array $extra = []): void
    {
        try {
            $routeName = optional($request->route())->getName();
            $user = $request->user();

            // Get request data without triggering file processing
            $payload = [];
            foreach ($request->request->all() as $key => $value) {
                if ($key !== 'avatar') {
                    $payload[$key] = $value;
                }
            }

            SystemLog::create([
                'user_uuid' => $user?->uuid,
                'action' => $routeName
                    ? strtoupper($request->method()).' '.$routeName
                    : strtoupper($request->method()).' '.$request->path(),
                'route_name' => $routeName,
                'method' => strtoupper($request->method()),
                'path' => '/'.ltrim($request->path(), '/'),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'status_code' => $statusCode,
                'metadata' => array_filter([
                    'payload' => $payload ?: null,
                    'query' => $request->query() ?: null,
                    'exception' => $extra ?: null,
                ]),
            ]);
        } catch (Throwable $e) {
            // Silently fail if database is unavailable
        }
    }

    private function sanitizeData(array $data): array
    {
        $sensitiveKeys = [
            'password',
            'password_confirmation',
            'current_password',
            'new_password',
            'new_password_confirmation',
            'code',
            'token',
            '_token',
            'recovery_code',
        ];

        foreach ($data as $key => $value) {
            if (in_array($key, $sensitiveKeys, true)) {
                $data[$key] = '[hidden]';

                continue;
            }

            if ($value instanceof \Illuminate\Http\UploadedFile || $value instanceof \Symfony\Component\HttpFoundation\File\UploadedFile) {
                $data[$key] = '[uploaded file]';
                continue;
            }

            if (is_array($value)) {
                $data[$key] = $this->sanitizeData($value);

                continue;
            }

            if (is_object($value)) {
                $data[$key] = method_exists($value, '__toString') ? (string) $value : get_class($value);
            }
        }

        return $data;
    }
}