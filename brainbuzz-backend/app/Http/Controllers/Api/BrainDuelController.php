<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BrainDuel;
use App\Models\GameResult;
use App\Models\Question;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BrainDuelController extends Controller
{
    private const QUESTION_COUNT = 5;

    public function store(Request $request)
    {
        $questions = Question::query()
            ->where('is_active', true)
            ->inRandomOrder()
            ->limit(self::QUESTION_COUNT)
            ->get(['id']);

        if ($questions->count() < self::QUESTION_COUNT) {
            return response()->json([
                'success' => false,
                'message' => 'At least five active questions are required to start a Brain Duel.',
            ], 422);
        }

        $duel = BrainDuel::create([
            'invite_code' => $this->generateInviteCode(),
            'creator_id' => $request->user()->id,
            'question_ids' => $questions->pluck('id')->all(),
            'creator_progress' => 0,
            'opponent_progress' => 0,
            'creator_score' => 0,
            'opponent_score' => 0,
            'creator_correct_answers' => 0,
            'opponent_correct_answers' => 0,
            'status' => 'waiting',
            'expires_at' => now()->addDay(),
        ]);

        return response()->json([
            'success' => true,
            'duel' => $this->duelPayload($duel, $request->user()),
        ], 201);
    }

    public function join(Request $request)
    {
        $validated = $request->validate([
            'invite_code' => 'required|string|size:8',
        ]);

        $duel = DB::transaction(function () use ($request, $validated) {
            $duel = BrainDuel::query()
                ->where('invite_code', Str::upper($validated['invite_code']))
                ->lockForUpdate()
                ->first();

            if (!$duel) {
                return response()->json([
                    'success' => false,
                    'message' => 'That invite code was not found.',
                ], 404);
            }

            if ($duel->expires_at->isPast() && $duel->status !== 'completed') {
                $duel->update(['status' => 'expired']);

                return response()->json([
                    'success' => false,
                    'message' => 'This Brain Duel invite has expired.',
                ], 410);
            }

            if ($duel->creator_id === $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Join this duel from a different player account.',
                ], 422);
            }

            if ($duel->opponent_id && $duel->opponent_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'This duel already has an opponent.',
                ], 409);
            }

            if ($duel->status !== 'waiting' && $duel->opponent_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'This duel is no longer accepting players.',
                ], 409);
            }

            if (!$duel->opponent_id) {
                $duel->update([
                    'opponent_id' => $request->user()->id,
                    'status' => 'active',
                ]);
            }

            return $duel->fresh();
        });

        if ($duel instanceof \Illuminate\Http\JsonResponse) {
            return $duel;
        }

        return response()->json([
            'success' => true,
            'duel' => $this->duelPayload($duel, $request->user()),
        ]);
    }

    public function show(Request $request, string $inviteCode)
    {
        $duel = BrainDuel::query()
            ->where('invite_code', Str::upper($inviteCode))
            ->firstOrFail();

        $this->ensureParticipant($request->user(), $duel);

        if ($duel->expires_at->isPast() && $duel->status !== 'completed' && $duel->status !== 'expired') {
            $duel->update(['status' => 'expired']);
            $duel->refresh();
        }

        return response()->json([
            'success' => true,
            'duel' => $this->duelPayload($duel, $request->user()),
        ]);
    }

    public function answer(Request $request, string $inviteCode)
    {
        $validated = $request->validate([
            'question_id' => 'required|integer',
            'answer' => 'required|string|max:255',
        ]);

        return DB::transaction(function () use ($request, $inviteCode, $validated) {
            $duel = BrainDuel::query()
                ->where('invite_code', Str::upper($inviteCode))
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureParticipant($request->user(), $duel);

            if ($duel->expires_at->isPast() && $duel->status !== 'completed') {
                $duel->update(['status' => 'expired']);
                $duel->refresh();
            }

            if ($duel->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'This duel is not accepting answers.',
                ], 409);
            }

            $isCreator = $duel->creator_id === $request->user()->id;
            $progressColumn = $isCreator ? 'creator_progress' : 'opponent_progress';
            $answersColumn = $isCreator ? 'creator_answers' : 'opponent_answers';
            $scoreColumn = $isCreator ? 'creator_score' : 'opponent_score';
            $correctColumn = $isCreator ? 'creator_correct_answers' : 'opponent_correct_answers';
            $questionIds = $duel->question_ids ?? [];
            $questionId = $questionIds[$duel->{$progressColumn}] ?? null;

            if ($questionId === null || (int) $validated['question_id'] !== (int) $questionId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Answer the current duel question first.',
                ], 422);
            }

            $question = Question::query()->find($questionId);

            if (!$question) {
                return response()->json([
                    'success' => false,
                    'message' => 'A question in this duel is no longer available.',
                ], 410);
            }

            $isCorrect = mb_strtolower(trim($validated['answer']))
                === mb_strtolower(trim($question->answer));
            $points = $isCorrect ? (int) $question->points : 0;
            $answers = $duel->{$answersColumn} ?? [];
            $answers[] = [
                'question_id' => $question->id,
                'correct' => $isCorrect,
                'points' => $points,
            ];

            $duel->{$answersColumn} = $answers;
            $duel->{$progressColumn}++;
            $duel->{$scoreColumn} += $points;
            $duel->{$correctColumn} += $isCorrect ? 1 : 0;
            $duel->save();

            if (
                $duel->creator_progress >= count($questionIds)
                && $duel->opponent_progress >= count($questionIds)
            ) {
                $this->completeDuel($duel);
            }

            return response()->json([
                'success' => true,
                'correct' => $isCorrect,
                'points' => $points,
                'message' => $isCorrect ? 'Correct answer!' : 'Not quite — keep going!',
                'duel' => $this->duelPayload($duel->fresh(), $request->user()),
            ]);
        });
    }

    private function generateInviteCode(): string
    {
        do {
            $code = Str::upper(Str::random(8));
        } while (BrainDuel::query()->where('invite_code', $code)->exists());

        return $code;
    }

    private function ensureParticipant(User $user, BrainDuel $duel): void
    {
        abort_unless(
            $duel->creator_id === $user->id || $duel->opponent_id === $user->id,
            404
        );
    }

    private function completeDuel(BrainDuel $duel): void
    {
        if ($duel->status === 'completed') {
            return;
        }

        foreach ([
            [
                'user_id' => $duel->creator_id,
                'score' => $duel->creator_score,
                'correct' => $duel->creator_correct_answers,
            ],
            [
                'user_id' => $duel->opponent_id,
                'score' => $duel->opponent_score,
                'correct' => $duel->opponent_correct_answers,
            ],
        ] as $player) {
            GameResult::create([
                'user_id' => $player['user_id'],
                'game_mode' => 'duel',
                'level' => 1,
                'score' => $player['score'],
                'correct_answers' => $player['correct'],
                'wrong_answers' => self::QUESTION_COUNT - $player['correct'],
                'total_questions' => self::QUESTION_COUNT,
                'passed' => $player['correct'] >= 3,
            ]);
        }

        $duel->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
    }

    private function duelPayload(BrainDuel $duel, User $user): array
    {
        $duel->loadMissing([
            'creator:id,name',
            'opponent:id,name',
        ]);

        $isCreator = $duel->creator_id === $user->id;
        $orderedQuestions = Question::query()
            ->whereIn('id', $duel->question_ids ?? [])
            ->get(['id', 'title', 'clues', 'points'])
            ->keyBy('id');

        $questions = collect($duel->question_ids ?? [])
            ->map(fn ($id) => $orderedQuestions->get($id))
            ->filter()
            ->values();

        return [
            'invite_code' => $duel->invite_code,
            'status' => $duel->status,
            'expires_at' => $duel->expires_at,
            'questions' => $questions,
            'you' => [
                'name' => $user->name,
                'score' => $isCreator ? $duel->creator_score : $duel->opponent_score,
                'correct_answers' => $isCreator
                    ? $duel->creator_correct_answers
                    : $duel->opponent_correct_answers,
                'progress' => $isCreator ? $duel->creator_progress : $duel->opponent_progress,
            ],
            'opponent' => [
                'name' => $isCreator
                    ? ($duel->opponent?->name ?? 'Waiting for rival')
                    : $duel->creator->name,
                'score' => $isCreator ? $duel->opponent_score : $duel->creator_score,
                'correct_answers' => $isCreator
                    ? $duel->opponent_correct_answers
                    : $duel->creator_correct_answers,
                'progress' => $isCreator ? $duel->opponent_progress : $duel->creator_progress,
            ],
            'is_creator' => $isCreator,
        ];
    }
}
