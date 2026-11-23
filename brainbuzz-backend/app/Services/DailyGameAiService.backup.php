<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Http\Client\ConnectionException;
use RuntimeException;

class DailyGameAiService
{
    public function generate(string $gameType, string $date): array
    {
        $apiKey = config('services.gemini.api_key');

        if (!is_string($apiKey) || trim($apiKey) === '') {
            throw new RuntimeException('Gemini API key is missing. Set GEMINI_API_KEY in the backend environment.');
        }

        $types = [
            'word_shuffle',
            'logic_detective',
            'pattern_master',
            'visual_detective',
            'number_ninja',
        ];

        if (!in_array($gameType, [...$types, 'weekend_surprise'], true)) {
            throw new RuntimeException('Invalid daily game type.');
        }

        $typeInstructions = [
            'word_shuffle' => 'Use scrambled_word with shuffled letters.',
            'logic_detective' => 'You MUST provide the clues field as a non-empty string containing 3 to 5 numbered logical clues. Each clue must help solve the puzzle. The answer must be uniquely determined by the clues. Never leave clues null or empty.',
            'pattern_master' => 'Use sequence containing a number or symbol pattern.',
            'visual_detective' => 'Use an emoji-based visual puzzle in prompt. image_url must be null.',
            'number_ninja' => 'Use math_puzzle containing a mathematical puzzle.',
            'weekend_surprise' => 'Create exactly one question of each of the five puzzle types. Set correct item_type for every question.',
        ];

        $prompt = "
Create a ClueShift daily mini game.

Game type: {$gameType}
Date: {$date}

Rules:
- Generate exactly 5 unique questions.
- Medium difficulty.
- Each question must have exactly ONE correct answer.
- Never generate accepted_answers or multiple correct answers.
- Each question has 20 points.
- Every question must have a clear explanation.
- Every question must have a unique id.
- Follow this game instruction: {$typeInstructions[$gameType]}

Each item must contain:
id, item_type, prompt, scrambled_word, clues, sequence,
math_puzzle, answer, points, options, image_url, explanation.

Use null for fields that do not apply.
For weekend_surprise, use all five item types exactly once.

Return only valid JSON with this structure:
{
  \"title\": \"Game title\",
  \"instructions\": \"How to play\",
  \"items\": [
    {
      \"id\": \"item-1\",
      \"item_type\": \"GAME_TYPE\",
      \"prompt\": \"Question text\",
      \"scrambled_word\": null,
      \"clues\": null,
      \"sequence\": null,
      \"math_puzzle\": null,
      \"answer\": \"One exact correct answer\",
      \"points\": 20,
      \"options\": null,
      \"image_url\": null,
      \"explanation\": \"Explain the correct answer\"
    }
  ]
}

Important:
- Generate exactly 5 items.
- For logic_detective, clues MUST be a non-empty string with 3 to 5 numbered clues.
- For word_shuffle, scrambled_word MUST contain shuffled letters.
- For pattern_master, sequence MUST contain a solvable pattern.
- For number_ninja, math_puzzle MUST contain a solvable math puzzle.
- For visual_detective, prompt MUST contain an emoji-based visual puzzle.
- Every answer must be uniquely correct.
- Never leave the required game-specific field empty.
- For weekend_surprise, use all five item types exactly once.
";

        $model = config('services.gemini.model', 'gemini-3.8-flash');

        try {
            $response = Http::withHeaders([
                'x-goog-api-key' => $apiKey,
            ])
                ->acceptJson()
->retry(2, 2000, throw: false)
->timeout(180)
                ->post(
                    'https://generativelanguage.googleapis.com/v1beta/models/'
                    . rawurlencode($model)
                    . ':generateContent',
                    [
                        'contents' => [
                            [
                                'parts' => [
                                    ['text' => $prompt],
                                ],
                            ],
                        ],
                        'generationConfig' => [
    'responseMimeType' => 'application/json',
    'maxOutputTokens' => 4096,
    'thinkingConfig' => [
        'thinkingLevel' => 'low',
    ],
],  
                    ]
                );
        } catch (ConnectionException $e) {
    throw new RuntimeException(
        'Gemini Connection Error: ' . $e->getMessage(),
        0,
        $e
    );
}

