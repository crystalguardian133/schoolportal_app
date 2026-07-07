<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommonAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'label',
        'address_zone_street',
        'address_barangay',
        'address_municipality',
        'address_province',
    ];
}