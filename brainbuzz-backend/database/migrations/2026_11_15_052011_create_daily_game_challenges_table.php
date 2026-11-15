<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_game_challenges', function (Blueprint $table) {
            $table->id();

            // Daily game information
            $table->date('challenge_date')->unique();
            $table->string('game_type', 50);
            $table->string('title');
            $table->text('instructions')->nullable();

            // Flexible AI-generated game content
            $table->json('content');

            // Game settings
            $table->string('difficulty', 30)->default('medium');
            $table->unsignedInteger('duration_seconds')->default(120);
            $table->unsignedInteger('total_points')->default(100);
            $table->unsignedInteger('bonus_points')->default(20);

            // Approval and publishing
            $table->enum('status', [
                'draft',
                'pending_approval',
                'approved',
                'published',
                'rejected'
            ])->default('draft');

            // AI generation information
            $table->string('generation_source', 30)->default('manual');
            $table->timestamp('generated_at')->nullable();

            // Admin approval information
            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('approved_at')->nullable();
            $table->timestamp('published_at')->nullable();

            $table->timestamps();

            $table->index(['challenge_date', 'status']);
            $table->index('game_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_game_challenges');
    }
};
