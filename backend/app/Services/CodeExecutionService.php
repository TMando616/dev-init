<?php

namespace App\Services;

use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;

class CodeExecutionService
{
    protected const TIMEOUT = 3; // seconds
    protected const MEMORY_LIMIT = '128m';

    /**
     * Supported languages and their docker configurations
     */
    protected array $languages = [
        'php' => [
            'image' => 'php:8.4-cli-alpine',
            'command' => 'php',
            'extension' => 'php',
        ],
        'python' => [
            'image' => 'python:3.12-alpine',
            'command' => 'python',
            'extension' => 'py',
        ],
        'javascript' => [
            'image' => 'node:22-alpine',
            'command' => 'node',
            'extension' => 'js',
        ],
        'ruby' => [
            'image' => 'ruby:3.3-alpine',
            'command' => 'ruby',
            'extension' => 'rb',
        ],
        'java' => [
            'image' => 'amazoncorretto:21-alpine',
            'command' => 'java',
            'extension' => 'java',
        ],
    ];

    /**
     * Execute the given code in a isolated Docker container.
     */
    public function execute(string $language, string $code): array
    {
        if (!isset($this->languages[$language])) {
            return [
                'status' => 'error',
                'stdout' => '',
                'stderr' => "Unsupported language: {$language}",
                'execution_time_ms' => 0,
            ];
        }

        $config = $this->languages[$language];
        $tempDir = storage_path('app/temp_code');
        if (!File::exists($tempDir)) {
            File::makeDirectory($tempDir, 0755, true);
        }

        $fileName = Str::random(10) . '.' . $config['extension'];
        $filePath = $tempDir . '/' . $fileName;
        File::put($filePath, $code);

        // Docker command construction
        // Note: Using --rm to clean up container after exit
        // Using --network none for security
        // Using -v to mount the temporary file
        $dockerCommand = [
            'docker', 'run', '--rm',
            '--network', 'none',
            '--memory', self::MEMORY_LIMIT,
            '--read-only',
            '-v', "{$filePath}:/tmp/code.{$config['extension']}:ro",
            $config['image'],
            $config['command'], "/tmp/code.{$config['extension']}"
        ];

        $process = new Process($dockerCommand);
        $process->setTimeout(self::TIMEOUT);

        $start = microtime(true);
        try {
            $process->run();
            $end = microtime(true);
            $executionTimeMs = round(($end - $start) * 1000);

            return [
                'status' => $process->isSuccessful() ? 'success' : 'error',
                'stdout' => $process->getOutput(),
                'stderr' => $process->getErrorOutput(),
                'execution_time_ms' => $executionTimeMs,
            ];
        } catch (ProcessTimedOutException $e) {
            return [
                'status' => 'timeout',
                'stdout' => $process->getOutput(),
                'stderr' => "Execution timed out after " . self::TIMEOUT . " seconds.",
                'execution_time_ms' => self::TIMEOUT * 1000,
            ];
        } catch (\Exception $e) {
            Log::error('Code execution failed: ' . $e->getMessage());
            return [
                'status' => 'error',
                'stdout' => '',
                'stderr' => 'An internal error occurred during execution.',
                'execution_time_ms' => 0,
            ];
        } finally {
            if (File::exists($filePath)) {
                File::delete($filePath);
            }
        }
    }
}
