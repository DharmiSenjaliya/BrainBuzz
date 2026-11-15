<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('knowledge_challenges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('game_result_id')->nullable()->constrained()->nullOnDelete();
            $table->json('question_ids');
            $table->json('answers')->nullable();
            $table->unsignedTinyInteger('current_question_index')->default(0);
            $table->unsignedTinyInteger('attempts_remaining')->default(3);
            $table->unsignedTinyInteger('correct_answers')->default(0);
            $table->unsignedInteger('score')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_challenges');
    }
};
