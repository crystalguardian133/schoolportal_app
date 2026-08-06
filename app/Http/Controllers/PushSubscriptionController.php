<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'url'],
            'keys' => ['required', 'array'],
            'keys.auth' => ['required', 'string'],
            'keys.p256dh' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        PushSubscription::updateOrCreate(
            ['endpoint' => $data['endpoint']],
            [
                'user_uuid' => $request->user()->uuid,
                'keys_auth' => $data['keys']['auth'],
                'keys_p256dh' => $data['keys']['p256dh'],
                'user_agent' => $request->userAgent(),
                'device_name' => $data['device_name'] ?? null,
            ]
        );

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'url'],
        ]);

        PushSubscription::where('endpoint', $data['endpoint'])->delete();

        return response()->json(['success' => true]);
    }
}
