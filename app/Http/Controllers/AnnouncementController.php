<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\ClassSection;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;

class AnnouncementController extends Controller
{
    private function authorizeStaff(Request $request): void
    {
        $user = $request->user();

        if (! $user || ! method_exists($user, 'hasRole') || (! $user->hasRole('admin') && ! $user->hasRole('principal') && ! $user->hasRole('registrar') && ! $user->hasRole('staff'))) {
            abort(403);
        }
    }

    private function visibleAnnouncementsFor(Request $request, bool $includeAll = false)
    {
        $user = $request->user();

        if ($includeAll) {
            return Announcement::query()
                ->with(['classSection', 'creator'])
                ->latest()
                ->get();
        }

        $studentSection = null;
        $classSectionUuid = null;

        if ($user && method_exists($user, 'hasRole') && $user->hasRole('student')) {
            $studentSection = $user->student?->section;
            if ($studentSection) {
                $classSectionUuid = ClassSection::query()->where('name', $studentSection)->value('uuid');
            }
        }

        $query = Announcement::query()->with(['classSection', 'creator'])->latest();

        if ($user && method_exists($user, 'hasRole') && $user->hasRole('student')) {
            $query->where(function ($builder) use ($studentSection, $classSectionUuid) {
                $builder->where('scope', 'system');

                if ($studentSection !== null) {
                    $builder->orWhere(function ($sectionQuery) use ($studentSection) {
                        $sectionQuery->where('scope', 'section')
                            ->where('section_name', $studentSection);
                    });
                }

                if ($classSectionUuid !== null) {
                    $builder->orWhere(function ($classQuery) use ($classSectionUuid) {
                        $classQuery->where('scope', 'class')
                            ->where('class_section_uuid', $classSectionUuid);
                    });
                }
            });
        }

        return $query->get();
    }

    public function index(Request $request)
    {
        $this->authorizeStaff($request);

        $announcements = Announcement::query()
            ->with(['classSection', 'creator'])
            ->latest()
            ->get()
            ->map(fn (Announcement $announcement) => [
                'uuid' => $announcement->uuid,
                'title' => $announcement->title,
                'body' => $announcement->body,
                'scope' => $announcement->scope,
                'class_section_uuid' => $announcement->class_section_uuid,
                'section_name' => $announcement->section_name,
                'created_by' => $announcement->creator?->name,
                'target_label' => $this->announcementTargetLabel($announcement),
                'created_at' => $announcement->created_at?->toDateTimeString(),
                'image_url' => $announcement->image_path ? url('/assets/announcements/'.basename($announcement->image_path)) : null,
            ])
            ->values()
            ->all();

        $classSections = ClassSection::query()
            ->select(['uuid', 'name', 'grade_level'])
            ->get()
            ->map(fn (ClassSection $section) => [
                'uuid' => $section->uuid,
                'name' => $section->name,
                'grade_level' => $section->grade_level,
            ])
            ->values()
            ->all();

        $sectionNames = Student::query()
            ->select(['section'])
            ->distinct()
            ->get()
            ->pluck('section')
            ->filter()
            ->values()
            ->all();

        return inertia('admin/announcements', [
            'announcements' => $announcements,
            'classSections' => $classSections,
            'sectionNames' => $sectionNames,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeStaff($request);

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'scope' => 'required|in:system,class,section',
            'class_section_uuid' => 'nullable|uuid|exists:class_sections,uuid',
            'section_name' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:4096',
        ]);

        if ($data['scope'] === 'class' && empty($data['class_section_uuid'])) {
            return back()->with('error', 'Choose a class section for class-wide announcements.');
        }

        if ($data['scope'] === 'section' && empty($data['section_name'])) {
            return back()->with('error', 'Choose a section for section-wide announcements.');
        }

        if ($data['scope'] === 'system') {
            $data['class_section_uuid'] = null;
            $data['section_name'] = null;
        }

        if ($data['scope'] === 'class') {
            $data['section_name'] = null;
        }

        if ($data['scope'] === 'section') {
            $data['class_section_uuid'] = null;
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $destDir = base_path('resources/assets/announcements');

            if (! File::exists($destDir)) {
                File::makeDirectory($destDir, 0755, true);
            }

            $baseName = $request->user()?->uuid ?: uniqid();
            $filename = $baseName.'_'.time().'.'.$image->getClientOriginalExtension();
            $image->move($destDir, $filename);

            $imagePath = 'announcements/'.$filename;
        }

        Announcement::create([
            'title' => $data['title'],
            'body' => $data['body'],
            'scope' => $data['scope'],
            'class_section_uuid' => $data['class_section_uuid'] ?? null,
            'section_name' => $data['section_name'] ?? null,
            'image_path' => $imagePath,
            'created_by_user_uuid' => $request->user()?->uuid,
        ]);

        return back()->with('success', 'Announcement created successfully.');
    }

    public function teacherIndex(Request $request)
    {
        $this->authorizeStaff($request);

        return inertia('teacher/announcements', [
            'announcements' => $this->visibleAnnouncementsFor($request, $request->user()?->hasRole('admin') || $request->user()?->hasRole('principal') || $request->user()?->hasRole('registrar') || $request->user()?->hasRole('staff'))
                ->map(fn (Announcement $announcement) => [
                    'uuid' => $announcement->uuid,
                    'title' => $announcement->title,
                    'body' => $announcement->body,
                    'scope' => $announcement->scope,
                    'target_label' => $this->announcementTargetLabel($announcement),
                    'created_by' => $announcement->creator?->name,
                    'created_at' => $announcement->created_at?->toDateTimeString(),
                    'image_url' => $announcement->image_path ? url('/assets/announcements/'.basename($announcement->image_path)) : null,
                ])
                ->values()
                ->all(),
        ]);
    }

    public function studentIndex(Request $request)
    {
        $announcements = $this->visibleAnnouncementsFor($request)
            ->map(fn (Announcement $announcement) => [
                'uuid' => $announcement->uuid,
                'title' => $announcement->title,
                'body' => $announcement->body,
                'scope' => $announcement->scope,
                'target_label' => $this->announcementTargetLabel($announcement),
                'created_by' => $announcement->creator?->name,
                'created_at' => $announcement->created_at?->toDateTimeString(),
                'image_url' => $announcement->image_path ? url('/assets/announcements/'.basename($announcement->image_path)) : null,
            ])
            ->values()
            ->all();

        return inertia('student/announcements', [
            'announcements' => $announcements,
        ]);
    }

    private function announcementTargetLabel(Announcement $announcement): string
    {
        return match ($announcement->scope) {
            'system' => 'System wide',
            'class' => $announcement->classSection?->name ? 'Class wide: '.$announcement->classSection->name : 'Class wide',
            'section' => $announcement->section_name ? 'Section wide: '.$announcement->section_name : 'Section wide',
            default => 'Unknown scope',
        };
    }

    public function serveImage(string $filename)
    {
        $path = base_path('resources/assets/announcements/'.$filename);

        if (! File::exists($path)) {
            abort(404);
        }

        return response()->file($path);
    }
}
