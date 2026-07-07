<?php

namespace Database\Seeders;

use App\Models\CommonAddress;
use Illuminate\Database\Seeder;

class CommonAddressSeeder extends Seeder
{
    public function run(): void
    {
        $addresses = [
            [
                'label' => 'Poblacion Main Street',
                'address_zone_street' => 'Main Street',
                'address_barangay' => 'Poblacion',
                'address_municipality' => 'San Mateo',
                'address_province' => 'Rizal',
            ],
            [
                'label' => 'Barangay Hall Road',
                'address_zone_street' => 'Barangay Hall Road',
                'address_barangay' => 'San Isidro',
                'address_municipality' => 'San Mateo',
                'address_province' => 'Rizal',
            ],
            [
                'label' => 'National Highway North',
                'address_zone_street' => 'National Highway',
                'address_barangay' => 'Malanday',
                'address_municipality' => 'Marikina',
                'address_province' => 'Metro Manila',
            ],
            [
                'label' => 'Central Poblacion',
                'address_zone_street' => 'Central Zone',
                'address_barangay' => 'Poblacion',
                'address_municipality' => 'Antipolo City',
                'address_province' => 'Rizal',
            ],
            [
                'label' => 'School District Center',
                'address_zone_street' => 'District Center',
                'address_barangay' => 'Mabini',
                'address_municipality' => 'Cainta',
                'address_province' => 'Rizal',
            ],
        ];

        foreach ($addresses as $address) {
            CommonAddress::query()->updateOrCreate(
                ['label' => $address['label']],
                $address
            );
        }
    }
}