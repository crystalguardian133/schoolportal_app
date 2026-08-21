<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class CaptchaService
{
    private const TTL_SECONDS = 600;

    /**
     * Issue a fresh randomized challenge. Called every time a suspicious
     * login attempt fails, so the user always gets a brand-new puzzle.
     */
    public function challenge(): array
    {
        $types = [
            'arithmetic',
            'wordProblem',
            'sequence',
            'reverseWord',
            'countLetters',
            'comparison',
            'missingNumber',
        ];

        $type = $types[array_rand($types)];
        [$question, $answer] = $this->{$type}();

        $token = Str::random(40);

        Cache::put($this->key($token), $this->normalize($answer), self::TTL_SECONDS);

        return [
            'token' => $token,
            'question' => $question,
        ];
    }

    public function verify(?string $token, ?string $answer): bool
    {
        if (!$token || $answer === null || trim($answer) === '') {
            return false;
        }

        $expected = Cache::pull($this->key($token));

        if ($expected === null) {
            return false;
        }

        return $this->normalize($answer) === $expected;
    }

    private function normalize(?string $value): string
    {
        return mb_strtolower(preg_replace('/\s+/u', '', (string) $value));
    }

    private function key(string $token): string
    {
        return 'captcha:' . hash('sha256', $token);
    }

    // ------------------------------------------------------------------
    // Challenge generators — each returns [question, answer]
    // ------------------------------------------------------------------

    private function arithmetic(): array
    {
        $a = random_int(2, 12);
        $b = random_int(2, 12);

        return match (random_int(0, 2)) {
            0 => ["What is $a + $b?", (string) ($a + $b)],
            1 => [
                $a >= $b ? "What is $a − $b?" : "What is $b − $a?",
                (string) abs($a - $b),
            ],
            default => ["What is $a × $b?", (string) ($a * $b)],
        };
    }

    private function wordProblem(): array
    {
        $n = random_int(5, 30);
        $k = random_int(2, 15);

        $problems = [
            "add" => [
                "$n students joined the field trip. $k more joined later. How many students went in all?",
                (string) ($n + $k),
            ],
            "canteen" => [
                "The canteen sold $n pandesal this morning and $k more at recess. How many pandesal were sold in total?",
                (string) ($n + $k),
            ],
            "subtract" => [
                "There were $n chairs in the classroom. $k were moved out. How many chairs remained?",
                (string) ($n - $k),
            ],
            "jeepney" => [
                "A jeepney left the terminal with $n passengers. $k got off at the next stop. How many passengers are left?",
                (string) max(0, $n - $k),
            ],
        ];

        $pick = $problems[array_rand($problems)];

        return [$pick[0], $pick[1]];
    }

    private function sequence(): array
    {
        $start = random_int(1, 15);
        $step = random_int(2, 9);

        $terms = [$start, $start + $step, $start + 2 * $step, $start + 3 * $step];
        $next = $start + 4 * $step;

        return [
            'What number comes next: ' . implode(', ', $terms) . ', __?',
            (string) $next,
        ];
    }

    private function reverseWord(): array
    {
        $words = ['school', 'student', 'teacher', 'portal', 'library', 'pencil', 'notebook', 'classroom'];
        $word = $words[array_rand($words)];

        return [
            "Type the word \"" . strtoupper($word) . "\" backwards.",
            strrev($word),
        ];
    }

    private function countLetters(): array
    {
        $puzzles = [
            ['BANANA', 'A', 3],
            ['MISSISSIPPI', 'S', 4],
            ['SUCCESS', 'S', 3],
            ['ELEMENTARY', 'E', 3],
            ['BANANA', 'N', 2],
        ];

        [$word, $letter, $count] = $puzzles[array_rand($puzzles)];

        return [
            "How many times does the letter \"$letter\" appear in $word?",
            (string) $count,
        ];
    }

    private function comparison(): array
    {
        $a = random_int(10, 99);
        $b = random_int(10, 99);

        while ($a === $b) {
            $b = random_int(10, 99);
        }

        if (random_int(0, 1) === 1) {
            return ["Which is larger: $a or $b? Type the number.", (string) max($a, $b)];
        }

        return ["Which is smaller: $a or $b? Type the number.", (string) min($a, $b)];
    }

    private function missingNumber(): array
    {
        $start = random_int(1, 12);
        $step = random_int(2, 8);

        $terms = [$start, $start + $step, null, $start + 3 * $step, $start + 4 * $step];
        $answer = $start + 2 * $step;

        $display = implode(', ', array_map(
            fn ($t) => $t === null ? '__' : (string) $t,
            $terms,
        ));

        return ["Fill in the missing number: $display", (string) $answer];
    }
}
