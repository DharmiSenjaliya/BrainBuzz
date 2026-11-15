<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\DailyGameChallenge;
use App\Services\DailyGameAiService;

class RotateDailyGame extends Command
{
    protected $signature = 'app:rotate-daily-game';

    protected $description = 'Prepare the daily mini game rotation';
    public function handle(DailyGameAiService $aiService): int
    {
        $gameTypes = [
            'word_shuffle',
            'logic_detective',
            'pattern_master',
            'visual_detective',
            'number_ninja',
            'weekend_surprise',
        ];

        $today = now('Asia/Kolkata');

        if ($today->isWeekend()) {
            $gameType = 'weekend_surprise';
        } else {
            $gameType = $gameTypes[$today->dayOfWeekIso - 1];
        }

        $date = $today->toDateString();

        $this->info('Daily Game Rotation');
        $this->info('Date: ' . $date);
        $this->info('Selected Game: ' . $gameType);

        if (DailyGameChallenge::where('challenge_date', $date)->exists()) {
            $this->warn('A game already exists for today. Skipping generation.');
            return self::SUCCESS;
        }

        try {
            $data = $aiService->generate($gameType, $date);

            DailyGameChallenge::create([
                'challenge_date' => $date,
                'game_type' => $gameType,
                'title' => $data['title'],
                'instructions' => $data['instructions'],
                'content' => ['items' => $data['items']],
                'difficulty' => $data['difficulty'],
                'duration_seconds' => $data['duration_seconds'],
                'total_points' => $data['total_points'],
                'bonus_points' => $data['bonus_points'],
                'status' => 'draft',
                'generation_source' => 'ai',
                'generated_at' => now(),
            ]);

            $this->info('AI game generated successfully as draft.');
            $this->comment('Admin approval and publishing are required.');

            return self::SUCCESS;
        } catch (\Throwable $e) {
            report($e);
            $this->error('AI game generation failed. Check Laravel logs.');

            return self::FAILURE;
        }
    }
}
