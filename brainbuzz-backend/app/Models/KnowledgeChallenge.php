<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeChallenge extends Model
{
    protected $fillable = [
        'user_id',
        'category_id',
        'game_result_id',
        'question_ids',
        'answers',
        'current_question_index',
        'attempts_remaining',
        'correct_answers',
        'score',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'question_ids' => 'array',
            'answers' => 'array',
            'current_question_index' => 'integer',
            'attempts_remaining' => 'integer',
            'correct_answers' => 'integer',
            'score' => 'integer',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function gameResult(): BelongsTo
    {
        return $this->belongsTo(GameResult::class);
    }
}
