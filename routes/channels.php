<?php

// NOTE: the realtime `announcements` channel is PUBLIC
// (see broadcastOn() in app/Events/AnnouncementCreated.php), so no
// authorization callback runs for it. Per-user visibility is enforced
// server-side in GET /announcements/recent, which is what clients refetch
// when a broadcast arrives. If this channel ever becomes private, register
// `Broadcast::routes()` and add an auth callback here.
