<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class MusicController extends Controller
{
    private string $cacheDir;

    private string $cookiesFile;

    public function __construct()
    {
        $this->cacheDir = storage_path('app/music-cache');
        if (! is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }

        $this->cookiesFile = env('YTDLP_COOKIES_FILE') ?: storage_path('app/ytdlp-cookies.txt');
    }

    private function authArgs(): array
    {
        return is_file($this->cookiesFile)
            ? ['--cookies', $this->cookiesFile]
            : [];
    }

    public function index()
    {
        return Inertia::render('developer/music');
    }

    public function search(Request $request)
    {
        $data = $request->validate([
            'query' => ['required', 'string', 'max:200'],
        ]);

        $result = Process::timeout(60)->run(array_merge([
            'yt-dlp',
            '--flat-playlist',
            '--dump-json',
            '--no-warnings',
            '--no-playlist',
            '--extractor-args', 'youtube:player_client=web',
        ], $this->authArgs(), [
            'ytsearch20:'.$data['query'],
        ]));

        if ($result->exitCode() !== 0) {
            Log::error('Music search failed', [
                'query' => $data['query'],
                'exit_code' => $result->exitCode(),
                'stderr' => substr($result->errorOutput(), 0, 1000),
            ]);

            $isMissing = str_contains($result->errorOutput(), 'not found')
                || str_contains($result->errorOutput(), 'No such file');

            return response()->json([
                'error' => $isMissing
                    ? 'yt-dlp is not installed in this environment. Add it to the Docker image to enable music search.'
                    : 'Music search failed. Check the server logs for details.',
            ], 500);
        }

        $results = [];

        foreach (array_filter(explode("\n", trim($result->output()))) as $line) {
            $json = json_decode($line, true);

            if (! $json || empty($json['id'])) {
                continue;
            }

            $results[] = [
                'id' => $json['id'],
                'title' => $json['title'] ?? 'Unknown',
                'duration' => $json['duration'] ?? null,
                'duration_string' => $this->formatDuration($json['duration'] ?? 0),
                'channel' => $json['channel'] ?? $json['uploader'] ?? 'Unknown',
                'thumbnail' => $json['thumbnail'] ?? "https://img.youtube.com/vi/{$json['id']}/hqdefault.jpg",
                'view_count' => $json['view_count'] ?? null,
            ];
        }

        return response()->json(['results' => $results]);
    }

    public function stream(Request $request)
    {
        $data = $request->validate([
            'video_id' => ['required', 'string', 'max:20'],
        ]);

        $safeId = preg_replace('/[^a-zA-Z0-9_-]/', '', $data['video_id']);

        $this->cleanupExpiredFiles();

        $file = $this->getCachedFile($safeId) ?? $this->downloadAudio($safeId);

        if (! $file) {
            return response()->json(['error' => 'Failed to download audio.'], 500);
        }

        $this->touchTimestamp($safeId);

        return $this->serveFile($file);
    }

    public function preCache(Request $request)
    {
        $data = $request->validate([
            'video_id' => ['required', 'string', 'max:20'],
        ]);

        $safeId = preg_replace('/[^a-zA-Z0-9_-]/', '', $data['video_id']);

        if ($file = $this->getCachedFile($safeId)) {
            $this->touchTimestamp($safeId);

            return response()->json(['status' => 'cached', 'video_id' => $safeId]);
        }

        if (! $this->downloadAudio($safeId)) {
            return response()->json(['status' => 'error', 'error' => 'Failed to download audio.'], 500);
        }

        $this->touchTimestamp($safeId);

        return response()->json(['status' => 'downloaded', 'video_id' => $safeId]);
    }

    public function checkCached(Request $request)
    {
        $data = $request->validate([
            'video_ids' => ['sometimes', 'array'],
            'video_ids.*' => ['string', 'max:20'],
        ]);

        $cached = [];

        foreach ($data['video_ids'] ?? [] as $id) {
            $safeId = preg_replace('/[^a-zA-Z0-9_-]/', '', $id);

            if ($this->getCachedFile($safeId)) {
                $cached[] = $safeId;
            }
        }

        return response()->json(['cached' => $cached]);
    }

    private function getCachedFile(string $videoId): ?string
    {
        $patterns = [
            $this->cacheDir.'/'.$videoId.'.m4a',
            $this->cacheDir.'/'.$videoId.'.webm',
            $this->cacheDir.'/'.$videoId.'.mp3',
            $this->cacheDir.'/'.$videoId.'.opus',
            $this->cacheDir.'/'.$videoId.'.ogg',
        ];

        foreach ($patterns as $path) {
            if (file_exists($path) && filesize($path) > 0) {
                return $path;
            }
        }

        // Fallback: glob search
        foreach (glob($this->cacheDir.'/'.$videoId.'.*') as $f) {
            if (is_file($f) && ! str_ends_with($f, '.meta') && filesize($f) > 0) {
                return $f;
            }
        }

        return null;
    }

    private function downloadAudio(string $safeId): ?string
    {
        $url = "https://www.youtube.com/watch?v={$safeId}";
        $authArgs = $this->authArgs();

        // Without cookies, YouTube's "not a bot" check often blocks datacenter IPs.
        // Retry with the web_embedded player client before giving up.
        $clientArgs = $authArgs
            ? [null]
            : [null, 'youtube:player_client=web_embedded'];

        foreach ($clientArgs as $extractorArgs) {
            $file = $this->runDownload($safeId, $url, $authArgs, $extractorArgs);

            if ($file) {
                return $file;
            }
        }

        return null;
    }

    private function runDownload(string $safeId, string $url, array $authArgs, ?string $extractorArgs): ?string
    {
        $args = [
            'yt-dlp',
            '-f', 'bestaudio',
            '--no-warnings',
            '--no-playlist',
            '--concurrent-fragments', '8',
            '--buffer-size', '16K',
            '--http-chunk-size', '10485760',
        ];

        if ($extractorArgs) {
            $args[] = '--extractor-args';
            $args[] = $extractorArgs;
        }

        $args = array_merge($args, $authArgs, [
            '-o', $this->cacheDir.'/'.$safeId.'.%(ext)s',
            $url,
        ]);

        try {
            $result = Process::timeout(120)->run($args);
        } catch (\Throwable $e) {
            Log::error('Music download process error', ['video_id' => $safeId, 'error' => $e->getMessage()]);

            return null;
        }

        $file = $this->getCachedFile($safeId);

        if ($result->exitCode() !== 0 || ! $file) {
            Log::error('Music download failed', [
                'video_id' => $safeId,
                'exit_code' => $result->exitCode(),
                'extractor_args' => $extractorArgs,
                'stderr' => $result->errorOutput(),
                'stdout' => substr($result->output(), 0, 500),
            ]);

            return null;
        }

        return $file;
    }

    private function touchTimestamp(string $videoId): void
    {
        $metaFile = $this->cacheDir.'/'.$videoId.'.meta';
        file_put_contents($metaFile, (string) time());
    }

    private function serveFile(string $filePath): Response
    {
        $size = filesize($filePath);
        $ext = pathinfo($filePath, PATHINFO_EXTENSION);

        $mimeMap = [
            'm4a' => 'audio/mp4',
            'webm' => 'audio/webm',
            'opus' => 'audio/ogg',
            'mp3' => 'audio/mpeg',
            'ogg' => 'audio/ogg',
        ];
        $contentType = $mimeMap[$ext] ?? 'audio/mpeg';

        $handle = fopen($filePath, 'r');

        if (! $handle) {
            return response()->json(['error' => 'Failed to open audio file.'], 500);
        }

        return response()->stream(function () use ($handle) {
            fpassthru($handle);
            fclose($handle);
        }, 200, [
            'Content-Type' => $contentType,
            'Content-Length' => $size,
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    private function cleanupExpiredFiles(): void
    {
        $ttl = 3600; // 1 hour
        $now = time();

        foreach (glob($this->cacheDir.'/*.meta') as $metaFile) {
            $timestamp = (int) file_get_contents($metaFile);
            if ($now - $timestamp > $ttl) {
                $base = str_replace('.meta', '', $metaFile);
                @unlink($metaFile);
                foreach (glob($base.'.*') as $f) {
                    @unlink($f);
                }
            }
        }
    }

    private function formatDuration($seconds): string
    {
        if (! $seconds || $seconds <= 0) {
            return '0:00';
        }

        $hours = (int) ($seconds / 3600);
        $minutes = (int) (($seconds % 3600) / 60);
        $secs = (int) ($seconds % 60);

        if ($hours > 0) {
            return sprintf('%d:%02d:%02d', $hours, $minutes, $secs);
        }

        return sprintf('%d:%02d', $minutes, $secs);
    }
}
