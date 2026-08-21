<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportReply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SupportTicketController extends Controller
{
    /**
     * Public ticket creation — used by locked-out users on the login page.
     */
    public function store(Request $request)
    {
        $ipKey = 'support-ticket:' . $request->ip();
        if (RateLimiter::tooManyAttempts($ipKey, 3)) {
            $seconds = RateLimiter::availableIn($ipKey);

            throw \Illuminate\Validation\ValidationException::withMessages([
                'message' => __('Too many support requests. Please try again in :seconds seconds.', ['seconds' => $seconds]),
            ]);
        }
        RateLimiter::hit($ipKey, 3600);

        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $user = $request->user();

        $report = Report::create([
            'user_id' => $user?->id,
            'contact_email' => Str::lower($validated['email']),
            'access_token' => Str::random(64),
            'type' => 'support',
            'subject' => $validated['subject'] ?: __('Account Access Help'),
            'message' => $validated['message'],
            'status' => 'pending',
        ]);

        if (!$user) {
            session()->flash('support_thread_url', '/support/tickets/' . $report->id . '?token=' . $report->access_token);
        }

        return back()->with('success', __('Support request submitted. Our team will contact you at :email.', ['email' => $validated['email']]));
    }

    /**
     * Guest-accessible thread view via unguessable token.
     */
    public function show(Request $request, Report $report)
    {
        abort_unless($this->tokenMatches($request, $report), 404);

        $report->load(['replies.user']);

        return Inertia::render('support/thread', [
            'ticket' => [
                'id' => $report->id,
                'subject' => $report->subject,
                'status' => $report->status,
                'closed' => $report->closed,
                'created_at' => $report->created_at->toISOString(),
                'messages' => collect([[
                    'id' => 'op',
                    'author' => $report->contact_email,
                    'is_staff' => false,
                    'message' => $report->message,
                    'images' => null,
                    'created_at' => $report->created_at->toISOString(),
                ]])->merge($report->replies->map(fn (ReportReply $r) => [
                    'id' => $r->id,
                    'author' => $r->user?->name ?? __('Staff'),
                    'is_staff' => $r->user && $r->user->hasPermission('Access Developer Dashboard'),
                    'message' => $r->message,
                    'images' => $r->images,
                    'created_at' => $r->created_at->toISOString(),
                ]))->values()->all(),
            ],
            'token' => $report->access_token,
        ]);
    }

    /**
     * Guest reply to their own ticket.
     */
    public function reply(Request $request, Report $report)
    {
        abort_unless($this->tokenMatches($request, $report), 404);
        abort_if($report->closed, 422, 'This thread is closed.');

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        ReportReply::create([
            'report_id' => $report->id,
            'user_id' => null,
            'message' => $validated['message'],
        ]);

        return redirect()
            ->to('/support/tickets/' . $report->id . '?token=' . $report->access_token)
            ->with('success', __('Reply sent.'));
    }

    private function tokenMatches(Request $request, Report $report): bool
    {
        return $report->type === 'support'
            && $report->access_token !== null
            && hash_equals($report->access_token, (string) $request->query('token', ''));
    }
}
