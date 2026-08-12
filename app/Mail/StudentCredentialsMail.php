<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudentCredentialsMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $studentName,
        public readonly string $email,
        public readonly string $temporaryPassword,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your DNHS School Portal Login Credentials',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.student-credentials',
        );
    }
}
