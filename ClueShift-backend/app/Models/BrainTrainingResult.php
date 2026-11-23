<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrainTrainingResult extends Model
{
    protected $fillable = [
        'user_id',
        'game_type',
        'score',
        'best_result',
        'completed',
        'details',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'best_result' => 'integer',
            'completed' => 'boolean',
            'details' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
