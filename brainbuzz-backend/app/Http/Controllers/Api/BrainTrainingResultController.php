<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BrainTrainingResult;
use Illuminate\Http\Request;

class BrainTrainingResultController extends Controller
{
    // Save Brain Training Result
    public function store(Request $request)
    {
        $validated = $request->validate([
            'game_type' => 'required|in:memory,number,reaction,pattern',
            'score' => 'required|integer|min:0',
            'best_result' => 'required|integer|min:0',
            'completed' => 'required|boolean',
            'details' => 'nullable|array',
        ]);

        $result = BrainTrainingResult::create([
            'user_id' => $request->user()->id,
            'game_type' => $validated['game_type'],
            'score' => $validated['score'],
            'best_result' => $validated['best_result'],
            'completed' => $validated['completed'],
            'details' => $validated['details'] ?? null,
        ]);

        return response()->json([
            'message' => 'Brain Training result saved successfully!',
            'result' => $result,
        ], 201);
    }

    // Get Logged-in Player's Brain Training History
    public function history(Request $request)
    {
        $results = BrainTrainingResult::where(
            'user_id',
            $request->user()->id
        )
            ->latest()
            ->get();

        return response()->json([
            'results' => $results,
        ]);
    }
}
