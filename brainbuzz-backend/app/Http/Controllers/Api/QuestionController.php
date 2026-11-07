<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Question;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    // Get 5 random active questions for selected level
    public function index(Request $request)
    {
        $validated = $request->validate([
            'level' => 'required|integer|min:1',
        ]);

        $questions = Question::where('level', $validated['level'])
            ->where('is_active', true)
            ->inRandomOrder()
            ->limit(5)
            ->get([
                'id',
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
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'clues' => 'required|array|min:1|max:5',
            'clues.*' => 'required|string',
            'answer' => 'required|string|max:255',
            'hint' => 'nullable|string',
            'level' => 'required|integer|min:1',
            'points' => 'nullable|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $question = Question::create($validated);

        return response()->json([
            'message' => 'Question created successfully!',
            'question' => $question,
        ], 201);
    }

    // Get all questions for admin
    public function adminIndex()
    {
        return response()->json([
            'questions' => Question::orderBy('level')
                ->orderBy('id')
                ->get(),
        ]);
    }

    // Update question
    public function update(Request $request, Question $question)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'clues' => 'sometimes|required|array|min:1|max:5',
            'clues.*' => 'required|string',
            'answer' => 'sometimes|required|string|max:255',
            'hint' => 'nullable|string',
            'level' => 'sometimes|required|integer|min:1',
            'points' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $question->update($validated);

        return response()->json([
            'message' => 'Question updated successfully!',
            'question' => $question->fresh(),
        ]);
    }

    // Delete question
    public function destroy(Question $question)
    {
        $question->delete();

        return response()->json([
            'message' => 'Question deleted successfully!',
        ]);
    }
}