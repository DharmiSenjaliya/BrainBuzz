<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\Request;

class AdminFeedbackController extends Controller
{
    // Get all feedback
    public function index(Request $request)
    {
        // Check admin authorization
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        // Get all feedback with user details
        $feedback = Feedback::with('user:id,name,email')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'feedback' => $feedback,
        ]);
    }

    // Delete feedback
    public function destroy(Request $request, $id)
    {
        // Check admin authorization
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        // Find feedback
        $feedback = Feedback::find($id);

        if (!$feedback) {
            return response()->json([
                'success' => false,
                'message' => 'Feedback not found.',
            ], 404);
        }

        // Delete feedback
        $feedback->delete();

        return response()->json([
            'success' => true,
            'message' => 'Feedback deleted successfully.',
        ]);
    }
}
