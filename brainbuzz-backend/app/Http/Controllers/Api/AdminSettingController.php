<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AdminSettingController extends Controller
{
    private $defaultSettings = [
        'app_name' => 'BrainBuzz Cyber Trivia',
        'currency_name' => 'Coins',
        'default_timer_seconds' => 30,
        'points_per_correct' => 10,
        'hints_per_game' => 3,
        'welcome_bonus_coins' => 100,
        'maintenance_mode' => false,
        'ads_enabled' => true,
        'adsense_publisher_id' => 'ca-pub-0000000000000000',
        'contact_email' => 'support@brainbuzz.game',
    ];

    public function getSettings()
    {
        $settings = Cache::get('brainbuzz_system_settings', $this->defaultSettings);
        return response()->json([
            'success' => true,
            'settings' => $settings,
        ]);
    }

    public function updateSettings(Request $request)
    {
        $current = Cache::get('brainbuzz_system_settings', $this->defaultSettings);

        $validated = $request->validate([
            'app_name' => 'nullable|string|max:100',
            'currency_name' => 'nullable|string|max:50',
            'default_timer_seconds' => 'nullable|integer|min:5|max:120',
            'points_per_correct' => 'nullable|integer|min:1|max:100',
            'hints_per_game' => 'nullable|integer|min:0|max:10',
            'welcome_bonus_coins' => 'nullable|integer|min:0',
            'maintenance_mode' => 'nullable|boolean',
            'ads_enabled' => 'nullable|boolean',
            'adsense_publisher_id' => 'nullable|string|max:100',
            'contact_email' => 'nullable|email|max:100',
        ]);

        $updated = array_merge($current, array_filter($validated, fn($val) => !is_null($val)));
        Cache::forever('brainbuzz_system_settings', $updated);

        return response()->json([
            'success' => true,
            'message' => 'System settings updated successfully!',
            'settings' => $updated,
        ]);
    }
}
