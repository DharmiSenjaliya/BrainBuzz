<?php

namespace Tests\Feature;

use App\Models\BrainDuel;
use App\Models\Category;
use App\Models\GameResult;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BrainDuelApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_two_players_can_complete_an_invite_code_duel_and_save_both_scores(): void
    {
        $creator = User::factory()->create();
        $opponent = User::factory()->create();
        $outsider = User::factory()->create();
        $this->createQuestions();

        $created = $this->actingAs($creator)
            ->postJson('/api/brain-duels')
            ->assertCreated()
            ->assertJsonPath('duel.status', 'waiting')
            ->assertJsonCount(5, 'duel.questions')
            ->assertJsonMissingPath('duel.questions.0.answer');

        $inviteCode = $created->json('duel.invite_code');
        $questionIds = collect($created->json('duel.questions'))->pluck('id')->all();
        $questionAnswers = Question::query()
            ->whereIn('id', $questionIds)
            ->pluck('answer', 'id');

        $this->actingAs($outsider)
            ->getJson("/api/brain-duels/{$inviteCode}")
            ->assertNotFound();

        $this->actingAs($creator)
            ->postJson('/api/brain-duels/join', ['invite_code' => $inviteCode])
            ->assertUnprocessable();

        $this->actingAs($opponent)
            ->postJson('/api/brain-duels/join', ['invite_code' => strtolower($inviteCode)])
            ->assertOk()
            ->assertJsonPath('duel.status', 'active');

        foreach ($questionIds as $index => $questionId) {
            $answer = $index < 3 ? $questionAnswers[$questionId] : 'incorrect';

            $this->actingAs($creator)
                ->postJson("/api/brain-duels/{$inviteCode}/answer", [
                    'question_id' => $questionId,
                    'answer' => $answer,
                ])
                ->assertOk()
                ->assertJsonPath('correct', $index < 3);

            $this->actingAs($opponent)
                ->postJson("/api/brain-duels/{$inviteCode}/answer", [
                    'question_id' => $questionId,
                    'answer' => 'incorrect',
                ])
                ->assertOk()
                ->assertJsonPath('correct', false);
        }

        $this->actingAs($opponent)
            ->getJson("/api/brain-duels/{$inviteCode}")
            ->assertOk()
            ->assertJsonPath('duel.status', 'completed')
            ->assertJsonPath('duel.you.score', 0)
            ->assertJsonPath('duel.opponent.score', 30);

        $this->assertSame(2, GameResult::where('game_mode', 'duel')->count());
        $this->assertSame(3, GameResult::where('user_id', $creator->id)->first()->correct_answers);
        $this->assertSame(0, GameResult::where('user_id', $opponent->id)->first()->correct_answers);

        $this->actingAs($outsider)
            ->postJson("/api/brain-duels/{$inviteCode}/answer", [
                'question_id' => $questionIds[0],
                'answer' => 'answer 1',
            ])
            ->assertNotFound();
    }

    public function test_a_player_cannot_answer_the_same_duel_question_twice(): void
    {
        $creator = User::factory()->create();
        $opponent = User::factory()->create();
        $this->createQuestions();

        $created = $this->actingAs($creator)->postJson('/api/brain-duels')->assertCreated();
        $inviteCode = $created->json('duel.invite_code');
        $questionId = $created->json('duel.questions.0.id');

        $this->actingAs($opponent)
            ->postJson('/api/brain-duels/join', ['invite_code' => $inviteCode])
            ->assertOk();

        $answer = [
            'question_id' => $questionId,
            'answer' => 'answer 1',
        ];

        $this->actingAs($creator)
            ->postJson("/api/brain-duels/{$inviteCode}/answer", $answer)
            ->assertOk();

        $this->actingAs($creator)
            ->postJson("/api/brain-duels/{$inviteCode}/answer", $answer)
            ->assertUnprocessable();
    }

    public function test_duel_creation_requires_five_active_questions(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/brain-duels')
            ->assertUnprocessable()
            ->assertJsonPath('success', false);
    }

    private function createQuestions(): void
    {
        $category = Category::create([
            'name' => 'General',
            'slug' => 'general',
            'description' => 'General knowledge questions',
            'icon' => '🧠',
            'is_active' => true,
        ]);

        foreach (range(1, 5) as $number) {
            Question::create([
                'category_id' => $category->id,
                'title' => "Question {$number}",
                'clues' => ['A test clue'],
                'answer' => "answer {$number}",
                'level' => 1,
                'points' => 10,
                'is_active' => true,
            ]);
        }
    }
}
