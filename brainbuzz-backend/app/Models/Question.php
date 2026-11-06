<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
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
}
