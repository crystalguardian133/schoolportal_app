<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PreferencesController extends Controller
{
    /**
     * Server-side defaults. The client merges stored prefs over these, so
     * new keys roll out as defaults for existing users automatically.
     */
    public const DEFAULTS = [
        'accent' => 'default',
        'customAccent' => null,
        'appearance' => 'system', // light | dark | system
        'radius' => 'm', // s | m | l | xl
        'reduceMotion' => false,
        'sidebar' => 'remember', // expanded | collapsed | remember
        'density' => 'comfortable', // comfortable | compact
        'fontScale' => 'm', // s | m | l
        'contentWidth' => 'comfortable', // narrow | comfortable | wide | full
        'borderStyle' => 'default', // subtle | default | strong
        'surfaceStyle' => 'plain', // plain | elevated | glass
        'blur' => false,
        'shadowIntensity' => 'subtle', // none | subtle | medium | strong
        'focusStyle' => 'default', // default | brand | none
        'uiStyle' => 'default', // default | minimal | modern
        'widgets' => [], // [{ section: string, hidden: string[], order: string[] }]
    ];

    private const ACCENTS = ['default', 'emerald', 'violet', 'amber', 'rose', 'slate', 'sky', 'orange', 'teal', 'pink', 'cyan', 'fuchsia', 'custom'];
    private const SIDEBARS = ['expanded', 'collapsed', 'remember'];
    private const DENSITIES = ['comfortable', 'compact'];
    private const FONT_SCALES = ['s', 'm', 'l'];
    private const RADII = ['s', 'm', 'l', 'xl'];
    private const CONTENT_WIDTHS = ['narrow', 'comfortable', 'wide', 'full'];
    private const BORDER_STYLES = ['subtle', 'default', 'strong'];
    private const SURFACE_STYLES = ['plain', 'elevated', 'glass'];
    private const SHADOWS = ['none', 'subtle', 'medium', 'strong'];
    private const FOCUS_STYLES = ['default', 'brand', 'none'];
    private const UI_STYLES = ['default', 'minimal', 'modern'];

    public static function forUser($user): array
    {
        $stored = $user?->preferences;
        if (! is_array($stored)) {
            $stored = [];
        }

        return array_merge(self::DEFAULTS, array_intersect_key($stored, self::DEFAULTS));
    }

    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'preferences' => self::forUser($request->user()),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'accent' => 'sometimes|string|in:' . implode(',', self::ACCENTS),
            'customAccent' => 'sometimes|nullable|string|regex:/^#[0-9a-fA-F]{6}$/|max:7',
            'appearance' => 'sometimes|string|in:light,dark,system',
            'radius' => 'sometimes|string|in:' . implode(',', self::RADII),
            'reduceMotion' => 'sometimes|boolean',
            'sidebar' => 'sometimes|string|in:' . implode(',', self::SIDEBARS),
            'density' => 'sometimes|string|in:' . implode(',', self::DENSITIES),
            'fontScale' => 'sometimes|string|in:' . implode(',', self::FONT_SCALES),
            'contentWidth' => 'sometimes|string|in:' . implode(',', self::CONTENT_WIDTHS),
            'borderStyle' => 'sometimes|string|in:' . implode(',', self::BORDER_STYLES),
            'surfaceStyle' => 'sometimes|string|in:' . implode(',', self::SURFACE_STYLES),
            'blur' => 'sometimes|boolean',
            'shadowIntensity' => 'sometimes|string|in:' . implode(',', self::SHADOWS),
            'focusStyle' => 'sometimes|string|in:' . implode(',', self::FOCUS_STYLES),
            'uiStyle' => 'sometimes|string|in:' . implode(',', self::UI_STYLES),
            'widgets' => 'sometimes|array',
            'widgets.*.section' => 'required_with:widgets|string|max:50',
            'widgets.*.hidden' => 'sometimes|array',
            'widgets.*.hidden.*' => 'string|max:50',
            'widgets.*.order' => 'sometimes|array',
            'widgets.*.order.*' => 'string|max:50',
        ]);

        $user = $request->user();
        $stored = $user->preferences;
        if (! is_array($stored)) {
            $stored = [];
        }

        // Deep-merge so partial PATCHes never wipe sibling keys.
        $user->preferences = array_merge($stored, $data);
        $user->save();

        return response()->json([
            'preferences' => self::forUser($user->fresh()),
        ]);
    }
}
