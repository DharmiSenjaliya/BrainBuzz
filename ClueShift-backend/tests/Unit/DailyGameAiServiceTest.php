<?php

namespace Tests\Unit;

use App\Services\DailyGameAiService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use Tests\TestCase;

class DailyGameAiServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.gemini.api_key' => 'test-only-gemini-key',
            'services.gemini.model' => 'gemini-3.8-flash',
        ]);
    }

    public function test_it_returns_five_normalized_weekend_questions_and_uses_gemini_json_mode(): void
    {
        $types = [
            'word_shuffle',
            'logic_detective',
            'pattern_master',
            'visual_detective',
            'number_ninja',
        ];
        $items = array_map(
            fn (string $type, int $index) => $this->makeItem($type, $index),
            $types,
            array_keys($types)
        );
        $json = json_encode([
            'title' => 'Weekend Puzzles',
            'instructions' => 'Solve every puzzle.',
            'items' => $items,
        ], JSON_THROW_ON_ERROR);

        Http::fake([
    'https://generativelanguage.googleapis.com/v1beta/interactions' => Http::response([
        'id' => 'test-interaction-123',
        'status' => 'in_progress',
    ]),
    'https://generativelanguage.googleapis.com/v1beta/interactions/test-interaction-123' => Http::sequence()
        ->push([
            'id' => 'test-interaction-123',
            'status' => 'completed',
            'steps' => [
                [
                    'type' => 'model_output',
                    'content' => [
                        ['type' => 'text', 'text' => $json],
                    ],
                ],
            ],
        ]),
]);

        $game = app(DailyGameAiService::class)->generate('weekend_surprise', '2026-11-15');

        $this->assertCount(5, $game['items']);
        $this->assertEqualsCanonicalizing($types, array_column($game['items'], 'item_type'));
        $this->assertCount(5, array_unique(array_column($game['items'], 'id')));

        $expectedFields = [
            'id',
            'item_type',
            'prompt',
            'scrambled_word',
            'clues',
            'sequence',
            'math_puzzle',
            'answer',
            'points',
            'options',
            'image_url',
            'explanation',
        ];

        foreach ($game['items'] as $item) {
            $this->assertSame($expectedFields, array_keys($item));
            $this->assertSame(20, $item['points']);
            $this->assertNotSame('', $item['answer']);
            $this->assertNotSame('', $item['explanation']);
            $this->assertArrayNotHasKey('accepted_answers', $item);
        }

        Http::assertSent(function (Request $request): bool {
            $data = $request->data();

            return str_ends_with($request->url(), '/v1beta/interactions')
            && $request->hasHeader('x-goog-api-key', 'test-only-gemini-key')
            && ($data['model'] ?? null) === 'gemini-3.8-flash'
            && isset($data['input'])
            && ($data['background'] ?? null) === true
            && ($data['store'] ?? null) === true;
        });
    }

    public function test_it_reports_missing_key_without_sending_a_request(): void
    {
        config(['services.gemini.api_key' => null]);
        Http::fake();

        try {
            app(DailyGameAiService::class)->generate('word_shuffle', '2026-11-15');
            $this->fail('Expected missing-key exception.');
        } catch (RuntimeException $exception) {
            $this->assertSame(
                'Gemini API key is missing. Set GEMINI_API_KEY in the backend environment.',
                $exception->getMessage()
            );
        }

        Http::assertNothingSent();
    }

    #[DataProvider('geminiHttpErrors')]
    public function test_it_maps_gemini_http_errors_to_safe_messages(int $status, string $expectedMessage): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'error' => ['message' => 'private provider response'],
            ], $status),
        ]);

        try {
            app(DailyGameAiService::class)->generate('word_shuffle', '2026-11-15');
            $this->fail("Expected HTTP {$status} exception.");
        } catch (RuntimeException $exception) {
            $this->assertSame($expectedMessage, $exception->getMessage());
            $this->assertStringNotContainsString('private provider response', $exception->getMessage());
        }
    }

    public static function geminiHttpErrors(): array
    {
        return [
            'bad request' => [400, 'Gemini rejected the request. Check the model and request format.'],
            'invalid key' => [401, 'Gemini authentication failed. Check GEMINI_API_KEY and API access.'],
            'forbidden' => [403, 'Gemini authentication failed. Check GEMINI_API_KEY and API access.'],
            'rate limit' => [429, 'Gemini quota or rate limit exceeded. Check your Google AI Studio limits and retry later.'],
            'server error' => [500, 'Gemini is temporarily unavailable. Please try again later.'],
            'unavailable' => [503, 'Gemini is temporarily unavailable. Please try again later.'],
        ];
    }

    public function test_it_rejects_empty_responses(): void
    {
        Http::fake([
    'https://generativelanguage.googleapis.com/v1beta/interactions' => Http::response([
        'id' => 'empty-test-interaction',
        'status' => 'in_progress',
    ]),
    'https://generativelanguage.googleapis.com/v1beta/interactions/empty-test-interaction' => Http::response([
        'id' => 'empty-test-interaction',
        'status' => 'completed',
        'steps' => [],
    ]),
]);

        try {
            app(DailyGameAiService::class)->generate('word_shuffle', '2026-11-15');
            $this->fail('Expected empty-response exception.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Gemini returned an empty response.', $exception->getMessage());
        }
    }

    public function test_it_rejects_invalid_json_responses(): void
    {
        Http::fake([
    'https://generativelanguage.googleapis.com/v1beta/interactions' => Http::response([
        'id' => 'invalid-json-test-interaction',
        'status' => 'in_progress',
    ]),
    'https://generativelanguage.googleapis.com/v1beta/interactions/invalid-json-test-interaction' => Http::response([
        'id' => 'invalid-json-test-interaction',
        'status' => 'completed',
        'steps' => [
            [
                'type' => 'model_output',
                'content' => [
                    ['type' => 'text', 'text' => '{invalid json'],
                ],
            ],
        ],
    ]),
]);

        try {
            app(DailyGameAiService::class)->generate('word_shuffle', '2026-11-15');
            $this->fail('Expected invalid-JSON exception.');
        } catch (RuntimeException $exception) {
            $this->assertStringStartsWith(
    'Gemini returned invalid JSON.',
    $exception->getMessage()
);
        }
    }


    public function test_it_hides_provider_details_when_generation_fails(): void
{
    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/interactions' => Http::response([
            'id' => 'failed-test-interaction',
            'status' => 'in_progress',
        ]),
        'https://generativelanguage.googleapis.com/v1beta/interactions/failed-test-interaction' => Http::response([
            'id' => 'failed-test-interaction',
            'status' => 'failed',
            'error' => [
                'message' => 'private provider details',
            ],
        ]),
    ]);

    try {
        app(DailyGameAiService::class)->generate('word_shuffle', '2026-11-15');
        $this->fail('Expected generation failure.');
    } catch (RuntimeException $exception) {
        $this->assertSame(
            'Gemini generation failed. Status: failed. Please try again later.',
            $exception->getMessage()
        );

        $this->assertStringNotContainsString(
            'private provider details',
            $exception->getMessage()
        );
    }
}
    public function test_it_converts_connection_failures_to_a_safe_message(): void
    {
        Http::fake(function () {
            throw new ConnectionException('private transport details');
        });

        try {
            app(DailyGameAiService::class)->generate('word_shuffle', '2026-11-15');
            $this->fail('Expected connection exception.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Unable to connect to Gemini. Please try again later.', $exception->getMessage());
            $this->assertStringNotContainsString('private transport details', $exception->getMessage());
        }
    }

    private function makeItem(string $type, int $index): array
    {
        $requiredContent = [
            'word_shuffle' => ['scrambled_word' => 'ELAP'],
            'logic_detective' => ['clues' => 'A clue for the puzzle.'],
            'pattern_master' => ['sequence' => '2, 4, 6, ?'],
            'visual_detective' => ['prompt' => 'What does this emoji show? 🌧️'],
            'number_ninja' => ['math_puzzle' => 'What is 6 × 7?'],
        ];

        return [
            'id' => 'model-item-' . $index,
            'item_type' => $type,
            'prompt' => 'Puzzle ' . $index,
            'scrambled_word' => null,
            'clues' => null,
            'sequence' => null,
            'math_puzzle' => null,
            ...$requiredContent[$type],
            'answer' => $type === 'word_shuffle' ? 'PALE' : 'Answer ' . $index,
            'points' => 999,
            'options' => ['incorrect', 'correct'],
            'image_url' => 'https://example.test/image.png',
            'explanation' => 'Explanation ' . $index,
            'accepted_answers' => ['Answer ' . $index, 'another answer'],
        ];
    }
}
