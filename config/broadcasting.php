<?php

return [

    'default' => env('BROADCAST_DRIVER', 'log'),

    'connections' => [

        'reverb' => [
            'driver' => 'reverb',
        ],

        'log' => [
            'driver' => 'log',
        ],

        'null' => [
            'driver' => 'null',
        ],

    ],

];
