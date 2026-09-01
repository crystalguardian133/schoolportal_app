<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportReply;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SupportTicketController extends Controller
{
    /**
     * Public ticket creation — used by locked-out users on the login page.
     */
    public function store(Request $request)
    {
        $ipKey = 'support-ticket:'.$request->ip();
        if (RateLimiter::tooManyAttempts($ipKey, 3)) {
            $seconds = RateLimiter::availableIn($ipKey);

            throw ValidationException::withMessages([
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

        if (! $user) {
            session()->flash('support_thread_url', '/support/tickets/'.$report->id.'?token='.$report->access_token);
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
            ->to('/support/tickets/'.$report->id.'?token='.$report->access_token)
            ->with('success', __('Reply sent.'));
    }

    /**
     * Public lookup form so guests can find their ticket without the original link.
     */
    public function lookupPage()
    {
        return Inertia::render('support/lookup', [
            'query' => null,
            'open_tickets' => [],
            'resolved_tickets' => [],
        ]);
    }

    /**
     * Find a ticket by email address or ticket ID prefix and hand back thread links.
     */
    public function lookup(Request $request)
    {
        $ipKey = 'support-lookup:'.$request->ip();
        if (RateLimiter::tooManyAttempts($ipKey, 10)) {
            $seconds = RateLimiter::availableIn($ipKey);

            throw ValidationException::withMessages([
                'query' => __('Too many lookups. Please try again in :seconds seconds.', ['seconds' => $seconds]),
            ]);
        }
        RateLimiter::hit($ipKey, 60);

        $validated = $request->validate([
            'query' => ['required', 'string', 'min:6', 'max:255'],
        ]);

        $value = trim($validated['query']);

        if (str_contains($value, '@')) {
            $tickets = Report::where('type', 'support')
                ->whereNotNull('access_token')
                ->where('contact_email', Str::lower($value))
                ->orderByDesc('created_at')
                ->get();

            if ($tickets->isEmpty()) {
                throw ValidationException::withMessages([
                    'query' => __('No support tickets were found for that email address.'),
                ]);
            }

            $open = $tickets->where('closed', false)->values();
            $resolved = $tickets->where('closed', true)->values();

            if ($open->count() === 1 && $resolved->isEmpty()) {
                return redirect()->to('/support/tickets/'.$open[0]->id.'?token='.$open[0]->access_token);
            }

            return Inertia::render('support/lookup', [
                'query' => $value,
                'open_tickets' => $this->presentTickets($open),
                'resolved_tickets' => $this->presentTickets($resolved),
            ]);
        }

        $matches = Report::where('type', 'support')
            ->whereNotNull('access_token')
            ->where('id', 'like', Str::lower($value).'%')
            ->get();

        if ($matches->count() === 1) {
            return redirect()->to('/support/tickets/'.$matches[0]->id.'?token='.$matches[0]->access_token);
        }

        throw ValidationException::withMessages([
            'query' => $matches->isEmpty()
                ? __('No support ticket matches that ID. It starts with the first 8 characters shown on your thread.')
                : __('That ID matches multiple tickets. Type a few more characters.'),
        ]);
    }

    /**
     * @param  Collection<int, Report>  $tickets
     * @return array<int, array<string, mixed>>
     */
    private function presentTickets($tickets)
    {
        return $tickets->map(fn (Report $r) => [
            'id' => $r->id,
            'subject' => $r->subject,
            'status' => $r->status,
            'created_at' => $r->created_at->toISOString(),
            'url' => '/support/tickets/'.$r->id.'?token='.$r->access_token,
        ])->all();
    }

    private function tokenMatches(Request $request, Report $report): bool
    {
        return $report->type === 'support'
            && $report->access_token !== null
            && hash_equals($report->access_token, (string) $request->query('token', ''));
    }
}
