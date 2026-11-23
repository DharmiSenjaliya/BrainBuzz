<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameResult extends Model
{
    protected $fillable = [
        'user_id',
        'game_mode',
        'level',
        'score',
        'correct_answers',
        'wrong_answers',
        'total_questions',
        'passed',
    ];

    protected function casts(): array
    {
        return [
            'game_mode' => 'string',
            'passed' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}