        if (!$response->successful()) {
            $message = match ($response->status()) {
                400 => 'Gemini rejected the request. Check the model and request format.',
                401, 403 => 'Gemini authentication failed. Check GEMINI_API_KEY and API access.',
                429 => 'Gemini quota or rate limit exceeded. Check your Google AI Studio limits and retry later.',
                500, 503 => 'Gemini is temporarily unavailable. Please try again later.',
                default => 'Gemini request failed with HTTP ' . $response->status() . '.',
            };

            throw new RuntimeException($message);
        }

        $parts = $response->json('candidates.0.content.parts', []);
        $outputText = collect(is_array($parts) ? $parts : [])
            ->pluck('text')
            ->filter(fn ($text) => is_string($text))
            ->implode('');

        if (trim($outputText) === '') {
            throw new RuntimeException('Gemini returned an empty response.');
        }

        $generated = json_decode($outputText, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($generated)) {
            throw new RuntimeException('Gemini returned invalid JSON.');
        }

        if (!isset($generated['items']) || !is_array($generated['items']) || count($generated['items']) !== 5) {
            throw new RuntimeException('Gemini must generate exactly 5 questions.');
        }

        foreach ($generated['items'] as $item) {
            if (!is_array($item)) {
                throw new RuntimeException('Gemini returned an invalid question.');
            }
        }

        $allowedItemTypes = $types;

        if ($gameType === 'weekend_surprise') {
            $itemTypes = array_column($generated['items'], 'item_type');

            sort($itemTypes);
            $expectedTypes = $types;
            sort($expectedTypes);

            if ($itemTypes !== $expectedTypes) {
                throw new RuntimeException('Weekend Surprise must contain all five puzzle types exactly once.');
            }
        }

        foreach ($generated['items'] as $index => $item) {
            $itemType = $gameType === 'weekend_surprise'
                ? ($item['item_type'] ?? '')
                : $gameType;

            if (!in_array($itemType, $allowedItemTypes, true)) {
                throw new RuntimeException('AI generated an invalid puzzle type.');
            }

            $requiredField = [
                'word_shuffle' => 'scrambled_word',
                'logic_detective' => 'clues',
                'pattern_master' => 'sequence',
                'visual_detective' => 'prompt',
                'number_ninja' => 'math_puzzle',
            ][$itemType];

            if (!isset($item[$requiredField]) || !is_string($item[$requiredField]) || trim($item[$requiredField]) === '') {
                throw new RuntimeException('AI generated incomplete puzzle content.');
            }

            $answer = $item['answer'] ?? null;

            if (!is_string($answer) || trim($answer) === '') {
                throw new RuntimeException('AI generated an empty answer.');
            }

            $explanation = $item['explanation'] ?? null;
            $generated['items'][$index] = [
                'id' => (string) Str::uuid(),
                'item_type' => $itemType,
                'prompt' => is_string($item['prompt'] ?? null) ? $item['prompt'] : null,
                'scrambled_word' => is_string($item['scrambled_word'] ?? null) ? $item['scrambled_word'] : null,
                'clues' => is_string($item['clues'] ?? null) ? $item['clues'] : null,
                'sequence' => is_string($item['sequence'] ?? null) ? $item['sequence'] : null,
                'math_puzzle' => is_string($item['math_puzzle'] ?? null) ? $item['math_puzzle'] : null,
                'answer' => trim($answer),
                'points' => 20,
                'options' => null,
                'image_url' => null,
                'explanation' => is_string($explanation) && trim($explanation) !== ''
                    ? trim($explanation)
                    : 'Review the puzzle solution.',
            ];
        }

        return [
            'game_type' => $gameType,
            'challenge_date' => $date,
            'title' => is_string($generated['title'] ?? null) && trim($generated['title']) !== ''
                ? trim($generated['title'])
                : 'Daily Mini Game',
            'instructions' => is_string($generated['instructions'] ?? null) && trim($generated['instructions']) !== ''
                ? trim($generated['instructions'])
                : 'Complete all puzzles.',
            'difficulty' => 'medium',
            'duration_seconds' => 120,
            'total_points' => 100,
            'bonus_points' => 20,
            'generation_source' => 'ai',
            'items' => $generated['items'],
        ];
    }
}