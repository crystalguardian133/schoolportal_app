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
            $path = $request->path();

            // Skip logging for health checks and static assets
            if (in_array($path, ['up', 'health', 'assets', '_debugbar', 'telescope'])) {
                return;
            }

            $routeName = optional($request->route())->getName();
            $user = $request->user();

            // Get IPv4 address if available, otherwise fall back to whatever Laravel provides
            $ipAddress = $this->resolveIPv4($request);

            // Sanitize request data
            $payload = $this->sanitizeData($request->request->all());
            unset($payload['avatar']);

            SystemLog::create([
                'user_uuid' => $user?->uuid,
                'action' => $routeName
                    ? strtoupper($request->method()).' '.$routeName
                    : strtoupper($request->method()).' '.$path,
                'route_name' => $routeName,
                'method' => strtoupper($request->method()),
                'path' => '/'.ltrim($path, '/'),
                'ip_address' => $ipAddress,
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

    private function resolveIPv4(Request $request): ?string
    {
        // Prefer client-detected IPv4 from browser-side detection cookie
        $clientIpv4 = $request->cookie('client_ipv4');
        if ($clientIpv4 && filter_var($clientIpv4, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return $clientIpv4;
        }

        // Check X-Forwarded-For first (comma-separated, first is client)
        $forwarded = $request->header('X-Forwarded-For');
        if ($forwarded) {
            $first = trim(explode(',', $forwarded)[0]);

            return $this->extractIPv4($first) ?? $this->extractIPv4($request->ip());
        }

        // Check X-Real-IP
        $realIp = $request->header('X-Real-IP');
        if ($realIp) {
            return $this->extractIPv4($realIp) ?? $this->extractIPv4($request->ip());
        }

        return $this->extractIPv4($request->ip());
    }

    private function extractIPv4(?string $ip): ?string
    {
        if ($ip === null || $ip === '') {
            return null;
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return $ip;
        }

        // Unpack IPv6-mapped IPv4 (::ffff:192.168.1.1) or (::ffff:7f00:0001)
        if (str_starts_with($ip, '::ffff:')) {
            $mapped = substr($ip, 7);

            if (filter_var($mapped, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                return $mapped;
            }

            // Hex-encoded form: convert to dotted notation
            if (ctype_xdigit($mapped) && strlen($mapped) === 8) {
                $unpacked = pack('H*', $mapped);
                $dotted = inet_ntop($unpacked);

                if ($dotted && filter_var($dotted, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                    return $dotted;
                }
            }
        }

        // Localhost IPv6
        if ($ip === '::1') {
            return '127.0.0.1';
        }

        // IPv4-mapped IPv6 with embedded hex (::ffff:7f00:0001)
        if (preg_match('/^::ffff:([0-9a-f]{4}):([0-9a-f]{4})$/i', $ip, $m)) {
            $unpacked = pack('H*', $m[1].$m[2]);
            $dotted = inet_ntop($unpacked);

            if ($dotted && filter_var($dotted, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                return $dotted;
            }
        }

        // Try inet_pton to detect mapped addresses (e.g. ::ffff:c0a8:0101)
        $packed = @inet_pton($ip);
        if ($packed && strlen($packed) === 16) {
            // Check if it's an IPv4-mapped IPv6 (::ffff:x.x.x.x)
            if (substr($packed, 0, 12) === "\0\0\0\0\0\0\0\0\0\0\xff\xff") {
                $dotted = inet_ntop(substr($packed, 12));

                if ($dotted && filter_var($dotted, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                    return $dotted;
                }
            }
        }

        return $ip;
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