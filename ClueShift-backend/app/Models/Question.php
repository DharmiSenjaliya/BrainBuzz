<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'title',
        'clues',
        'answer',
        'hint',
        'level',
        'points',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'clues' => 'array',
            'level' => 'integer',
            'points' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
