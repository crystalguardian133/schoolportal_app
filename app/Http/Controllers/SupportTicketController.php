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
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $email = isset($validated['email']) ? Str::lower(trim($validated['email'])) : '';

        // Cooldown: one support thread per session/guest per 24 hours.
        $lastAt = $request->session()->get('support_ticket_last_at');
        if ($lastAt && now()->diffInHours($lastAt) < 24) {
            throw ValidationException::withMessages([
                'message' => __('You can only submit one support request per day. Please try again later.'),
            ]);
        }

        // If an email is provided, it must belong to a registered account.
        if ($email !== '' && ! \App\Models\User::where('email', $email)->exists()) {
            throw ValidationException::withMessages([
                'email' => __('No account is associated with this email address.'),
            ]);
        }

        $user = $request->user();
        $year = (int) now()->format('Y');
        $number = Report::nextTicketNumber($year);

        $report = Report::create([
            'user_id' => $user?->id,
            'contact_email' => $email !== '' ? $email : null,
            'access_token' => Str::random(64),
            'type' => 'support',
            'ticket_id' => 'DNHS'.$year.'-'.str_pad((string) $number, 4, '0', STR_PAD_LEFT),
            'ticket_year' => $year,
            'ticket_number' => $number,
            'subject' => $validated['subject'] ?: __('Account Access Help'),
            'message' => $validated['message'],
            'status' => 'pending',
        ]);

        session()->put('support_ticket_last_at', now()->toDateTimeString());
        session()->flash('support_ticket_id', $report->ticket_id);

        if (! $user) {
            session()->flash('support_thread_url', '/support/tickets/'.$report->id.'?token='.$report->access_token);
        }

        $successMsg = __('Support request submitted. Your ticket ID is :ticket.', ['ticket' => $report->ticket_id]);
        if ($email !== '') {
            $successMsg .= ' '.__('Our team will contact you at :email.', ['email' => $email]);
        }

        return back()->with('success', $successMsg);
    }

    /**
     * Guest-accessible thread view via unguessable token.
     */
    public function show(Request $request, string $report)
    {
        $report = Report::query()
            ->where('id', $report)
            ->where('type', 'support')
            ->first();

        abort_unless($report && $this->tokenMatches($request, $report), 404);

        $report->load(['replies.user']);

        return Inertia::render('support/thread', [
            'ticket' => [
                'id' => $report->id,
                'ticket_id' => $report->ticket_id,
                'subject' => $report->subject,
                'contact_email' => $report->contact_email,
                'status' => $report->status,
                'closed' => $report->closed,
                'created_at' => $report->created_at->toISOString(),
                'messages' => collect([[
                    'id' => 'op',
                    'author' => $report->contact_email ?: __('Guest'),
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
    public function reply(Request $request, string $report)
    {
        $report = Report::query()
            ->where('id', $report)
            ->where('type', 'support')
            ->first();

        abort_unless($report && $this->tokenMatches($request, $report), 404);
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

        // Support the human-friendly ticket id (e.g. DNHS-2026-0001)
        if (preg_match('/^\s*dnhs-?(\d{4})-(\d{1,6})\s*$/i', $value, $m)) {
            $ticket = Report::where('type', 'support')
                ->whereNotNull('access_token')
                ->where('ticket_id', 'DNHS'.(int) $m[1].'-'.str_pad((string) ((int) $m[2]), 4, '0', STR_PAD_LEFT))
                ->first();

            if (! $ticket) {
                $ticket = Report::where('type', 'support')
                    ->whereNotNull('access_token')
                    ->where('ticket_year', (int) $m[1])
                    ->where('ticket_number', (int) $m[2])
                    ->first();
            }

            if (! $ticket) {
                throw ValidationException::withMessages([
                    'query' => __('No support ticket was found for that ID.'),
                ]);
            }

            return redirect()->to('/support/tickets/'.$ticket->id.'?token='.$ticket->access_token);
        }

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
            'ticket_id' => $r->ticket_id,
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
