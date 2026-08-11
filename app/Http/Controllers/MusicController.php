<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;
use Inertia\Inertia;

class MusicController extends Controller
{
    private string $cacheDir;

    public function __construct()
    {
        $this->cacheDir = storage_path('app/music-cache');
        if (! is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }

    public function index()
    {
        $this->authorizeMusic();

        return Inertia::render('developer/music');
    }

    public function search(Request $request)
    {
        $this->authorizeMusic();

        $request->validate([
            'query' => ['required', 'string', 'max:200'],
        ]);

        $query = $request->input('query');
        $count = 20;

        $result = Process::timeout(60)->run([
            'yt-dlp',
            '--flat-playlist',
            '--dump-json',
            '--no-warnings',
            '--no-playlist',
            '--extractor-args', 'youtube:player_client=web',
            "ytsearch{$count}:{$query}",
        ]);

        if ($result->exitCode() !== 0) {
            \Log::error('Music search failed', [
                'query' => $query,
                'exit_code' => $result->exitCode(),
                'stderr' => substr($result->errorOutput(), 0, 1000),
            ]);

            $isMissing = str_contains($result->errorOutput(), 'not found')
                || str_contains($result->errorOutput(), 'No such file');

            return response()->json([
                'error' => $isMissing
                    ? 'yt-dlp is not installed in this environment. Add it to the Docker image to enable music search.'
                    : 'Music search failed. Check the server logs for details.',
                'results' => [],
            ], 500);
        }

        $lines = array_filter(explode("\n", trim($result->output())));
        $results = [];

        foreach ($lines as $line) {
            $json = json_decode($line, true);
            if (! $json || empty($json['id'])) {
                continue;
            }

            $results[] = [
                'id' => $json['id'] ?? null,
                'title' => $json['title'] ?? 'Unknown',
                'duration' => $json['duration'] ?? null,
                'duration_string' => $this->formatDuration($json['duration'] ?? 0),
                'channel' => $json['channel'] ?? $json['uploader'] ?? 'Unknown',
                'thumbnail' => $json['thumbnail'] ?? "https://img.youtube.com/vi/{$json['id']}/hqdefault.jpg",
                'view_count' => $json['view_count'] ?? null,
            ];
        }

        return response()->json([
            'results' => $results,
            'total' => count($results),
        ]);
    }

    public function stream(Request $request)
    {
        $this->authorizeMusic();

        $request->validate([
            'video_id' => ['required', 'string', 'max:20'],
        ]);

        $videoId = $request->input('video_id');
        $safeId = preg_replace('/[^a-zA-Z0-9_-]/', '', $videoId);

        $this->cleanupExpiredFiles();

        $cached = $this->getCachedFile($safeId);
        if ($cached) {
            return $this->serveFile($cached);
        }

        $url = "https://www.youtube.com/watch?v={$safeId}";

        try {
            $result = Process::timeout(120)->run([
                'yt-dlp',
                '-f', 'bestaudio',
                '--no-warnings',
                '--no-playlist',
                '--concurrent-fragments', '8',
                '--buffer-size', '16K',
                '--http-chunk-size', '10485760',
                '-o', $this->cacheDir . '/' . $safeId . '.%(ext)s',
                $url,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Music stream process error', ['video_id' => $safeId, 'error' => $e->getMessage()]);
            return response()->json(['error' => 'Audio download timed out or failed.'], 504);
        }

        $foundFile = $this->getCachedFile($safeId);

        if ($result->exitCode() !== 0 || ! $foundFile) {
            \Log::error('Music stream failed', [
                'video_id' => $safeId,
                'exit_code' => $result->exitCode(),
                'stderr' => $result->errorOutput(),
                'stdout' => substr($result->output(), 0, 500),
            ]);
            return response()->json(['error' => 'Failed to download audio.', 'detail' => $result->errorOutput()], 400);
        }

        $this->touchTimestamp($safeId);

        return $this->serveFile($foundFile);
    }

    private function getCachedFile(string $videoId): ?string
    {
        $patterns = [
            $this->cacheDir . '/' . $videoId . '.m4a',
            $this->cacheDir . '/' . $videoId . '.webm',
            $this->cacheDir . '/' . $videoId . '.mp3',
            $this->cacheDir . '/' . $videoId . '.opus',
            $this->cacheDir . '/' . $videoId . '.ogg',
        ];

        foreach ($patterns as $path) {
            if (file_exists($path) && filesize($path) > 0) {
                return $path;
            }
        }

        // Fallback: glob search
        foreach (glob($this->cacheDir . '/' . $videoId . '.*') as $f) {
            if (is_file($f) && ! str_ends_with($f, '.meta') && filesize($f) > 0) {
                return $f;
            }
        }

        return null;
    }

    private function touchTimestamp(string $videoId): void
    {
        $metaFile = $this->cacheDir . '/' . $videoId . '.meta';
        file_put_contents($metaFile, (string) time());
    }

    private function serveFile(string $filePath): \Symfony\Component\HttpFoundation\Response
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

        foreach (glob($this->cacheDir . '/*.meta') as $metaFile) {
            $timestamp = (int) file_get_contents($metaFile);
            if ($now - $timestamp > $ttl) {
                $base = str_replace('.meta', '', $metaFile);
                @unlink($metaFile);
                foreach (glob($base . '.*') as $f) {
                    @unlink($f);
                }
            }
        }
    }

    public function preCache(Request $request)
    {
        $this->authorizeMusic();

        $request->validate([
            'video_id' => ['required', 'string', 'max:20'],
        ]);

        $videoId = $request->input('video_id');
        $safeId = preg_replace('/[^a-zA-Z0-9_-]/', '', $videoId);

        $cached = $this->getCachedFile($safeId);
        if ($cached) {
            $this->touchTimestamp($safeId);
            return response()->json(['status' => 'cached', 'video_id' => $safeId]);
        }

        $url = "https://www.youtube.com/watch?v={$safeId}";

        try {
            $result = Process::timeout(120)->run([
                'yt-dlp',
                '-f', 'bestaudio',
                '--no-warnings',
                '--no-playlist',
                '--concurrent-fragments', '8',
                '--buffer-size', '16K',
                '--http-chunk-size', '10485760',
                '-o', $this->cacheDir . '/' . $safeId . '.%(ext)s',
                $url,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Music pre-cache process error', ['video_id' => $safeId, 'error' => $e->getMessage()]);
            return response()->json(['status' => 'error', 'error' => 'Download timed out.'], 504);
        }

        if ($result->exitCode() !== 0) {
            \Log::error('Music pre-cache failed', [
                'video_id' => $safeId,
                'exit_code' => $result->exitCode(),
                'stderr' => $result->errorOutput(),
            ]);
            return response()->json(['status' => 'error', 'error' => 'Failed to download.'], 400);
        }

        $this->touchTimestamp($safeId);

        return response()->json(['status' => 'downloaded', 'video_id' => $safeId]);
    }

    public function checkCached(Request $request)
    {
        $this->authorizeMusic();

        $videoIds = $request->input('video_ids', []);
        $cached = [];

        foreach ($videoIds as $id) {
            $safeId = preg_replace('/[^a-zA-Z0-9_-]/', '', $id);
            if ($this->getCachedFile($safeId)) {
                $cached[] = $safeId;
            }
        }

        return response()->json(['cached' => $cached]);
    }

    private function authorizeMusic(): void
    {
        $user = request()->user();

        if (! $user) {
            abort(401);
        }

        $hasPerm = $user->activeRoles()->whereHas('permissions', function ($q) {
            $q->whereRaw('LOWER(name) = ?', ['access music player']);
        })->exists();

        if (! $hasPerm) {
            abort(403, 'Only the developer role can access the music player.');
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
