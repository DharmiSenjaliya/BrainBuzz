<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\GameResult;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UnlimitedLevelProgressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_level_progression_and_questions_continue_past_level_fifty(): void
    {
        $player = User::factory()->create();

        foreach (range(1, 50) as $level) {
            GameResult::create([
                'user_id' => $player->id,
                'game_mode' => 'iq',
                'level' => $level,
                'score' => 30,
                'correct_answers' => 3,
                'wrong_answers' => 2,
                'total_questions' => 5,
                'passed' => true,
            ]);
        }

        $this->actingAs($player)
            ->getJson('/api/level-progress')
            ->assertOk()
            ->assertJsonPath('current_level', 51);

        $this->actingAs($player)
            ->postJson('/api/game-results', [
                'level' => 51,
                'score' => 30,
                'correct_answers' => 3,
                'wrong_answers' => 2,
                'total_questions' => 5,
                'passed' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('result.level', 51);

        $this->actingAs($player)
            ->getJson('/api/level-progress')
            ->assertOk()
            ->assertJsonPath('current_level', 52);

        $category = Category::create([
            'name' => 'Future Levels',
            'slug' => 'future-levels',
            'description' => 'Questions for levels above the previous cap.',
            'icon' => '🧠',
            'is_active' => true,
        ]);

        foreach (range(1, 5) as $number) {
            Question::create([
                'category_id' => $category->id,
                'title' => "Level 52 question {$number}",
                'clues' => ['A test clue'],
                'answer' => "answer {$number}",
                'level' => 52,
                'points' => 10,
                'is_active' => true,
            ]);
        }

        $this->actingAs($player)
            ->getJson('/api/questions?level=52')
            ->assertOk()
            ->assertJsonCount(5, 'questions');
    }

    public function test_progression_stops_at_the_first_unpassed_level(): void
    {
        $player = User::factory()->create();

        foreach ([
            [1, true],
            [2, false],
            [3, true],
        ] as [$level, $passed]) {
            GameResult::create([
                'user_id' => $player->id,
                'game_mode' => 'iq',
                'level' => $level,
                'score' => $passed ? 30 : 10,
                'correct_answers' => $passed ? 3 : 1,
                'wrong_answers' => $passed ? 2 : 4,
                'total_questions' => 5,
                'passed' => $passed,
            ]);
        }

        $response = $this->actingAs($player)
            ->getJson('/api/level-progress')
            ->assertOk()
            ->assertJsonPath('current_level', 2);

        $levels = collect($response->json('levels'))->keyBy('level');

        $this->assertTrue($levels[1]['is_unlocked']);
        $this->assertTrue($levels[2]['is_unlocked']);
        $this->assertFalse($levels[3]['is_unlocked']);
    }
}
