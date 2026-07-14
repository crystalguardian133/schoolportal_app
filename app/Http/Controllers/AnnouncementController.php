<?php

namespace App\Http\Controllers;

use App\Events\AnnouncementCreated;
use App\Models\Announcement;
use App\Models\ClassSection;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;

class AnnouncementController extends Controller
{
    private function authorizeStaff(Request $request): void
    {
        $user = $request->user();

        $hasPermission = $user && method_exists($user, 'hasPermission') && ($user->hasPermission('manage announcements') || $user->hasPermission('view announcements'));
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar') || $user->hasRole('staff'));

        if (! $user || (! $hasPermission && ! $hasRole)) {
            abort(403);
        }
    }

    private function canEdit(Request $request, Announcement $announcement): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        if ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar') || $user->hasRole('staff')) {
            return true;
        }

        if (method_exists($user, 'hasPermission') && ($user->hasPermission('manage announcements') || $user->hasPermission('view announcements'))) {
            return true;
        }

        return $announcement->created_by_user_uuid === $user->uuid;
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

    private function visibleAnnouncementsQuery(Request $request)
    {
        $user = $request->user();
        $studentSection = null;
        $classSectionUuid = null;

        if ($user && method_exists($user, 'hasRole') && $user->hasRole('student')) {
            $studentSection = $user->student?->section;
            if ($studentSection) {
                $classSectionUuid = ClassSection::query()->where('name', $studentSection)->value('uuid');
            }
        }

        $query = Announcement::query()->with(['classSection', 'creator']);

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

        return $query;
    }

    private function applySort($query, ?string $sort): void
    {
        $sort = strtolower((string) $sort);

        match ($sort) {
            'oldest' => $query->oldest(),
            'author' => $query->leftJoin('users', 'users.uuid', '=', 'announcements.created_by_user_uuid')->orderBy('users.name')->select('announcements.*'),
            default => $query->latest(),
        };
    }

    private function afterAuth($request)
    {
        $user = $request->user();

        return $user?->hasRole('admin') || $user?->hasRole('principal') || $user?->hasRole('registrar') || $user?->hasRole('staff');
    }

    private function isFullAdmin(User $user): bool
    {
        if ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar')) {
            return true;
        }

        return method_exists($user, 'hasPermission') && $user->hasPermission('access admin');
    }

    /**
     * Get sections a teacher can announce to:
     * 1. Sections where they're assigned as a subject teacher (class_section_subject_teacher)
     * 2. Their adviser section (if they are an adviser)
     */
    private function teacherAllowedSections(User $user): array
    {
        $sections = [];

        // Sections from class_section_subject_teacher with is_substitute flag
        $assignedRows = DB::table('class_section_subject_teacher')
            ->where('teacher_uuid', $user->uuid)
            ->select('class_section_uuid', 'is_substitute')
            ->get()
            ->unique('class_section_uuid');

        $sectionUuids = [];
        foreach ($assignedRows as $row) {
            $sectionUuids[] = $row->class_section_uuid;
            $sections[$row->class_section_uuid] = (bool) $row->is_substitute;
        }

        // Adviser section (never a substitute)
        if (! empty($user->is_adviser) && ! empty($user->adviser_section)) {
            $adviserSectionUuid = ClassSection::query()
                ->where('name', $user->adviser_section)
                ->value('uuid');

            if ($adviserSectionUuid && ! in_array($adviserSectionUuid, $sectionUuids, true)) {
                $sectionUuids[] = $adviserSectionUuid;
                $sections[$adviserSectionUuid] = false;
            }
        }

        return ['uuids' => array_values($sectionUuids), 'substituteMap' => $sections];
    }

    public function index(Request $request)
    {
        $this->authorizeStaff($request);

        $sort = $request->query('sort', 'latest');
        $query = Announcement::query()->with(['classSection', 'creator']);
        $this->applySort($query, $sort);

        $announcements = $query->get()->map(fn (Announcement $announcement) => [
            'uuid' => $announcement->uuid,
            'title' => $announcement->title,
            'body' => $announcement->body,
            'scope' => $announcement->scope,
            'class_section_uuid' => $announcement->class_section_uuid,
            'section_name' => $announcement->section_name,
            'created_by' => $announcement->creator?->name,
            'created_by_user_uuid' => $announcement->created_by_user_uuid,
            'target_label' => $this->announcementTargetLabel($announcement),
            'created_at' => $announcement->created_at?->toDateTimeString(),
            'image_url' => $announcement->image_path ? url('/assets/announcements/'.basename($announcement->image_path)) : null,
            'can_edit' => $this->canEdit($request, $announcement),
            'can_delete' => $this->canEdit($request, $announcement),
        ])->values()->all();

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
            'sort' => $sort,
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

        $announcement = Announcement::create([
            'title' => $data['title'],
            'body' => $data['body'],
            'scope' => $data['scope'],
            'class_section_uuid' => $data['class_section_uuid'] ?? null,
            'section_name' => $data['section_name'] ?? null,
            'image_path' => $imagePath,
            'created_by_user_uuid' => $request->user()?->uuid,
        ]);

        $announcement->load('creator');

        try {
            broadcast(new AnnouncementCreated($announcement));
        } catch (\Throwable $e) {
            // broadcast failures should not break the request
        }

        return back()->with('success', 'Announcement created successfully.');
    }

    public function update(Request $request, string $uuid)
    {
        $announcement = Announcement::query()->findOrFail($uuid);

        if (! $this->canEdit($request, $announcement)) {
            abort(403);
        }

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

        $imagePath = $announcement->image_path;
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $destDir = base_path('resources/assets/announcements');

            if (! File::exists($destDir)) {
                File::makeDirectory($destDir, 0755, true);
            }

            if ($imagePath) {
                $oldFile = base_path('resources/assets/'.$imagePath);
                if (File::exists($oldFile)) {
                    File::delete($oldFile);
                }
            }

            $baseName = $request->user()?->uuid ?: uniqid();
            $filename = $baseName.'_'.time().'.'.$image->getClientOriginalExtension();
            $image->move($destDir, $filename);

            $imagePath = 'announcements/'.$filename;
        }

        $announcement->update([
            'title' => $data['title'],
            'body' => $data['body'],
            'scope' => $data['scope'],
            'class_section_uuid' => $data['class_section_uuid'] ?? null,
            'section_name' => $data['section_name'] ?? null,
            'image_path' => $imagePath,
        ]);

        $announcement->load('creator');

        try {
            broadcast(new AnnouncementCreated($announcement));
        } catch (\Throwable $e) {
            // broadcast failures should not break the request
        }

        return back()->with('success', 'Announcement updated successfully.');
    }

    public function destroy(Request $request, string $uuid)
    {
        $announcement = Announcement::query()->findOrFail($uuid);

        if (! $this->canEdit($request, $announcement)) {
            abort(403);
        }

        if ($announcement->image_path) {
            $file = base_path('resources/assets/'.$announcement->image_path);
            if (File::exists($file)) {
                File::delete($file);
            }
        }

        $announcement->delete();

        return back()->with('success', 'Announcement deleted successfully.');
    }

    public function newCount(Request $request)
    {
        $user = $request->user();
        $since = $request->query('since');

        $query = $this->visibleAnnouncementsQuery($request);

        $total = $query->count();

        $newQuery = (clone $query);
        if ($since) {
            $newQuery->where('created_at', '>', $since);
        }
        $newCount = $newQuery->count();

        $latestUpdated = (clone $query)->max('updated_at');

        return response()->json([
            'count' => $newCount,
            'total' => $total,
            'updated_at' => $latestUpdated,
        ]);
    }

    public function teacherIndex(Request $request)
    {
        $this->authorizeStaff($request);

        $user = $request->user();
        $sort = $request->query('sort', 'latest');

        // Get allowed sections for this teacher
        $allowedData = $this->teacherAllowedSections($user);
        $allowedSectionUuids = $allowedData['uuids'];
        $substituteMap = $allowedData['substituteMap'];

        $query = Announcement::query()->with(['classSection', 'creator']);

        // Filter announcements to only show those relevant to the teacher's sections
        if (! $this->isFullAdmin($user)) {
            $query->where(function ($builder) use ($allowedSectionUuids, $user) {
                // System-wide announcements
                $builder->where('scope', 'system');

                // Class-wide announcements for sections they teach
                if (! empty($allowedSectionUuids)) {
                    $builder->orWhere(function ($classQuery) use ($allowedSectionUuids) {
                        $classQuery->where('scope', 'class')
                            ->whereIn('class_section_uuid', $allowedSectionUuids);
                    });
                }

                // Section-wide announcements for their allowed sections
                if (! empty($allowedSectionUuids)) {
                    $allowedNames = ClassSection::whereIn('uuid', $allowedSectionUuids)->pluck('name')->toArray();
                    if (! empty($allowedNames)) {
                        $builder->orWhere(function ($sectionQuery) use ($allowedNames) {
                            $sectionQuery->where('scope', 'section')
                                ->whereIn('section_name', $allowedNames);
                        });
                    }
                }

                // Announcements they created
                $builder->orWhere('created_by_user_uuid', $user->uuid);
            });
        }

        $this->applySort($query, $sort);

        $announcements = $query->get()->map(fn (Announcement $announcement) => [
            'uuid' => $announcement->uuid,
            'title' => $announcement->title,
            'body' => $announcement->body,
            'scope' => $announcement->scope,
            'target_label' => $this->announcementTargetLabel($announcement),
            'created_by' => $announcement->creator?->name,
            'created_by_user_uuid' => $announcement->created_by_user_uuid,
            'created_at' => $announcement->created_at?->toDateTimeString(),
            'image_url' => $announcement->image_path ? url('/assets/announcements/'.basename($announcement->image_path)) : null,
            'can_edit' => $this->canEdit($request, $announcement),
            'can_delete' => $this->canEdit($request, $announcement),
        ])
            ->values()
            ->all();

        // Get allowed sections for the creation form
        $allowedSections = ClassSection::query()
            ->whereIn('uuid', $allowedSectionUuids)
            ->select(['uuid', 'name', 'grade_level'])
            ->orderBy('name')
            ->get()
            ->map(fn (ClassSection $section) => [
                'uuid' => $section->uuid,
                'name' => $section->name,
                'grade_level' => $section->grade_level,
                'is_substitute' => $substituteMap[$section->uuid] ?? false,
            ])
            ->values()
            ->all();

        // Adviser section info
        $isAdviser = ! empty($user->is_adviser);
        $adviserSectionUuid = null;
        if ($isAdviser && ! empty($user->adviser_section)) {
            $adviserSectionUuid = ClassSection::query()
                ->where('name', $user->adviser_section)
                ->value('uuid');
        }

        // All sections (for admin section-wide scope)
        $allSections = [];
        if ($this->isFullAdmin($user)) {
            $allSections = ClassSection::query()
                ->select(['uuid', 'name', 'grade_level'])
                ->orderBy('name')
                ->get()
                ->map(fn (ClassSection $section) => [
                    'uuid' => $section->uuid,
                    'name' => $section->name,
                    'grade_level' => $section->grade_level,
                ])
                ->values()
                ->all();
        }

        return inertia('teacher/announcements', [
            'announcements' => $announcements,
            'allowedSections' => $allowedSections,
            'allSections' => $allSections,
            'isFullAdmin' => $this->isFullAdmin($user),
            'isAdviser' => $isAdviser,
            'adviserSectionUuid' => $adviserSectionUuid,
            'sort' => $sort,
        ]);
    }

    public function teacherStore(Request $request)
    {
        $this->authorizeStaff($request);

        $user = $request->user();
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'scope' => 'required|in:system,class,section',
            'class_section_uuid' => 'nullable|uuid|exists:class_sections,uuid',
            'section_name' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:4096',
        ]);

        // Only full admins can make system-wide announcements
        if ($data['scope'] === 'system' && ! $this->isFullAdmin($user)) {
            return back()->with('error', 'You do not have permission to create system-wide announcements.');
        }

        $allowedData = $this->teacherAllowedSections($user);
        $allowedSectionUuids = $allowedData['uuids'];

        if ($data['scope'] === 'class') {
            if (empty($data['class_section_uuid'])) {
                return back()->with('error', 'Choose a class section for class-wide announcements.');
            }
            // Class scope restricted to adviser section
            $isAdviser = ! empty($user->is_adviser);
            if (! $isAdviser) {
                return back()->with('error', 'Only advisers can create class-wide announcements.');
            }
            $adviserUuid = ClassSection::query()->where('name', $user->adviser_section)->value('uuid');
            if ($data['class_section_uuid'] !== $adviserUuid) {
                return back()->with('error', 'Class-wide announcements can only target your adviser section.');
            }
            $data['section_name'] = null;
        }

        if ($data['scope'] === 'section') {
            if ($this->isFullAdmin($user)) {
                // Admin: validate section_name exists as a class section
                if (empty($data['section_name'])) {
                    return back()->with('error', 'Choose a section for section-wide announcements.');
                }
                $exists = ClassSection::where('name', $data['section_name'])->exists();
                if (! $exists) {
                    return back()->with('error', 'Section not found.');
                }
            } else {
                // Teacher: section_name must match one of their assigned sections or adviser section
                if (empty($data['section_name'])) {
                    return back()->with('error', 'Choose a section for section-wide announcements.');
                }
                $allowedNames = ClassSection::whereIn('uuid', $allowedSectionUuids)->pluck('name')->toArray();
                if (! in_array($data['section_name'], $allowedNames)) {
                    return back()->with('error', 'You are not assigned to this section.');
                }
            }
            $data['class_section_uuid'] = null;
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $destDir = base_path('resources/assets/announcements');

            if (! File::exists($destDir)) {
                File::makeDirectory($destDir, 0755, true);
            }

            $baseName = $user->uuid ?: uniqid();
            $filename = $baseName.'_'.time().'.'.$image->getClientOriginalExtension();
            $image->move($destDir, $filename);

            $imagePath = 'announcements/'.$filename;
        }

        $announcement = Announcement::create([
            'title' => $data['title'],
            'body' => $data['body'],
            'scope' => $data['scope'],
            'class_section_uuid' => $data['class_section_uuid'] ?? null,
            'section_name' => $data['section_name'] ?? null,
            'image_path' => $imagePath,
            'created_by_user_uuid' => $user->uuid,
        ]);

        $announcement->load('creator');

        try {
            broadcast(new AnnouncementCreated($announcement));
        } catch (\Throwable $e) {
            // broadcast failures should not break the request
        }

        return back()->with('success', 'Announcement created successfully.');
    }

    public function studentIndex(Request $request)
    {
        $sort = $request->query('sort', 'latest');
        $query = $this->visibleAnnouncementsQuery($request);
        $this->applySort($query, $sort);

        $announcements = $query->get()->map(fn (Announcement $announcement) => [
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
            'sort' => $sort,
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