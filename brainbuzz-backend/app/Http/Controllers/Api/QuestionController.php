<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Question;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
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

    public function adminIndex()
    {
        return response()->json([
            'questions' => Question::orderBy('level')
                ->orderBy('id')
                ->get(),
        ]);
    }

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

    public function destroy(Question $question)
    {
        $question->delete();

        return response()->json([
            'message' => 'Question deleted successfully!',
        ]);
    }
}