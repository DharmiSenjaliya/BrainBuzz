<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class DailyGameAiService
{
    public function generate(string $gameType, string $date): array
    {
        $apiKey = config('services.openai.api_key');

        if (!$apiKey) {
            throw new RuntimeException('OpenAI API key is missing.');
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
            'logic_detective' => 'Use clues containing logical detective clues.',
            'pattern_master' => 'Use sequence containing a number or symbol pattern.',
            'visual_detective' => 'Use an emoji-based visual puzzle in prompt. image_url must be null.',
            'number_ninja' => 'Use math_puzzle containing a mathematical puzzle.',
            'weekend_surprise' => 'Create exactly one question of each of the five puzzle types. Set correct item_type for every question.',
        ];

        $prompt = "
Create a BrainBuzz daily mini game.

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

Return only valid JSON:
{
  \"title\": \"Game title\",
  \"instructions\": \"How to play\",
  \"items\": [
    {
      \"id\": \"item-1\",
      \"item_type\": \"word_shuffle\",
      \"prompt\": \"Arrange the letters to make a word\",
      \"scrambled_word\": \"LEAP\",
      \"clues\": null,
      \"sequence\": null,
      \"math_puzzle\": null,
      \"answer\": \"PALE\",
      \"points\": 20,
      \"options\": null,
      \"image_url\": null,
      \"explanation\": \"The letters form PALE.\"
    }
  ]
}
";

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->timeout(90)
            ->post('https://api.openai.com/v1/responses', [
                'model' => config('services.openai.model', 'gpt-4o-mini'),
                'input' => $prompt,
                'text' => [
                    'format' => ['type' => 'json_object'],
                ],
            ]);

        if (!$response->successful()) {
            throw new RuntimeException('OpenAI request failed.');
        }

        $output = collect($response->json('output', []))
            ->flatMap(fn ($item) => $item['content'] ?? [])
            ->firstWhere('type', 'output_text');

        if (!$output || empty($output['text'])) {
            throw new RuntimeException('OpenAI returned empty content.');
        }

        $generated = json_decode($output['text'], true);

        if (!is_array($generated) || count($generated['items'] ?? []) !== 5) {
            throw new RuntimeException('AI must generate exactly 5 questions.');
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

        foreach ($generated['items'] as &$item) {
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

            if (empty($item[$requiredField])) {
                throw new RuntimeException('AI generated incomplete puzzle content.');
            }

            $item['id'] = (string) Str::uuid();
            $item['item_type'] = $itemType;
            $item['points'] = 20;
            $item['answer'] = trim((string) ($item['answer'] ?? ''));

            if ($item['answer'] === '') {
                throw new RuntimeException('AI generated an empty answer.');
            }

            $item['options'] = null;
            $item['image_url'] = null;
            $item['explanation'] = $item['explanation'] ?? 'Review the puzzle solution.';
        }

        unset($item);

        return [
            'game_type' => $gameType,
            'challenge_date' => $date,
            'title' => $generated['title'] ?? 'Daily Mini Game',
            'instructions' => $generated['instructions'] ?? 'Complete all puzzles.',
            'difficulty' => 'medium',
            'duration_seconds' => 120,
            'total_points' => 100,
            'bonus_points' => 20,
            'generation_source' => 'ai',
            'items' => $generated['items'],
        ];
    }
}