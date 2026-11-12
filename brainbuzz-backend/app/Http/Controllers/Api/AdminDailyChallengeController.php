<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyChallenge;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminDailyChallengeController extends Controller
{
    private function checkAdmin(Request $request)
    {
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.',
            ], 403);
        }

        return null;
    }

    // Get all daily challenges
    public function index(Request $request)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $challenges = DailyChallenge::withCount('attempts')
            ->orderByDesc('challenge_date')
            ->get();

        return response()->json([
            'success' => true,
            'challenges' => $challenges,
        ]);
    }

    // Create a daily challenge
    public function store(Request $request)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'challenge_date' => [
                'required',
                'date',
                'after_or_equal:today',
                'unique:daily_challenges,challenge_date',
            ],
            'question_ids' => 'required|array|size:5',
            'question_ids.*' => 'required|integer|distinct|exists:questions,id',
            'bonus_points' => 'required|integer|min:0|max:10000',
            'is_active' => 'sometimes|boolean',
        ]);

        $activeQuestions = Question::whereIn(
            'id',
            $validated['question_ids']
        )->where('is_active', true)->count();

        if ($activeQuestions !== 5) {
            return response()->json([
                'success' => false,
                'message' => 'All 5 selected questions must be active.',
            ], 422);
        }

        $challenge = DailyChallenge::create([
            'challenge_date' => $validated['challenge_date'],
            'question_ids' => $validated['question_ids'],
            'bonus_points' => $validated['bonus_points'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Daily Challenge created successfully!',
            'challenge' => $challenge,
        ], 201);
    }

    // Update a daily challenge
    public function update(Request $request, $id)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $challenge = DailyChallenge::findOrFail($id);

        if ($challenge->attempts()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'A challenge with player attempts cannot be edited.',
            ], 409);
        }

        $validated = $request->validate([
            'challenge_date' => [
                'sometimes',
                'required',
                'date',
                'after_or_equal:today',
                Rule::unique('daily_challenges', 'challenge_date')
                    ->ignore($challenge->id),
            ],
            'question_ids' => 'sometimes|required|array|size:5',
            'question_ids.*' => 'required|integer|distinct|exists:questions,id',
            'bonus_points' => 'sometimes|required|integer|min:0|max:10000',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($validated['question_ids'])) {
            $activeQuestions = Question::whereIn(
                'id',
                $validated['question_ids']
            )->where('is_active', true)->count();

            if ($activeQuestions !== 5) {
                return response()->json([
                    'success' => false,
                    'message' => 'All 5 selected questions must be active.',
                ], 422);
            }
        }

        $challenge->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Daily Challenge updated successfully!',
            'challenge' => $challenge->fresh(),
        ]);
    }

    // Delete a daily challenge
    public function destroy(Request $request, $id)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $challenge = DailyChallenge::findOrFail($id);

        if ($challenge->attempts()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'A challenge with player attempts cannot be deleted.',
            ], 409);
        }

        $challenge->delete();

        return response()->json([
            'success' => true,
            'message' => 'Daily Challenge deleted successfully!',
        ]);
    }
}
