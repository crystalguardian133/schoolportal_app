<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your DNHS School Portal Credentials</title>
    <style>
        /* Reset */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
        img { -ms-interpolation-mode: bicubic; }

        body { margin: 0; padding: 0; width: 100%; background-color: #f2f4f7; font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1f2937; }
        .wrap { width: 100%; background-color: #f2f4f7; padding: 32px 0; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 32px rgba(0,0,0,.08); }
        .hero { background: linear-gradient(135deg, #14532d 0%, #15803d 55%, #16a34a 100%); padding: 36px 40px 32px; text-align: center; }
        .hero .logo { width: 96px; height: 96px; border-radius: 50%; background: #ffffff; padding: 8px; object-fit: cover; box-shadow: 0 6px 16px rgba(0,0,0,.16); margin-bottom: 14px; }
        .hero h1 { margin: 0; font-size: 24px; letter-spacing: .4px; color: #ffffff; font-weight: 700; }
        .hero p { margin: 6px 0 0; font-size: 13px; color: #dcfce7; opacity: .95; letter-spacing: .2px; }

        .body { padding: 34px 40px 30px; }
        .body p { font-size: 15px; line-height: 1.65; margin: 0 0 14px; color: #374151; }
        .body p strong { color: #111827; }

        .creds { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 6px 0; margin: 22px 0; }
        .creds .field { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; padding: 13px 22px; border-bottom: 1px solid #dcfce7; }
        .creds .field:last-child { border-bottom: none; }
        .creds .label { font-size: 13px; color: #15803d; font-weight: 600; letter-spacing: .3px; text-transform: uppercase; }
        .creds .value { font-size: 14px; color: #111827; font-weight: 700; font-family: 'Courier New', monospace; word-break: break-all; }

        .note { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 20px 0 0; font-size: 13px; line-height: 1.55; color: #92400e; }
        .center { text-align: center; margin-top: 26px; }
        .btn { display: inline-block; background: #15803d; color: #ffffff; text-decoration: none; padding: 13px 34px; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: .2px; }

        .lead { text-align: center; margin-top: 26px; }
        .lead p { font-size: 13px; color: #6b7280; margin: 0; }

        .footer { background: #f8fafc; padding: 20px 40px; text-align: center; font-size: 12px; line-height: 1.7; color: #94a3b8; border-top: 1px solid #eef2f7; }
        .footer a { color: #15803d; text-decoration: none; }

        @media (max-width: 640px) {
            .card { border-radius: 0; }
            .hero, .body, .footer { padding-left: 24px; padding-right: 24px; }
        }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="card">
            <div class="hero">
                <img src="{{ asset(config('app.icon_small')) }}" alt="DNHS Logo" class="logo" width="96" height="96">
                <h1>DNHS School Portal</h1>
                <p>Dulag National High School &bull; Dulag, Leyte</p>
            </div>

            <div class="body">
                <p>Hello, <strong>{{ $name }}</strong>,</p>
                <p>Welcome to the DNHS School Portal. Your <strong>{{ ucfirst($role) }}</strong> account has been created successfully. Here are your secure login credentials:</p>

                <div class="creds">
                    <div class="field">
                        <span class="label">Login Email</span>
                        <span class="value">{{ $email }}</span>
                    </div>
                    <div class="field">
                        <span class="label">Temporary Password</span>
                        <span class="value">{{ $password }}</span>
                    </div>
                </div>

                <div class="note">
                    <strong>Important:</strong> This is your temporary password and is provided for your first login only. For your security, please change it immediately after signing in.
                </div>

                <div class="center">
                    <a href="{{ config('app.url') }}/login" class="btn">Sign In to School Portal &rarr;</a>
                </div>

                <div class="lead">
                    <p>Your login email is <strong>{{ $email }}</strong>. Keep these details private.</p>
                </div>
            </div>

            <div class="footer">
                This is an automated message from the DNHS School Portal system.<br>
                If you did not expect this email, please contact the school administration.
            </div>
        </div>
    </div>
</body>
</html>