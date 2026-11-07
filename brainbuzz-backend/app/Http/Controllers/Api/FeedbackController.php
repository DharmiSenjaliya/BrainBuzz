<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    // Submit player feedback
    public function store(Request $request)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'message' => 'required|string|min:3|max:1000',
        ]);

        $feedback = Feedback::create([
            'user_id' => $request->user()->id,
            'rating' => $validated['rating'],
            'message' => $validated['message'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thank you! Your feedback has been submitted.',
            'feedback' => $feedback,
        ], 201);
    }
}