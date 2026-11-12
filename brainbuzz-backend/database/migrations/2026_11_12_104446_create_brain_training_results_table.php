
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brain_training_results', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('game_type', 30);
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('best_result')->default(0);
            $table->boolean('completed')->default(false);
            $table->json('details')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'game_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('brain_training_results');
    }
};
