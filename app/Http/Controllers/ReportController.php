<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportReply;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $reports = Report::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)
                ->orWhere('contact_email', Str::lower($user->email));
        })
            ->with(['user', 'replies.user'])
            ->latest()
            ->get();

        return Inertia::render('feedback/index', [
            'reports' => $reports,
        ]);
    }

    public function show(Report $report)
    {
        $user = auth()->user();

        // Only the report owner or a developer can view
        if ($report->user_id !== $user->id
            && $report->contact_email !== Str::lower($user->email)
            && ! $user->hasPermission('Access Developer Dashboard')) {
            abort(403);
        }

        $report->load(['user', 'replies.user']);

        return Inertia::render('feedback/show', [
            'report' => $report,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:bug,suggestion,feedback',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|max:5120',
        ]);

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $filename = Str::uuid().'.'.$image->getClientOriginalExtension();
                $path = $image->storeAs('reports', $filename, 'public');
                $imagePaths[] = $path;
            }
        }

        Report::create([
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'images' => $imagePaths ?: null,
        ]);

        return back()->with('success', 'Report submitted successfully.');
    }

    public function reply(Request $request, Report $report)
    {
        $user = $request->user();

        if ($report->user_id !== $user->id && $report->contact_email !== Str::lower($user->email) && ! $user->hasPermission('Access Developer Dashboard')) {
            abort(403);
        }

        if ($report->closed) {
            return back()->with('error', 'This thread is closed.');
        }

        $validated = $request->validate([
            'message' => 'required|string|max:2000',
            'images' => 'nullable|array|max:5',
            'images.*' => 'image|max:5120',
        ]);

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $filename = Str::uuid().'.'.$image->getClientOriginalExtension();
                $path = $image->storeAs('reports', $filename, 'public');
                $imagePaths[] = $path;
            }
        }

        ReportReply::create([
            'report_id' => $report->id,
            'user_id' => $user->id,
            'message' => $validated['message'],
            'images' => $imagePaths ?: null,
        ]);

        return back()->with('success', 'Reply sent.');
    }

    public function close(Report $report)
    {
        $user = auth()->user();

        if (! $user->hasPermission('Access Developer Dashboard') && $report->user_id !== $user->id && $report->contact_email !== Str::lower($user->email)) {
            abort(403);
        }

        $report->update(['closed' => true]);

        return back()->with('success', 'Thread closed.');
    }

    public function reopen(Report $report)
    {
        $user = auth()->user();

        if (! $user->hasPermission('Access Developer Dashboard') && $report->user_id !== $user->id && $report->contact_email !== Str::lower($user->email)) {
            abort(403);
        }

        $report->update(['closed' => false]);

        return back()->with('success', 'Thread reopened.');
    }

    public function developerIndex(Request $request)
    {
        $query = Report::with(['user', 'replies.user'])->latest();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('resolution')) {
            if ($request->resolution === 'unresolved') {
                $query->where(function ($q) {
                    $q->where('closed', false)
                        ->whereIn('status', ['pending', 'under_review']);
                });
            } elseif ($request->resolution === 'resolved') {
                $query->whereIn('status', ['accepted', 'rejected']);
            } elseif ($request->resolution === 'closed') {
                $query->where('closed', true);
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        $reports = $query->paginate(15)->withQueryString();

        $stats = [
            'total' => Report::count(),
            'pending' => Report::where('status', 'pending')->count(),
            'under_review' => Report::where('status', 'under_review')->count(),
            'accepted' => Report::where('status', 'accepted')->count(),
            'rejected' => Report::where('status', 'rejected')->count(),
            'resolved' => Report::whereIn('status', ['accepted', 'rejected'])->count(),
            'unresolved' => Report::where('closed', false)->whereIn('status', ['pending', 'under_review'])->count(),
            'closed' => Report::where('closed', true)->count(),
        ];

        return Inertia::render('developer/reports', [
            'reports' => $reports,
            'stats' => $stats,
            'filters' => $request->only(['type', 'status', 'search', 'resolution']),
        ]);
    }

    public function updateStatus(Request $request, Report $report)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,under_review,accepted,rejected',
        ]);

        if ($validated['status'] === 'accepted') {
            $validated['closed'] = true;
        }

        $report->update($validated);

        return back()->with('success', 'Report status updated.');
    }

    public function destroy(Report $report)
    {
        if ($report->images) {
            foreach ($report->images as $path) {
                $fullPath = storage_path('app/public/'.$path);
                if (file_exists($fullPath)) {
                    unlink($fullPath);
                }
            }
        }

        $report->delete();

        return back()->with('success', 'Report deleted.');
    }
}
