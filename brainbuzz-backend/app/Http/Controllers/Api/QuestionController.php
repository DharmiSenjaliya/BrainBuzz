<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\Category;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    // Check admin access
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

    // Get 5 random active questions for selected level
    public function index(Request $request)
{
    $validated = $request->validate([
        'level' => 'required|integer|min:1',
        'category_id' => 'nullable|integer|exists:categories,id',
    ]);

    $query = Question::where('level', $validated['level'])
        ->where('is_active', true);

        $query->where(function ($categoryQuery) {
    $categoryQuery->whereNull('category_id')
        ->orWhereHas('category', function ($activeCategory) {
            $activeCategory->where('is_active', true);
        });
});

    if (!empty($validated['category_id'])) {
        $query->where('category_id', $validated['category_id'])
            ->whereHas('category', function ($categoryQuery) {
                $categoryQuery->where('is_active', true);
            });
    }

    $questions = $query
        ->inRandomOrder()
        ->limit(5)
        ->get([
            'id',
            'category_id',
            'title',
            'clues',
            'hint',
            'level',
            'points',
        ]);

    return response()->json([
        'questions' => $questions,
    ]);
}

    // Check player's answer
    public function checkAnswer(Request $request)
    {
        $validated = $request->validate([
            'question_id' => 'required|integer|exists:questions,id',
            'answer' => 'required|string|max:255',
        ]);

        $question = Question::where('id', $validated['question_id'])
    ->where('is_active', true)
    ->where(function ($categoryQuery) {
        $categoryQuery->whereNull('category_id')
            ->orWhereHas('category', function ($activeCategory) {
                $activeCategory->where('is_active', true);
            });
    })
    ->first();

        if (!$question) {
            return response()->json([
                'correct' => false,
                'points' => 0,
                'message' => 'Question is not available.',
            ], 404);
        }

        $playerAnswer = mb_strtolower(trim($validated['answer']));
        $correctAnswer = mb_strtolower(trim($question->answer));

        if ($playerAnswer === $correctAnswer) {
            return response()->json([
                'correct' => true,
                'points' => (int) $question->points,
                'message' => 'Correct answer!',
            ]);
        }

        return response()->json([
            'correct' => false,
            'points' => 0,
            'message' => 'Wrong answer! Try again.',
        ]);
    }

    // Add new question
    public function store(Request $request)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'category_id' => 'nullable|integer|exists:categories,id',
            'title' => 'required|string|max:255',
            'clues' => 'required|array|min:1|max:5',
            'clues.*' => 'required|string',
            'answer' => 'required|string|max:255',
            'hint' => 'nullable|string',
            'level' => 'required|integer|min:1',
            'points' => 'nullable|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        if (!empty($validated['category_id'])) {
            $category = Category::find($validated['category_id']);

            if (!$category || !$category->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected category is inactive or unavailable.',
                ], 422);
            }
        }

        $question = Question::create($validated);

        return response()->json([
            'message' => 'Question created successfully!',
            'question' => $question->load('category'),
        ], 201);
    }

    // Get all questions for admin
    public function adminIndex(Request $request)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        return response()->json([
            'questions' => Question::with('category')
                ->orderBy('level')
                ->orderBy('id')
                ->get(),
        ]);
    }

    // Update question
    public function update(Request $request, Question $question)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $validated = $request->validate([
            'category_id' => 'sometimes|nullable|integer|exists:categories,id',
            'title' => 'sometimes|required|string|max:255',
            'clues' => 'sometimes|required|array|min:1|max:5',
            'clues.*' => 'required|string',
            'answer' => 'sometimes|required|string|max:255',
            'hint' => 'nullable|string',
            'level' => 'sometimes|required|integer|min:1',
            'points' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        if (!empty($validated['category_id'])) {
            $category = Category::find($validated['category_id']);

            if (!$category || !$category->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected category is inactive or unavailable.',
                ], 422);
            }
        }

        $question->update($validated);

        return response()->json([
            'message' => 'Question updated successfully!',
            'question' => $question->fresh()->load('category'),
        ]);
    }

    // Delete question
    public function destroy(Request $request, Question $question)
    {
        if ($error = $this->checkAdmin($request)) {
            return $error;
        }

        $question->delete();

        return response()->json([
            'message' => 'Question deleted successfully!',
        ]);
    }
}
