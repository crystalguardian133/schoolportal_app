<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\File;

class AdminAssetController extends Controller
{
    public function listProfilePictures(Request $request)
    {
        $folder = $request->query('folder', 'students');
        $base = base_path('resources/assets/profile_pictures/'.$folder);

        if (! File::exists($base)) {
            return response()->json([]);
        }

        $files = collect(File::files($base))->map(function ($f) use ($folder) {
            return [
                'name' => $f->getFilename(),
                'url' => url('/assets/profile_pictures/'.$folder.'/'.$f->getFilename()),
            ];
        })->values()->all();

        return response()->json($files);
    }

    public function serveProfilePicture($folder, $filename)
    {
        $path = base_path('resources/assets/profile_pictures/'.trim($folder, '/').'/'.$filename);
        if (! File::exists($path)) {
            abort(404);
        }

        return response()->file($path);
    }
}
