<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserCredentialsMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $password,
        public readonly string $role = 'staff'
    ) {}

    public function envelope(): Envelope
    {
        $roleName = ucfirst($this->role);
        return new Envelope(
            subject: "Your DNHS School Portal {$roleName} Login Credentials",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.user-credentials',
        );
    }
}
