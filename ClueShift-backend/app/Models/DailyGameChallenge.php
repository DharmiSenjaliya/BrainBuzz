<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DailyGameChallenge extends Model
{
    protected $fillable = [
        'challenge_date',
        'game_type',
        'title',
        'instructions',
        'content',
        'difficulty',
        'duration_seconds',
        'total_points',
        'bonus_points',
        'status',
        'generation_source',
        'generated_at',
        'approved_by',
        'approved_at',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'challenge_date' => 'date',
            'content' => 'array',
            'generated_at' => 'datetime',
            'approved_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(DailyGameAttempt::class);
    }
}
