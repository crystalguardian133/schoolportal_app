<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\File;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // handle avatar upload if present
        if ($request->hasFile('avatar')) {
            $avatar = $request->file('avatar');

            $user = $request->user();
            $subfolder = 'admin&staff';
            if (method_exists($user, 'hasRole')) {
                if ($user->hasRole('student')) {
                    $subfolder = 'students';
                } elseif ($user->hasRole('teacher')) {
                    $subfolder = 'teachers';
                } else {
                    $subfolder = 'admin&staff';
                }
            }

            $destDir = base_path('resources/assets/profile_pictures/'.$subfolder);
            if (! File::exists($destDir)) {
                File::makeDirectory($destDir, 0755, true);
            }

            $filename = ($request->user()->uuid ?? uniqid()).'.'.$avatar->getClientOriginalExtension();
            $avatar->move($destDir, $filename);

            $data['profile_picture'] = 'profile_pictures/'.$subfolder.'/'.$filename;
        }

        $request->user()->fill($data);

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        /** @var \App\Models\User|null $user */
        $user = $request->user();

        Auth::logout();

        if (is_object($user) && method_exists($user, 'getAttribute')) {
            \Illuminate\Support\Facades\DB::table('users')->where('uuid', $user->uuid)->delete();
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
