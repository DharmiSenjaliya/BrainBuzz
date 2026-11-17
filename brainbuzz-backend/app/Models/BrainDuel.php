<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrainDuel extends Model
{
    protected $fillable = [
        'invite_code',
        'creator_id',
        'opponent_id',
        'question_ids',
        'creator_answers',
        'opponent_answers',
        'creator_progress',
        'opponent_progress',
        'creator_score',
        'opponent_score',
        'creator_correct_answers',
        'opponent_correct_answers',
        'status',
        'expires_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'question_ids' => 'array',
            'creator_answers' => 'array',
            'opponent_answers' => 'array',
            'creator_progress' => 'integer',
            'opponent_progress' => 'integer',
            'creator_score' => 'integer',
            'opponent_score' => 'integer',
            'creator_correct_answers' => 'integer',
            'opponent_correct_answers' => 'integer',
            'expires_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function opponent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opponent_id');
    }
}
