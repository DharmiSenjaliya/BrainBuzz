<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\GameResult;
use App\Models\KnowledgeChallenge;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KnowledgeChallengeController extends Controller
{
    private const QUESTION_COUNT = 5;
    private const ANSWER_ATTEMPTS = 3;

    public function categories()
    {
        $categories = Category::query()
            ->where('is_active', true)
            ->withCount([
                'questions as questions_count' => fn ($query) => $query
                    ->where('is_active', true),
            ])
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'description', 'icon']);

        return response()->json([
            'success' => true,
            'categories' => $categories,
            'question_count' => self::QUESTION_COUNT,
        ]);
    }

    public function start(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'nullable|integer|exists:categories,id',
        ]);

        $query = Question::query()
            ->where('is_active', true)
            ->whereNotNull('category_id')
            ->whereHas('category', fn ($category) => $category->where('is_active', true));

        if (!empty($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        }

        $availableCount = (clone $query)->count();

        if ($availableCount < self::QUESTION_COUNT) {
            return response()->json([
                'success' => false,
                'message' => 'This category does not have enough active questions yet.',
                'available_questions' => $availableCount,
                'required_questions' => self::QUESTION_COUNT,
            ], 422);
        }

        $questions = $query
            ->inRandomOrder()
            ->limit(self::QUESTION_COUNT)
            ->get(['id', 'category_id', 'title', 'clues', 'level', 'points']);

        $challenge = KnowledgeChallenge::create([
            'user_id' => $request->user()->id,
            'category_id' => $validated['category_id'] ?? null,
            'question_ids' => $questions->pluck('id')->all(),
            'attempts_remaining' => self::ANSWER_ATTEMPTS,
        ]);

        return response()->json([
            'success' => true,
            'challenge_id' => $challenge->id,
            'questions' => $questions,
            'question_count' => $questions->count(),
            'attempts_per_question' => self::ANSWER_ATTEMPTS,
        ], 201);
    }

    public function answer(Request $request, KnowledgeChallenge $challenge)
    {
        $this->ensureOwner($request, $challenge);

        $validated = $request->validate([
            'question_id' => 'required|integer',
            'answer' => 'required|string|max:255',
        ]);

        return DB::transaction(function () use ($request, $challenge, $validated) {
            $challenge = KnowledgeChallenge::query()
                ->whereKey($challenge->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($challenge->completed_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'This challenge has already been completed.',
                ], 409);
            }

            $questionIds = $challenge->question_ids ?? [];
            $questionIndex = $challenge->current_question_index;
            $currentQuestionId = $questionIds[$questionIndex] ?? null;

            if ((int) $validated['question_id'] !== (int) $currentQuestionId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Answer the current challenge question first.',
                ], 422);
            }

            $question = Question::query()
                ->whereKey($currentQuestionId)
                ->where('is_active', true)
                ->first();

            if (!$question) {
                return response()->json([
                    'success' => false,
                    'message' => 'This question is no longer available.',
                ], 410);
            }

            $isCorrect = mb_strtolower(trim($validated['answer']))
                === mb_strtolower(trim($question->answer));
            $attemptsLeft = max(0, $challenge->attempts_remaining - 1);
            $resolved = $isCorrect || $attemptsLeft === 0;
            $points = $isCorrect ? (int) $question->points : 0;

            if ($isCorrect || $resolved) {
                $answers = $challenge->answers ?? [];
                $answers[(string) $questionIndex] = [
                    'question_id' => $question->id,
                    'correct' => $isCorrect,
                    'attempts_used' => self::ANSWER_ATTEMPTS - $attemptsLeft,
                    'points' => $points,
                ];

                $challenge->answers = $answers;
                $challenge->current_question_index++;
                $challenge->attempts_remaining = self::ANSWER_ATTEMPTS;

                if ($isCorrect) {
                    $challenge->correct_answers++;
                    $challenge->score += $points;
                }
            } else {
                $challenge->attempts_remaining = $attemptsLeft;
            }

            $challenge->save();

            return response()->json([
                'success' => true,
                'correct' => $isCorrect,
                'resolved' => $resolved,
                'points' => $points,
                'score' => $challenge->score,
                'attempts_remaining' => $isCorrect ? self::ANSWER_ATTEMPTS : $attemptsLeft,
                'message' => $isCorrect
                    ? 'Correct answer!'
                    : ($resolved ? 'No attempts left. Move to the next question.' : 'Wrong answer. Try again.'),
            ]);
        });
    }

    public function complete(Request $request, KnowledgeChallenge $challenge)
    {
        $this->ensureOwner($request, $challenge);

        return DB::transaction(function () use ($challenge) {
            $challenge = KnowledgeChallenge::query()
                ->whereKey($challenge->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($challenge->game_result_id) {
                return response()->json([
                    'success' => true,
                    'result' => $challenge->gameResult,
                    'challenge' => $challenge,
                ]);
            }

            $totalQuestions = count($challenge->question_ids ?? []);

            if (!$totalQuestions || $challenge->current_question_index < $totalQuestions) {
                return response()->json([
                    'success' => false,
                    'message' => 'Answer all challenge questions before completing the round.',
                ], 422);
            }

            $correctAnswers = $challenge->correct_answers;
            $result = GameResult::create([
                'user_id' => $challenge->user_id,
                'game_mode' => 'knowledge',
                'level' => 1,
                'score' => $challenge->score,
                'correct_answers' => $correctAnswers,
                'wrong_answers' => $totalQuestions - $correctAnswers,
                'total_questions' => $totalQuestions,
                'passed' => $correctAnswers >= (int) ceil($totalQuestions * 0.6),
            ]);

            $challenge->game_result_id = $result->id;
            $challenge->completed_at = now();
            $challenge->save();

            return response()->json([
                'success' => true,
                'message' => 'Knowledge Challenge completed successfully.',
                'result' => $result,
                'challenge' => $challenge,
            ], 201);
        });
    }

    public function history(Request $request)
    {
        $challenges = KnowledgeChallenge::query()
            ->with([
                'category:id,name,icon',
                'gameResult:id,game_mode,score,correct_answers,wrong_answers,total_questions,passed,created_at',
            ])
            ->where('user_id', $request->user()->id)
            ->whereNotNull('completed_at')
            ->latest('completed_at')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'challenges' => $challenges,
        ]);
    }

    private function ensureOwner(Request $request, KnowledgeChallenge $challenge): void
    {
        abort_unless($challenge->user_id === $request->user()->id, 404);
    }
}
