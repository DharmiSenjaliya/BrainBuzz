<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // Get logged-in user's notifications
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->latest()
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->data['type'] ?? 'general',
                    'title' => $notification->data['title'] ?? 'Notification',
                    'message' => $notification->data['message'] ?? '',
                    'is_read' => !is_null($notification->read_at),
                    'created_at' => $notification->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    // Mark one notification as read
    public function markAsRead(Request $request, string $id)
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ]);
    }

    // Mark all notifications as read
    public function markAllAsRead(Request $request)
    {
        $request->user()
            ->unreadNotifications()
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.',
        ]);
    }

    // Delete one notification
    public function destroy(Request $request, string $id)
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->firstOrFail();

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted successfully.',
        ]);
    }
}
