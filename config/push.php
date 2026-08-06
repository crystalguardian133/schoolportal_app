<?php

return [

    'enabled' => (bool) env('PUSH_ENABLED', false),

    'vapid' => [
        'subject' => env('VAPID_SUBJECT', 'mailto:admin@dnhs.edu.ph'),
        'public_key' => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
    ],

];
