<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your DNHS School Portal Credentials</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,.08); }
        .header { background: linear-gradient(135deg, #1a6e3c 0%, #2ead4c 100%); padding: 32px 40px; text-align: center; color: #fff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.3px; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.85; }
        .body { padding: 36px 40px; }
        .body p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
        .credentials-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
        .credentials-box .field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dcfce7; font-size: 14px; }
        .credentials-box .field:last-child { border-bottom: none; }
        .credentials-box .label { color: #6b7280; font-weight: 500; }
        .credentials-box .value { color: #111827; font-weight: 700; font-family: monospace; font-size: 15px; }
        .warning { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #92400e; }
        .btn { display: block; width: fit-content; margin: 24px auto 0; background: #2ead4c; color: #fff; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; }
        .footer { background: #f9fafb; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 DNHS School Portal</h1>
            <p>Dulag National High School — Dulag, Leyte</p>
        </div>
        <div class="body">
            <p>Hello, <strong>{{ $name }}</strong>!</p>
            <p>Welcome to the DNHS School Portal. Your {{ ucfirst($role) }} account has been created. Here are your login credentials:</p>
            <div class="credentials-box">
                <div class="field">
                    <span class="label">Login Email</span>
                    <span class="value">{{ $email }}</span>
                </div>
                <div class="field">
                    <span class="label">Temporary Password</span>
                    <span class="value">{{ $password }}</span>
                </div>
            </div>
            <div class="warning">
                ⚠️ <strong>Important:</strong> This is your temporary password. We recommend changing it immediately after your first login for security.
            </div>
            <p>You can access the portal by visiting the link below:</p>
            <a href="{{ config('app.url') }}/login" class="btn">Sign In to School Portal →</a>
        </div>
        <div class="footer">
            This is an automated message from the DNHS School Portal system.<br>
            If you did not expect this email, please contact the school administration.
        </div>
    </div>
</body>
</html>
