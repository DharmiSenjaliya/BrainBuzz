<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\GameResult;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KnowledgeChallengeApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_player_can_complete_a_challenge_and_save_result_once(): void
    {
        $player = User::factory()->create();
        $otherPlayer = User::factory()->create();
        $category = $this->createCategory();
        $questions = $this->createQuestions($category);

        $startResponse = $this->actingAs($player)
            ->postJson('/api/knowledge-challenges', [
                'category_id' => $category->id,
            ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonCount(5, 'questions')
            ->assertJsonMissingPath('questions.0.answer');

        $challengeId = $startResponse->json('challenge_id');
        $selectedQuestions = $startResponse->json('questions');

        $this->actingAs($otherPlayer)
            ->postJson("/api/knowledge-challenges/{$challengeId}/answer", [
                'question_id' => $selectedQuestions[0]['id'],
                'answer' => 'answer 1',
            ])
            ->assertNotFound();

        for ($attempt = 2; $attempt >= 0; $attempt--) {
            $this->actingAs($player)
                ->postJson("/api/knowledge-challenges/{$challengeId}/answer", [
                    'question_id' => $selectedQuestions[0]['id'],
                    'answer' => 'incorrect',
                ])
                ->assertOk()
                ->assertJsonPath('correct', false)
                ->assertJsonPath('attempts_remaining', $attempt)
                ->assertJsonPath('resolved', $attempt === 0);
        }

        for ($index = 1; $index < count($selectedQuestions); $index++) {
            $answer = $questions->firstWhere('id', $selectedQuestions[$index]['id'])->answer;

            $this->actingAs($player)
                ->postJson("/api/knowledge-challenges/{$challengeId}/answer", [
                    'question_id' => $selectedQuestions[$index]['id'],
                    'answer' => $answer,
                ])
                ->assertOk()
                ->assertJsonPath('correct', true)
                ->assertJsonPath('resolved', true);
        }

        $this->actingAs($player)
            ->postJson("/api/knowledge-challenges/{$challengeId}/complete")
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('result.game_mode', 'knowledge')
            ->assertJsonPath('result.correct_answers', 4)
            ->assertJsonPath('result.wrong_answers', 1)
            ->assertJsonPath('result.score', 40);

        $this->actingAs($player)
            ->postJson("/api/knowledge-challenges/{$challengeId}/complete")
            ->assertOk();

        $this->assertSame(1, GameResult::where('user_id', $player->id)->count());

        $this->actingAs($player)
            ->getJson('/api/knowledge-challenges/history')
            ->assertOk()
            ->assertJsonCount(1, 'challenges');

        $this->actingAs($otherPlayer)
            ->getJson('/api/knowledge-challenges/history')
            ->assertOk()
            ->assertJsonCount(0, 'challenges');
    }

    public function test_challenge_start_requires_five_active_questions(): void
    {
        $player = User::factory()->create();
        $category = $this->createCategory();
        $this->createQuestions($category, 4);

        $this->actingAs($player)
            ->postJson('/api/knowledge-challenges', [
                'category_id' => $category->id,
            ])
            ->assertUnprocessable()
            ->assertJsonPath('available_questions', 4)
            ->assertJsonPath('required_questions', 5);
    }

    private function createCategory(): Category
    {
        return Category::create([
            'name' => 'Science',
            'slug' => 'science',
            'description' => 'Science questions',
            'icon' => '🔬',
            'is_active' => true,
        ]);
    }

    private function createQuestions(Category $category, int $count = 5)
    {
        return collect(range(1, $count))->map(fn (int $number) => Question::create([
            'category_id' => $category->id,
            'title' => "Question {$number}",
            'clues' => ['Clue'],
            'answer' => "answer {$number}",
            'level' => 1,
            'points' => 10,
            'is_active' => true,
        ]));
    }
}
