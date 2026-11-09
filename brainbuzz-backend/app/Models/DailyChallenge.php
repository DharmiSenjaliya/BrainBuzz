<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DailyChallenge extends Model
{
    protected $fillable = [
        'challenge_date',
        'question_ids',
        'bonus_points',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'challenge_date' => 'date',
            'question_ids' => 'array',
            'bonus_points' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(DailyChallengeAttempt::class);
    }
}
