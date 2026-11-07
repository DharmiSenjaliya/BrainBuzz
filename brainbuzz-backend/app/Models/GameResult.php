<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameResult extends Model
{
    protected $fillable = [
        'user_id',
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
            'passed' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}