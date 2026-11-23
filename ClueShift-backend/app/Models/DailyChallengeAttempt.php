<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyChallengeAttempt extends Model
{
    protected $fillable = [
        'daily_challenge_id',
        'user_id',
        'score',
        'correct_answers',
        'wrong_answers',
        'bonus_points',
        'is_completed',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'correct_answers' => 'integer',
            'wrong_answers' => 'integer',
            'bonus_points' => 'integer',
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(DailyChallenge::class, 'daily_challenge_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
