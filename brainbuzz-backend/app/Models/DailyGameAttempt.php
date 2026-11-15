<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyGameAttempt extends Model
{
    protected $fillable = [
        'daily_game_challenge_id',
        'user_id',
        'score',
        'max_score',
        'correct_answers',
        'wrong_answers',
        'duration_seconds',
        'result_data',
        'is_completed',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'result_data' => 'array',
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(DailyGameChallenge::class, 'daily_game_challenge_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
