<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('announcements', function ($user) {
    return true;
});
