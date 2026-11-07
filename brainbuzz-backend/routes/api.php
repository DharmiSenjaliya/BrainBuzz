<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\GameResultController;

// Public Authentication Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Protected Player Routes
Route::middleware('auth:sanctum')->group(function () {
    // Game Results & Dashboard
    Route::post('/game-results', [GameResultController::class, 'store']);

    Route::get('/dashboard', [GameResultController::class, 'dashboard']);
    Route::get('/level-progress', [GameResultController::class, 'levelProgress']);

    Route::get('/game-history', [GameResultController::class, 'history']);
Route::get('/leaderboard', [GameResultController::class, 'leaderboard']);

    Route::post('/logout', [AuthController::class, 'logout']);
Route::post('/change-password', [AuthController::class, 'changePassword']);

    Route::get('/me', [AuthController::class, 'me']);

    Route::post('/profile/update', [ProfileController::class, 'update']);

    Route::get('/questions', [QuestionController::class, 'index']);
Route::post('/check-answer', [QuestionController::class, 'checkAnswer']);

    Route::post('/questions', [QuestionController::class, 'store']);

    Route::get('/admin/questions', [QuestionController::class, 'adminIndex']);

    Route::put('/questions/{question}', [QuestionController::class, 'update']);

    Route::delete('/questions/{question}', [QuestionController::class, 'destroy']);
});